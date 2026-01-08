const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  type: 'button',
  customId: null,
  match: id => id === 'painel_membro',

  run: async (client, interaction) => {
    const embed = new EmbedBuilder()
      .setColor('Blurple')
      .setTitle('🎛️ Painel do Membro')
      .setDescription(
        '**Escolha uma das opções abaixo:**\n\n' +
          '🔔 **Chamar Staff** — Notifica a equipe que você precisa de ajuda.\n' +
          '🔒 **Fechar Ticket** — Solicita encerramento do ticket.\n' +
          '🆘 **Central de Ajuda** — Receba instruções para agilizar seu atendimento.\n' +
          '❌ **Fechar Painel** — Fecha este menu.'
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('membro_chamar_staff')
        .setLabel('🔔 Chamar Staff')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('membro_fechar_ticket')
        .setLabel('🔒 Solicitar Fechamento')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('membro_central_ajuda')
        .setLabel('🆘 Central de Ajuda')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('membro_cancelar_painel')
        .setLabel('❌ Fechar Painel')
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({ embeds: [embed], components: [row], flags: 1 << 6 });
  },
};
