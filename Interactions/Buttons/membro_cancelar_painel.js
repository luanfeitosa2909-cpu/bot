module.exports = {
  type: 'button',
  customId: null,
  match: id => id === 'membro_cancelar_painel',

  run: async (client, interaction) => {
    try {
      await interaction.update({
        content: '❌ Painel cancelado.',
        embeds: [],
        components: [],
      });
    } catch (err) {
      console.error('Erro ao cancelar painel:', err);
    }
  },
};
