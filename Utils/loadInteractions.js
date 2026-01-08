const fs = require('fs');
const path = require('path');
const { Events } = require('discord.js');
const errorHandler = require('./errorHandler');
const { clientMongo } = require('../database/mongodb');
const logger = require('./logger');
const { logSlash } = require('../Utils/commandLogger');

module.exports = (client, basePath) => {
  const interactionsBase = path.join(__dirname, '..', 'Interactions');
  logger.logInfo('🔄 Iniciando carregamento de handlers de interação...');

  const types = {
    button: client.buttonHandlers,
    modal: client.modalHandlers,
    select: client.selectHandlers,
  };

  // Carregamento dos handlers
  for (const subfolder of fs.readdirSync(interactionsBase)) {
    const fullSub = path.join(interactionsBase, subfolder);
    if (!fs.statSync(fullSub).isDirectory()) continue;

    for (const file of fs.readdirSync(fullSub).filter(f => f.endsWith('.js'))) {
      const handler = require(path.join(fullSub, file));
      if (!handler?.type || typeof handler.run !== 'function') continue;

      const map = types[handler.type];
      if (!map) continue;

      const id = handler.customId ?? Symbol(file);
      map.set(id, handler);

      logger.logInfo(`✅ Handler carregado [${handler.type}]: ${subfolder}/${file}`);
    }
  }

  logger.logInfo('✅ Todos os handlers de interação foram carregados.');

  // Listener principal
  client.on(Events.InteractionCreate, async interaction => {
    await errorHandler(interaction, async () => {
      // ================================
      // 🔵 AUTOCOMPLETE
      // ================================
      if (interaction.isAutocomplete()) {
        const cmd = client.slashCommands.get(interaction.commandName);

        if (!cmd) return; // comando inexistente

        if (typeof cmd.autocomplete === 'function') {
          try {
            return await cmd.autocomplete(client, interaction);
          } catch (err) {
            console.warn(`[Autocomplete Error]`, err);
            return; // errorHandler já ignora autocomplete
          }
        }

        return;
      }

      // ================================
      // 🔵 SLASH COMMAND
      // ================================
      if (interaction.isChatInputCommand()) {
        const cmd = client.slashCommands.get(interaction.commandName);

        if (!cmd) {
          logger.logWarn(`⚠️ Comando "${interaction.commandName}" não encontrado.`);
          return interaction.reply({
            content: '❌ Este comando não está disponível.',
            ephemeral: true,
          });
        }

        try {
          if (typeof cmd.run === 'function') {
            await cmd.run(client, interaction, clientMongo);
          } else if (typeof cmd.execute === 'function') {
            await cmd.execute(interaction, client, clientMongo);
          } else {
            logger.logWarn(
              `⚠️ Comando ${interaction.commandName} não possui função run nem execute`
            );
          }
        } finally {
          await logSlash(interaction);
        }

        return;
      }

      // ================================
      // 🟣 FUNÇÃO AUXILIAR PARA HANDLERS
      // ================================
      const runHandler = map => {
        let handler = map.get(interaction.customId);

        if (!handler) {
          for (const h of map.values()) {
            try {
              if (typeof h.match === 'function' && h.match(interaction.customId)) {
                handler = h;
                break;
              }

              if (h.customId instanceof RegExp && h.customId.test(interaction.customId)) {
                handler = h;
                break;
              }
            } catch (err) {
              console.error(`[HANDLER MATCH ERROR] ${h.type || 'unknown'}:`, err);
            }
          }
        }

        if (!handler) return;

        try {
          return handler.run(client, interaction, clientMongo);
        } catch (err) {
          console.error(`[HANDLER RUN ERROR] ${handler.type || 'unknown'}:`, err);
        }
      };

      // ================================
      // 🟡 BUTTON
      // ================================
      if (interaction.isButton()) return runHandler(client.buttonHandlers);

      // ================================
      // 🟠 MODAL
      // ================================
      if (interaction.isModalSubmit()) return runHandler(client.modalHandlers);

      // ================================
      // 🟢 SELECT MENU
      // ================================
      if (interaction.isStringSelectMenu()) return runHandler(client.selectHandlers);
    });
  });
};
