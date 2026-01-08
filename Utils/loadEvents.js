const fs = require('fs');
const path = require('path');
const { Events } = require('discord.js'); // ✅ importa os nomes corretos
const logger = require('./logger');

module.exports = (client, clientMongo, pathLib) => {
  const eventsDir = pathLib.join(__dirname, '..', 'Events');
  logger.logInfo('🔄 Iniciando carregamento de eventos...');

  const loadEvents = dir => {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        loadEvents(fullPath);
        continue;
      }

      if (!file.endsWith('.js')) continue;

      const evt = require(fullPath);

      if (!evt.name || typeof evt.run !== 'function') {
        logger.logWarn(`⚠️ Evento ignorado (estrutura inválida): ${file}`);
        continue;
      }

      const eventLabel = path.relative(eventsDir, fullPath).replace(/\\/g, '/');

      const handler = (...args) => evt.run(client, ...args, clientMongo);

      // 🔄 Ajuste para v15: converte 'ready' em Events.ClientReady
      const eventName = evt.name === 'ready' ? Events.ClientReady : evt.name;

      if (evt.once) {
        client.once(eventName, handler);
      } else {
        client.on(eventName, handler);
      }

      logger.logInfo(`✅ Evento carregado: ${eventName} (${eventLabel})`);
    }
  };

  loadEvents(eventsDir);
  logger.logInfo('✅ Todos os eventos foram carregados.');
};
