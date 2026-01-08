const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Bloqueie um canal de texto')
    .addChannelOption(option =>
      option
        .setName('canal')
        .setDescription('Selecione o canal a ser bloqueado')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false),

  async run(client, interaction) {
    const logger = require('../../Utils/logger');
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({
        content: '❌ Você não tem permissão para usar este comando.',
        ephemeral: true,
      });
    }

    const canal = interaction.options.getChannel('canal');

    try {
      await canal.permissionOverwrites.edit(interaction.guild.id, {
        SendMessages: false,
      });

      await interaction.reply({ content: `🔒 O canal ${canal} foi bloqueado!`, ephemeral: true });

      if (canal.id !== interaction.channel.id) {
        await canal.send('🔒 Este canal foi bloqueado!');
      }
    } catch (err) {
      logger.logError('lock', err);
      try {
        await interaction.reply({ content: '❌ Ops, algo deu errado.', ephemeral: true });
      } catch (e) {
        logger.logError('lock_notify_error', e);
      }
    }
  },
};
