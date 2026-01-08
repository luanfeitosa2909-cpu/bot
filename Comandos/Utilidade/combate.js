const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { logError } = require('../../Utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('combate')
    .setDescription('Simule um combate entre dois dinossauros!')
    .addStringOption(option =>
      option
        .setName('desafiante')
        .setDescription('Primeiro dinossauro (quem inicia o combate)')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption(option =>
      option
        .setName('desafiado')
        .setDescription('Segundo dinossauro (quem é desafiado)')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async run(client, interaction, clientMongo) {
    const name1 = interaction.options.getString('desafiante');
    const name2 = interaction.options.getString('desafiado');

    if (name1 === name2) {
      return interaction.reply({
        content: '❌ Escolha dois dinossauros diferentes.',
        flags: 1 << 6,
      });
    }

    const col = clientMongo.db('ProjetoGenoma').collection('Dinossauros');
    const [d1, d2] = await Promise.all([
      col.findOne({ nome: name1 }),
      col.findOne({ nome: name2 }),
    ]);

    if (!d1 || !d2) {
      return interaction.reply({
        content: '❌ Um ou ambos os dinossauros não foram encontrados.',
        flags: 1 << 6,
      });
    }

    const extract = txt => {
      const found = txt.match(/[\d.,]+/g);
      if (!found) return 0;
      return parseFloat(found.join('').replace(',', '.'));
    };

    const power = d => {
      let peso = extract(d.peso);
      if (/ton/i.test(d.peso)) peso *= 1000;
      const bite = extract(d.bite_force);
      const vel = extract(d.velocidade);
      return peso / 1000 + bite / 500 + vel / 10;
    };

    let p1 = power(d1) * (1 + (Math.random() * 0.2 - 0.1));
    let p2 = power(d2) * (1 + (Math.random() * 0.2 - 0.1));

    const winner = p1 > p2 ? d1 : d2;
    const loser = p1 > p2 ? d2 : d1;
    const diff = Math.abs(p1 - p2).toFixed(2);

    const embed = new EmbedBuilder()
      .setTitle(`⚔️ Combate: ${d1.nome} vs ${d2.nome}`)
      .setColor(winner === d1 ? 0x4dff4d : 0xff4d4d)
      .setDescription(`**🏆 Vencedor:** ${winner.nome}\n**💥 Margem:** ${diff} pts`)
      .addFields(
        {
          name: d1.nome,
          value:
            `⚖️ **Peso:** ${d1.peso}\n` +
            `💥 **Bite:** ${d1.bite_force}\n` +
            `🏃 **Velocidade:** ${d1.velocidade}`,
          inline: true,
        },
        {
          name: d2.nome,
          value:
            `⚖️ **Peso:** ${d2.peso}\n` +
            `💥 **Bite:** ${d2.bite_force}\n` +
            `🏃 **Velocidade:** ${d2.velocidade}`,
          inline: true,
        }
      )
      .setFooter({ text: `${interaction.guild.name} • Simulação de Combate` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },

  async autocomplete(client, interaction, clientMongo) {
    const focused = interaction.options.getFocused();
    try {
      const col = clientMongo.db('ProjetoGenoma').collection('Dinossauros');
      const dinos = await col
        .find({ nome: { $regex: `^${focused}`, $options: 'i' } })
        .limit(25)
        .toArray();

      await interaction.respond(dinos.map(d => ({ name: d.nome, value: d.nome })));
    } catch (err) {
      logError('Erro no autocomplete de combate:', err);
      await interaction.respond([]);
    }
  },
};
