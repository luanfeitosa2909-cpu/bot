const { Events } = require('discord.js');
const { logInfo, logError } = require('../../Utils/logger');
const { conectarCanalDeVoz } = require('../../Utils/voice');
const { configurarPresenca } = require('../../Utils/presenca');
const { startLogMonitor } = require('../../Jobs/logMonitor');
require('dotenv').config();

module.exports = {
  name: Events.ClientReady,
  once: true,
  run: async client => {
    logInfo(`✅ ${client.user.tag} está online!`);

    try {
      await conectarCanalDeVoz(client);
      await configurarPresenca(client);

      // ❌ Painel Updater removido
      // await atualizarPaineis(client);
    } catch (initError) {
      logError(`❌ Erro na inicialização: ${initError.message}`);
    }

    client.inviteCache = new Map();

    for (const guild of client.guilds.cache.values()) {
      try {
        const invites = await guild.invites.fetch();
        client.inviteCache.set(guild.id, invites);
        logInfo(`🔁 Convites carregados para ${guild.name}`);
      } catch (err) {
        logError(`❌ Erro ao carregar convites de ${guild.name}: ${err.message}`);
      }
    }

    try {
      await startLogMonitor(client);
      logInfo('✅ Monitor de logs iniciado com sucesso');
    } catch (error) {
      logError(`❌ Falha ao iniciar monitor de logs: ${error.message}`);
    }
  },
};
