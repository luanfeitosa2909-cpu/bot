const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  type: 'button',
  customId: null,
  match: id => id === 'staff_remover_membro',

  run: async (client, interaction) => {
    const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;

    // Verifica permissão de staff
    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({ content: '❌ Apenas staff pode remover membros.', flags: 1 << 6 });
    }

    const modal = new ModalBuilder()
      .setCustomId('modal_staff_remover_membro')
      .setTitle('➖ Remover Membro do Ticket');

    const input = new TextInputBuilder()
      .setCustomId('input_id_membro_remover')
      .setLabel('ID do Discord ou SteamID')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: 123456789012345678 ou 7656119...')
      .setRequired(true);

    const row = new ActionRowBuilder().addComponents(input);
    modal.addComponents(row);

    await interaction.showModal(modal);
  },
};
