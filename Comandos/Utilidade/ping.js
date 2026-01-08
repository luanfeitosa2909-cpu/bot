const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('ping').setDescription('Veja o ping do bot.'),

  async run(client, interaction, _clientMongo) {
    const ping = client.ws.ping;

    const embed_1 = new EmbedBuilder()
      .setAuthor({
        name: client.user.username,
        iconURL: client.user.displayAvatarURL({ dynamic: true }),
      })
      .setDescription(`Olá ${interaction.user}, meu ping está em \`calculando...\`.`)
      .setColor('Random');

    const embed_2 = new EmbedBuilder()
      .setAuthor({
        name: client.user.username,
        iconURL: client.user.displayAvatarURL({ dynamic: true }),
      })
      .setDescription(`Olá ${interaction.user}, meu ping está em \`${ping}ms\`.`)
      .setColor('Random');

    await interaction.reply({ embeds: [embed_1] });

    setTimeout(() => {
      interaction.editReply({ embeds: [embed_2] }).catch(() => {});
    }, 2000);
  },
};
