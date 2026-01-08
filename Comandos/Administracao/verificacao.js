const {
  SlashCommandBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js');
const logger = require('../../Utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verificacao')
    .setDescription('Inicie sua verificação de SteamID para desbloquear benefícios!')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  async run(client, interaction, _clientMongo) {
    try {
      const embed = {
        title: `🔐 Verificação de SteamID64 – ${interaction.guild.name}`,
        description:
          '🎮 **Bem-vindo ao nosso sistema de verificação!**\n\n' +
          'Para manter a integridade da comunidade e oferecer recursos exclusivos, é necessário vincular sua conta Steam.\n\n' +
          '🦖 **Vantagens da verificação:**\n' +
          '• Evita fraudes e multi-contas\n' +
          '• Participação em eventos especiais\n' +
          '• Recompensas, coins e acesso a funcionalidades únicas\n\n' +
          '⚠️ **Importante:**\n' +
          '• A conta Steam deve estar com o perfil **público** durante a verificação\n' +
          '• Você só poderá verificar **uma vez**\n\n' +
          '📝 **Como tornar seu perfil público:**\n' +
          "1. Acesse sua Steam e vá em **'Editar Perfil'**\n" +
          "2. Vá até **'Configurações de Privacidade'**\n" +
          '3. Altere tudo para **Público**, especialmente o *Perfil e Detalhes do Jogo*\n\n' +
          '🚀 Quando estiver pronto, clique no botão abaixo para começar:',
        color: 0x00b0f4,
        thumbnail: { url: interaction.guild.iconURL({ dynamic: true }) },
        image: { url: 'https://theisle.ru/assets/species/baryonyx.webp' },
        footer: {
          text: `Sistema de Verificação • ${interaction.guild.name}`,
          icon_url: client.user.displayAvatarURL(),
        },
        timestamp: new Date(),
      };

      const button = new ButtonBuilder()
        .setCustomId('verificar_steamid')
        .setLabel('🚀 Iniciar Verificação')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🦕');

      const row = new ActionRowBuilder().addComponents(button);

      await interaction.reply({ embeds: [embed], components: [row] });
    } catch (err) {
      logger.logError('verificacao', err);
      if (!interaction.replied)
        await interaction.reply({ content: '❌ Erro ao iniciar verificação.', ephemeral: true });
    }
  },
};
