const { EmbedBuilder } = require('discord.js');

module.exports = {
  type: 'button',
  customId: null,
  match: id => id === 'membro_central_ajuda',

  run: async (client, interaction) => {
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('🆘 Central de Ajuda')
      .setDescription(
        [
          `👋 Bem-vindo à Central de Ajuda do **${interaction.guild.name}**!`,
          '',
          '🔍 Aqui vão algumas dicas para facilitar o atendimento:',
          '• 📝 Adicione provas (prints, vídeos, IDs, etc).',
          '• 🗣️ Explique claramente o motivo do ticket.',
          '• ✅ Isso ajuda a equipe a atender você mais rápido.',
          '',
          '> Se precisar de ajuda com dúvidas frequentes, clique em `FAQ` no painel inicial.',
        ].join('\n')
      )
      .setFooter({ text: `Equipe ${interaction.guild.name} • Atendimento` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: 1 << 6 });
  },
};
