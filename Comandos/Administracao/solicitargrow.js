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
    .setName('solicitargrow')
    .setDescription('📈 Solicite um Grow em dinossauros com verificação ativa!')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  async run(client, interaction, _clientMongo) {
    const logger = require('../../Utils/logger');
    try {
      await interaction.deferReply({ ephemeral: true });
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.editReply({
          content: '❌ Você precisa ser administrador para usar este comando.',
        });
      }

      const serverIcon =
        interaction.guild.iconURL({ dynamic: true }) || client.user.displayAvatarURL();

      const embed = new EmbedBuilder()
        .setTitle(`🌿 Solicitação de Grow - ${interaction.guild.name}`)
        .setDescription(
          '**Você está pronto para evoluir?**\n\n' +
            'Este sistema foi criado para premiar jogadores ativos e verificados com Grows em seus dinossauros dentro do The Isle!\n\n' +
            '🦖 **Benefícios do Grow:**\n' +
            '• Crescimento instantâneo do seu dino\n' +
            '• Exclusivo para usuários verificados\n' +
            '• Controle de solicitações para manter o equilíbrio\n\n' +
            '📌 *Importante:*\n' +
            '• Seu perfil precisa estar verificado\n' +
            '• Você só pode solicitar **uma única vez**\n\n' +
            '🎯 Clique no botão abaixo para solicitar seu Grow!'
        )
        .setColor('#2ecc71')
        .setThumbnail(serverIcon)
        .setImage('https://i.pinimg.com/736x/ba/e5/d6/bae5d67a6289e1e2ce42cffd4d8ed6f1.jpg')
        .setFooter({
          text: `Sistema de Grows • ${interaction.guild.name}`,
          iconURL: client.user.displayAvatarURL(),
        })
        .setTimestamp();

      const button = new ButtonBuilder()
        .setCustomId('solicitargrow')
        .setLabel('🌱 Solicitar Grow')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🦖');

      const row = new ActionRowBuilder().addComponents(button);

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (err) {
      logger.logError('solicitargrow', err);
      try {
        if (!interaction.replied)
          await interaction.editReply({ content: '❌ Erro ao abrir solicitação de grow.' });
        else
          await interaction.followUp({
            content: '❌ Erro ao abrir solicitação de grow.',
            ephemeral: true,
          });
      } catch (e) {
        logger.logError('solicitargrow_notify_error', e);
      }
    }
  },
};
