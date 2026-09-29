import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import Database from 'better-sqlite3';
import { demoDecisions } from '../../fixtures/demo-decisions.js';
import { validateDecision } from '../memory-ai.js';

const now = () => new Date().toISOString();
const decode = (row) => row ? JSON.parse(row.payload) : null;
const tokenHash = (token) => createHash('sha256').update(token).digest('hex');

function initialState(path, seeds) {
  if (!path || !existsSync(path)) {
    const decisions = seeds.map(record => ({ ...structuredClone(record),
      createdAt: record.date + 'T00:00:00.000Z', collection_id: 'demo' }));
    return { collections: [{ id: 'demo', name: 'Engineering examples' }], decisions,
      events: decisions.map(record => ({ id: randomUUID(), collection_id: 'demo',
        decision_id: record.id, kind: 'recorded', at: record.createdAt, title: record.title })) };
  }
  const state = JSON.parse(readFileSync(path, 'utf8'));
  if (![1, 2, 3].includes(state.version) || !Array.isArray(state.decisions) ||
      state.decisions.some(record => typeof record.id !== 'string') ||
      new Set(state.decisions.map(record => record.id)).size !== state.decisions.length) {
    throw new Error('Legacy decision storage is invalid. Restore a valid backup before starting the server.');
  }
  const decisions = state.decisions.map(record => ({ ...record, collection_id: record.collection_id || 'demo' }));
  const collections = state.collections || [{ id: 'demo', name: 'Engineering examples' }];
  const events = state.events || decisions.map(record => ({ id: randomUUID(),
    collection_id: record.collection_id, decision_id: record.id, kind: 'recorded',
    at: record.createdAt || record.date + 'T00:00:00.000Z', title: record.title }));
  if (!collections.some(item => item.id === 'demo') ||
      decisions.some(record => !collections.some(item => item.id === record.collection_id)) ||
      events.some(event => !collections.some(item => item.id === event.collection_id))) {
    throw new Error('Legacy decision collections are invalid. Restore a valid backup before starting the server.');
  }
  return { collections, decisions, events };
}

export class DecisionModel {
  constructor({ filePath = resolve(process.env.DECISION_DB_PATH || 'data/precedent.sqlite'),
    legacyPath = resolve(process.env.DECISION_STORE_PATH || 'data/decisions.json'),
    seeds = demoDecisions } = {}) {
    if (filePath) mkdirSync(dirname(filePath), { recursive: true });
    this.db = new Database(filePath || ':memory:');
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('busy_timeout = 5000');
    this.db.exec(
      'CREATE TABLE IF NOT EXISTS collections (id TEXT PRIMARY KEY,name TEXT NOT NULL,created_at TEXT,owner_id TEXT);' +
      "CREATE TABLE IF NOT EXISTS decisions (id TEXT PRIMARY KEY,collection_id TEXT NOT NULL REFERENCES collections(id),payload TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('pending','ready','failed')),created_at TEXT NOT NULL);" +
      'CREATE INDEX IF NOT EXISTS decisions_collection ON decisions(collection_id,status);' +
      'CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY,collection_id TEXT NOT NULL REFERENCES collections(id),decision_id TEXT NOT NULL REFERENCES decisions(id),kind TEXT NOT NULL,at TEXT NOT NULL,payload TEXT NOT NULL);' +
      'CREATE INDEX IF NOT EXISTS events_collection ON events(collection_id,at);' +
      "CREATE TABLE IF NOT EXISTS outbox (decision_id TEXT PRIMARY KEY REFERENCES decisions(id),collection_id TEXT NOT NULL,state TEXT NOT NULL CHECK(state IN ('pending','processing','done','failed')),attempts INTEGER NOT NULL DEFAULT 0,due_at INTEGER NOT NULL DEFAULT 0,lease_until INTEGER NOT NULL DEFAULT 0,error TEXT);" +
      'CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY,name TEXT NOT NULL UNIQUE,token_hash TEXT NOT NULL UNIQUE,created_at TEXT NOT NULL);' +
      'CREATE TABLE IF NOT EXISTS sources (id TEXT PRIMARY KEY,decision_id TEXT NOT NULL UNIQUE REFERENCES decisions(id),collection_id TEXT NOT NULL REFERENCES collections(id),filename TEXT,source_url TEXT,sha256 TEXT NOT NULL,content TEXT NOT NULL,passages TEXT NOT NULL,reviewer_id TEXT NOT NULL REFERENCES users(id),created_at TEXT NOT NULL);'
    );
    if (this.db.prepare('SELECT COUNT(*) AS total FROM collections').get().total === 0) {
      const snapshot = initialState(filePath ? legacyPath : null, seeds);
      this.db.transaction(() => {
        for (const item of snapshot.collections) this.db.prepare(
          'INSERT INTO collections (id,name,created_at) VALUES (?,?,?)'
        ).run(item.id, item.name, item.createdAt || null);
        for (const record of snapshot.decisions) this.insertReady(record, false);
        for (const event of snapshot.events) this.insertEvent(event);
      })();
    }
  }

  close() { this.db.close(); }
  insertEvent(event) {
    this.db.prepare('INSERT INTO events (id,collection_id,decision_id,kind,at,payload) VALUES (?,?,?,?,?,?)')
      .run(event.id, event.collection_id, event.decision_id, event.kind, event.at, JSON.stringify(event));
  }
  insertReady(record, addEvent = true) {
    this.db.prepare('INSERT INTO decisions (id,collection_id,payload,status,created_at) VALUES (?,?,?,?,?)')
      .run(record.id, record.collection_id, JSON.stringify(record), 'ready', record.createdAt || now());
    if (addEvent) this.insertEvent({ id: randomUUID(), collection_id: record.collection_id,
      decision_id: record.id, kind: 'recorded', at: record.createdAt || now(), title: record.title });
  }
  listCollections(ownerId = null) {
    const rows = ownerId
      ? this.db.prepare('SELECT id,name,created_at AS createdAt,owner_id AS ownerId FROM collections WHERE owner_id=? ORDER BY rowid').all(ownerId)
      : this.db.prepare('SELECT id,name,created_at AS createdAt,owner_id AS ownerId FROM collections ORDER BY rowid').all();
    return rows.map(({ id, name, createdAt, ownerId: owner }) => ({ id, name,
        ...(createdAt ? { createdAt } : {}), ...(owner ? { ownerId: owner } : {}) }));
  }
  getCollection(id, ownerId = null) { return this.listCollections(ownerId).find(item => item.id === id) || null; }
  createCollection(name, ownerId = null) {
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 80)
      throw new TypeError('Collection name must contain 1–80 characters.');
    const item = { id: randomUUID(), name: name.trim(), createdAt: now() };
    this.db.prepare('INSERT INTO collections (id,name,created_at,owner_id) VALUES (?,?,?,?)')
      .run(item.id, item.name, item.createdAt, ownerId);
    return item;
  }
  createUser(name) {
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 80)
      throw new TypeError('User name must contain 1–80 characters.');
    const token = randomBytes(32).toString('base64url');
    const user = { id: randomUUID(), name: name.trim(), createdAt: now() };
    this.db.transaction(() => {
      const firstUser = this.db.prepare('SELECT COUNT(*) AS total FROM users').get().total === 0;
      this.db.prepare('INSERT INTO users (id,name,token_hash,created_at) VALUES (?,?,?,?)')
        .run(user.id, user.name, tokenHash(token), user.createdAt);
      if (firstUser) {
        this.db.prepare('UPDATE collections SET owner_id=? WHERE owner_id IS NULL').run(user.id);
      } else {
        this.createCollection(user.name + ' decisions', user.id);
      }
    })();
    return { ...user, token };
  }
  getUserByToken(token) {
    if (typeof token !== 'string' || token.length !== 43 || !/^[A-Za-z0-9_-]+$/.test(token)) return null;
    const row = this.db.prepare('SELECT id,name,created_at AS createdAt FROM users WHERE token_hash=?')
      .get(tokenHash(token));
    return row || null;
  }
  rotateUserToken(name) {
    const token = randomBytes(32).toString('base64url');
    const result = this.db.prepare('UPDATE users SET token_hash=? WHERE name=?').run(tokenHash(token), name);
    if (!result.changes) throw new TypeError('User not found.');
    return token;
  }
  getAll(collectionId = 'demo') {
    return this.db.prepare("SELECT payload FROM decisions WHERE collection_id=? AND status='ready' ORDER BY rowid")
      .all(collectionId).map(decode);
  }
  getById(id, collectionId = 'demo') {
    return decode(this.db.prepare("SELECT payload FROM decisions WHERE id=? AND collection_id=? AND status='ready'")
      .get(id, collectionId));
  }
  getPending(collectionId = 'demo') {
    return this.db.prepare("SELECT d.payload,d.status,o.error FROM decisions d JOIN outbox o ON o.decision_id=d.id WHERE d.collection_id=? AND d.status!='ready' ORDER BY d.rowid")
      .all(collectionId).map(row => ({ ...decode(row), retention_status: row.status, retention_error: row.error }));
  }
  getTimeline(collectionId = 'demo') {
    return this.db.prepare('SELECT payload FROM events WHERE collection_id=? ORDER BY at,rowid')
      .all(collectionId).map(decode);
  }
  prepare(data, collectionId = 'demo') {
    if (!this.getCollection(collectionId)) throw new TypeError('Unknown decision collection.');
    const createdAt = now();
    return { ...validateDecision({ ...data, id: randomUUID(), date: data.date || createdAt.slice(0, 10) }),
      createdAt, collection_id: collectionId };
  }
  queue(record, source = null) {
    if (!this.getCollection(record.collection_id)) throw new TypeError('Unknown decision collection.');
    this.db.transaction(() => {
      this.db.prepare('INSERT INTO decisions (id,collection_id,payload,status,created_at) VALUES (?,?,?,?,?)')
        .run(record.id, record.collection_id, JSON.stringify(record), 'pending', record.createdAt);
      this.db.prepare("INSERT INTO outbox (decision_id,collection_id,state) VALUES (?,?,'pending')")
        .run(record.id, record.collection_id);
      if (source) {
        this.db.prepare('INSERT INTO sources (id,decision_id,collection_id,filename,source_url,sha256,content,passages,reviewer_id,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
          .run(source.id, record.id, record.collection_id, source.filename, source.source_url,
            source.sha256, source.content, JSON.stringify(source.passages), source.reviewer_id, now());
      }
    })();
    return structuredClone(record);
  }
  getSource(decisionId, collectionId) {
    const row = this.db.prepare('SELECT id,filename,source_url,sha256,content,passages,created_at FROM sources WHERE decision_id=? AND collection_id=?')
      .get(decisionId, collectionId);
    return row ? { id: row.id, filename: row.filename, source_url: row.source_url,
      sha256: row.sha256, content: row.content, passages: JSON.parse(row.passages),
      created_at: row.created_at } : null;
  }
  dueRetentionIds(limit = 20) {
    return this.db.prepare("SELECT decision_id FROM outbox WHERE (state='pending' AND due_at<=?) OR (state='processing' AND lease_until<=?) ORDER BY rowid LIMIT ?")
      .all(Date.now(), Date.now(), limit).map(row => row.decision_id);
  }
  claimRetention(id) {
    return this.db.transaction(() => {
      const job = this.db.prepare('SELECT * FROM outbox WHERE decision_id=?').get(id);
      if (!job || !((job.state === 'pending' && job.due_at <= Date.now()) ||
          (job.state === 'processing' && job.lease_until <= Date.now()))) return null;
      this.db.prepare("UPDATE outbox SET state='processing',attempts=attempts+1,lease_until=? WHERE decision_id=?")
        .run(Date.now() + 120000, id);
      return decode(this.db.prepare('SELECT payload FROM decisions WHERE id=?').get(id));
    })();
  }
  markRetained(id) {
    this.db.transaction(() => {
      const row = this.db.prepare('SELECT payload,status FROM decisions WHERE id=?').get(id);
      if (!row || row.status === 'ready') return;
      const record = decode(row);
      this.db.prepare("UPDATE decisions SET status='ready' WHERE id=?").run(id);
      this.db.prepare("UPDATE outbox SET state='done',error=NULL,lease_until=0 WHERE decision_id=?").run(id);
      this.insertEvent({ id: randomUUID(), collection_id: record.collection_id, decision_id: id,
        kind: 'recorded', at: now(), title: record.title });
    })();
  }
  markRetentionFailure(id, message, retryable = true) {
    const job = this.db.prepare('SELECT attempts FROM outbox WHERE decision_id=?').get(id);
    if (!job) return;
    const state = retryable ? 'pending' : 'failed';
    const delay = retryable ? Math.min(60000, 1000 * 2 ** Math.min(job.attempts, 6)) : 0;
    this.db.transaction(() => {
      this.db.prepare('UPDATE decisions SET status=? WHERE id=?').run(retryable ? 'pending' : 'failed', id);
      this.db.prepare('UPDATE outbox SET state=?,due_at=?,lease_until=0,error=? WHERE decision_id=?')
        .run(state, Date.now() + delay, String(message).slice(0, 250), id);
    })();
  }
  retryRetention(id, collectionId) {
    const result = this.db.prepare("UPDATE outbox SET state='pending',due_at=0,error=NULL WHERE decision_id=? AND collection_id=? AND state='failed'")
      .run(id, collectionId);
    if (result.changes) this.db.prepare("UPDATE decisions SET status='pending' WHERE id=?").run(id);
    return result.changes > 0;
  }
  insert(record) { this.db.transaction(() => this.insertReady(record))(); return structuredClone(record); }
  addReassessment(decisionId, collectionId, changedCircumstances, assessment) {
    const record = this.getById(decisionId, collectionId);
    if (!record) throw new TypeError('Decision record not found in this collection.');
    const event = { id: randomUUID(), collection_id: collectionId, decision_id: decisionId,
      kind: 'reassessed', at: now(), title: record.title, changed_circumstances: changedCircumstances,
      assessment: { status: assessment.status, reason: assessment.reason,
        challenged_assumptions: assessment.challenged_assumptions || [], evidence_gaps: assessment.evidence_gaps || [] } };
    this.insertEvent(event);
    return structuredClone(event);
  }
  create(data, collectionId = 'demo') { return this.insert(this.prepare(data, collectionId)); }
}

export default new DecisionModel();
