import 'dotenv/config';
import decisionModel from '../src/models/decision.js';

const name = process.argv.slice(2).join(' ').trim();
if (!name) throw new Error('Usage: npm run auth:create-user -- "Your name"');
const user = decisionModel.createUser(name);
console.log('Created user: ' + user.name);
console.log('Access token (shown once): ' + user.token);
console.log('Enter this token in the PRECEDENT browser sign-in screen.');
