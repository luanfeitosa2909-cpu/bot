const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getCollection } = require('../../database/userData');

function msParaTempo(ms) {
  if (!ms || isNaN(ms)) return '0h 0m 0s';
  const totalSegundos = Math.floor(ms / 1000);
  const horas = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  return `${horas}h ${minutos}m`;
}

const medalhas = ['🥇', '🥈', '🥉', '🏅', '🏅', '🏅', '🏅', '🏅', '🏅', '🏅'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('callrank')
    .setDescription('Mostra o Top 10 usuários com mais tempo em call'),

  run: async (client, interaction, _clientMongo) => {
    const collection = getCollection();

    const top10 = await collection
      .find({
        tempo: { $gt: 0 },
      })
      .sort({ tempo: -1 })
      .limit(10)
      .toArray();

    if (!top10.length) {
      return interaction.reply({
        content: 'Nenhum tempo registrado ainda!',
        flags: 1 << 6,
      });
    }

    const embed = new EmbedBuilder()
      .setColor('#00bcd4')
      .setTitle('🏆 **Ranking de Tempo em Call**')
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setDescription('Veja quem são os jogadores mais ativos em chamadas de voz!')
      .setFooter({
        text: `Solicitado por ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    for (let i = 0; i < top10.length; i++) {
      const user = top10[i];
      const tempo = user.tempo || 0;
      const emoji = medalhas[i] || '🔹';

      let nome;
      try {
        const membro = await interaction.guild.members.fetch(user.user_id);
        nome = membro.user.username;
      } catch {
        nome = user.steamname || `Usuário ${user.user_id}`;
      }

      embed.addFields({
        name: `${emoji} ${i + 1}º - ${nome}`,
        value: `🕒 **${msParaTempo(tempo)}** em call`,
        inline: false,
      });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
