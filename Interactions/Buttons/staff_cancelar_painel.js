module.exports = {
  type: 'button',
  customId: null,
  match: id => id === 'staff_cancelar_painel',

  run: async (client, interaction) => {
    await interaction.deferUpdate();
    await interaction.deleteReply().catch(() => {});
  },
};
