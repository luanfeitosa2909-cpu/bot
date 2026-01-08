const fs = require('fs');
const path = require('path');
const { Collection, REST, Routes, PermissionFlagsBits, Events } = require('discord.js');
const logger = require('../Utils/logger');
const config = require('../Utils/config');

module.exports = async client => {
  client.slashCommands = new Collection();
  const SlashsArray = [];
  const restrictedFolders = config.RESTRICTED_FOLDERS || ['administracao', 'owner'];

  const comandosPath = path.join(__dirname, '..', 'Comandos');

  logger.logInfo('🔄 Iniciando carregamento de comandos...');

  // Carrega recursivamente (suporta subpastas)
  const walk = dir => {
    for (const file of fs.readdirSync(dir)) {
      const full = path.join(dir, file);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full);
        continue;
      }
      if (!file.endsWith('.js')) continue;

      try {
        delete require.cache[require.resolve(full)];
        // eslint-disable-next-line no-empty
      } catch {}

      const command = require(full);
      const subfolder =
        path.relative(comandosPath, path.dirname(full)).split(path.sep)[0] || 'root';

      if (!command || !command.data || typeof command.data.name !== 'string') {
        logger.logWarn(`❌ O comando em ${full} está mal configurado. Ignorando...`);
        continue;
      }

      const isRestricted = restrictedFolders.includes(String(subfolder).toLowerCase());
      if (isRestricted) {
        command.data.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);
        command.data.setDMPermission(false);
      }

      client.slashCommands.set(command.data.name, command);
      SlashsArray.push(command.data.toJSON());
      logger.logInfo(`✅ Comando carregado: ${subfolder}/${command.data.name}`);
    }
  };

  walk(comandosPath);

  client.once(Events.ClientReady, async () => {
    try {
      await client.guilds.fetch();

      if (config.REGISTER_GLOBAL_COMMANDS) {
        // registra globalmente usando REST (pode demorar até 1 hora para propagar)
        try {
          const rest = new REST({ version: '10' }).setToken(config.BOT_TOKEN);
          await rest.put(Routes.applicationCommands(client.user.id), { body: SlashsArray });
          logger.logInfo('✅ Slash commands registrados globalmente (applicationCommands).');
        } catch (err) {
          logger.logWarn('⚠️ Falha ao registrar globalmente; tentando por guilds.');
        }
      }

      for (const guild of client.guilds.cache.values()) {
        try {
          await guild.commands.set(SlashsArray);
          logger.logInfo(`✅ Slash commands registrados para: ${guild.name}`);
        } catch (err) {
          logger.logWarn(`⚠️ Falha ao registrar comandos para guild ${guild.name}: ${err.message}`);
        }
      }
    } catch (error) {
      logger.logError('❌ Erro ao registrar os slash commands:', error);
    }
  });
};
