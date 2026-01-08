const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('solicitarslay')
    .setDescription('⚔️ Solicite um Slay em dinossauros com verificação ativa!')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  async run(client, interaction) {
    const logger = require('../../Utils/logger');
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          content: '❌ Você precisa ser administrador para usar este comando.',
          ephemeral: true,
        });
      }

      await interaction.deferReply({ ephemeral: true });

      const serverIcon =
        interaction.guild.iconURL({ dynamic: true }) || client.user.displayAvatarURL();

      const embed = new EmbedBuilder()
        .setTitle(`⚔️ Solicitação de Slay - ${interaction.guild.name}`)
        .setDescription(
          'Este sistema permite que jogadores ativos e verificados solicitem Slays em seus dinossauros!\n\n' +
            '🦖 **Benefícios do Slay:**\n' +
            '• Eliminação instantânea do dino alvo\n' +
            '• Exclusivo para usuários verificados\n' +
            '• Controle de solicitações para manter o equilíbrio\n\n' +
            '📌 *Importante:*\n' +
            '• Seu perfil precisa estar verificado\n\n' +
            '🎯 Clique no botão abaixo para solicitar seu Slay!'
        )
        .setColor('#e74c3c')
        .setThumbnail(serverIcon)
        .setImage('https://www.bisecthosting.com/_ipx/q_100/static/img/blog/cat-theisle.webp')
        .setFooter({
          text: `Sistema de Slays • ${interaction.guild.name}`,
          iconURL: client.user.displayAvatarURL(),
        })
        .setTimestamp();

      const button = new ButtonBuilder()
        .setCustomId('solicitarslay')
        .setLabel('⚔️ Solicitar Slay')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🗡️');

      const row = new ActionRowBuilder().addComponents(button);

      try {
        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.editReply({ content: '✅ Solicitação de Slay enviada com sucesso.' });
      } catch (err) {
        logger.logError('solicitarslay', err);
        try {
          if (!interaction.replied)
            await interaction.editReply({ content: '❌ Erro ao enviar solicitação.' });
        } catch (e) {
          logger.logError('solicitarslay_notify_error', e);
        }
      }
    } catch (err) {
      logger.logError('solicitarslay', err);
      try {
        if (!interaction.replied)
          await interaction.reply({
            content: '❌ Erro interno no comando solicitarslay.',
            ephemeral: true,
          });
      } catch (e) {
        logger.logError('solicitarslay_notify_error', e);
      }
    }
  },
};
