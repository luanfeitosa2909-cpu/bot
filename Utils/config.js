require('dotenv').config();
const logger = require('./logger');

const required = ['BOT_TOKEN', 'MONGO_URI'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  logger.logError('Variáveis de ambiente obrigatórias ausentes: ' + missing.join(', '));
  process.exit(1);
}

const parseBool = (v, def = false) => {
  if (v === undefined) return def;
  return String(v).toLowerCase() === 'true';
};

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  MONGO_URI: process.env.MONGO_URI,
  NODE_ENV: process.env.NODE_ENV || 'production',
  REGISTER_GLOBAL_COMMANDS: parseBool(process.env.REGISTER_GLOBAL_COMMANDS, false),
  RESTRICTED_FOLDERS: (process.env.RESTRICTED_FOLDERS || 'Administracao,Owner')
    .split(',')
    .map(s => s.trim().toLowerCase()),
  PORT: process.env.PORT || 3000,
};
