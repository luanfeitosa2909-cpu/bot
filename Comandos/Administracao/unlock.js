const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const logger = require('../../Utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Desbloqueie um canal')
    .addChannelOption(option =>
      option
        .setName('canal')
        .setDescription('Canal a ser desbloqueado')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async run(client, interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.editReply({
          content: '❌ Você não possui permissão para utilizar este comando.',
        });
      }

      const canal = interaction.options.getChannel('canal');

      try {
        await canal.permissionOverwrites.edit(interaction.guild.id, {
          SendMessages: true,
        });

        await interaction.editReply({
          content: `🔓 O canal ${canal} foi desbloqueado com sucesso!`,
        });

        if (canal.id !== interaction.channel.id) {
          await canal.send('🔓 Este canal foi desbloqueado!');
        }
      } catch (err) {
        logger.logError('unlock_inner', err);
        try {
          if (!interaction.replied)
            await interaction.editReply({
              content: '❌ Ocorreu um erro ao tentar desbloquear o canal.',
            });
        } catch (e) {
          logger.logError('unlock_notify_error', e);
        }
      }
    } catch (err) {
      logger.logError('unlock', err);
      try {
        if (!interaction.replied)
          await interaction.editReply({ content: '❌ Erro interno no comando unlock.' });
      } catch (e) {
        logger.logError('unlock_notify_error', e);
      }
    }
  },
};
