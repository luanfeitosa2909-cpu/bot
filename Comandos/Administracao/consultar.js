const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('consultarlogs')
    .setDescription('Consulta os logs de verificação de SteamID64')
    .addUserOption(option =>
      option.setName('usuario').setDescription('Filtrar por um usuário').setRequired(false)
    )
    .addIntegerOption(option =>
      option
        .setName('quantidade')
        .setDescription('Quantidade de logs (máx. 10)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  async run(clientDiscord, interaction, clientMongo) {
    // <-- recebe clientMongo aqui
    const logger = require('../../Utils/logger');
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          content: '❌ Apenas administradores podem usar este comando.',
          ephemeral: true,
        });
      }

      await interaction.deferReply({ ephemeral: true });

      const db = clientMongo.db('ProjetoGenoma');
      const collection = db.collection('DataBase');

      const targetUser = interaction.options.getUser('usuario');
      const maxLogs = interaction.options.getInteger('quantidade') || 10;
      const filter = targetUser ? { user_id: targetUser.id } : {};

      const logs = await collection
        .find(filter)
        .sort({ steamidTimestamp: -1 })
        .limit(maxLogs)
        .toArray();

      if (logs.length === 0) {
        return interaction.editReply(
          targetUser
            ? `❌ Nenhum log encontrado para ${targetUser.tag}.`
            : '❌ Nenhum log de verificação encontrado.'
        );
      }

      const lines = logs.map((log, i) => {
        const dateStr = log.steamidTimestamp
          ? `<t:${Math.floor(log.steamidTimestamp / 1000)}:F>`
          : '`Data não registrada`';

        return `**${i + 1}.** <@${log.user_id}> (${
          log.steamname || 'Desconhecido'
        }) - SteamID64: \`${log.steamid}\` - 📅 ${dateStr}`;
      });

      const embed = new EmbedBuilder()
        .setTitle(`📜 Logs de Verificação${targetUser ? ` | ${targetUser.tag}` : ''}`)
        .setDescription(lines.join('\n'))
        .setColor('#3498db')
        .setFooter({ text: `Mostrando ${logs.length} registro(s).` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      logger.logError('consultarlogs', err);
      try {
        if (!interaction.replied)
          await interaction.editReply({ content: '❌ Ocorreu um erro ao consultar os logs.' });
        else
          await interaction.followUp({
            content: '❌ Ocorreu um erro ao consultar os logs.',
            ephemeral: true,
          });
      } catch (e) {
        logger.logError('consultarlogs_notify_error', e);
      }
    }
  },
};
