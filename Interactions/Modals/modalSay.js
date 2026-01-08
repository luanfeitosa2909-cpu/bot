const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  type: 'modal',
  customId: null,
  match: id => id === 'modal_say',

  async run(client, interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Você não tem permissão.', flags: 1 << 6 });
    }

    await interaction.deferReply({ flags: 1 << 6 });

    const conteudo = interaction.fields.getTextInputValue('mensagem_input') || '';
    const MAX = 2000;

    if (!conteudo.trim()) {
      return interaction.editReply({ content: '❌ Mensagem vazia.' });
    }

    if (conteudo.length > MAX) {
      return interaction.editReply({ content: `🚫 ${conteudo.length}/${MAX} caracteres.` });
    }

    const embed = new EmbedBuilder()
      .setDescription(conteudo)
      .setColor('Blurple')
      .setFooter({
        text: `Enviado por ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    await interaction.channel.send({ embeds: [embed] });
    await interaction.editReply({ content: '✅ Mensagem enviada!' });
  },
};
