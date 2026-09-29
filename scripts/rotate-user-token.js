import 'dotenv/config';
import decisionModel from '../src/models/decision.js';

const name = process.argv.slice(2).join(' ').trim();
if (!name) throw new Error('Usage: npm run auth:rotate-token -- "Your name"');
const token = decisionModel.rotateUserToken(name);
console.log('New access token for ' + name + ' (shown once): ' + token);
console.log('The old token is no longer valid.');
