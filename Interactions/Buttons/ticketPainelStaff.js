const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  type: 'button',
  customId: null,
  match: id => id === 'painel_staff',

  run: async (client, interaction) => {
    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('🛠️ Painel da Staff')
      .setDescription(
        '**Ações disponíveis neste ticket:**\n\n' +
          '➕ **Adicionar Membro** — Permite um jogador participar do ticket.\n' +
          '➖ **Remover Membro** — Remove um jogador do ticket.\n' +
          '🔔 **Notificar Usuário** — Envia uma notificação para um usuário específico.\n' +
          '📝 **Atender** — Registra que você assumiu o atendimento.\n' +
          '❌ **Fechar Painel** — Fecha este menu.'
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('staff_adicionar_membro')
        .setLabel('➕ Adicionar Membro')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('staff_remover_membro')
        .setLabel('➖ Remover Membro')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('staff_notificar_usuario')
        .setLabel('🔔 Notificar Usuário')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('staff_atender_ticket')
        .setLabel('👨‍💼 Atender Ticket')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('staff_cancelar_painel')
        .setLabel('❌ Fechar Painel')
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({ embeds: [embed], components: [row], flags: 1 << 6 });
  },
};
