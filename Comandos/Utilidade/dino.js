const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dino')
    .setDescription('Veja informações detalhadas sobre um dinossauro')
    .addStringOption(option =>
      option
        .setName('nome')
        .setDescription('Escolha ou digite o nome do dinossauro')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async run(client, interaction, clientMongo) {
    const nome = interaction.options.getString('nome');
    const dino = await clientMongo.db('ProjetoGenoma').collection('Dinossauros').findOne({ nome });

    if (!dino) {
      return interaction.reply({ content: '❌ Dinossauro não encontrado.', flags: 1 << 6 });
    }

    const banners = {
      Diabloceratops:
        'https://static.wikia.nocookie.net/isle/images/f/f1/Diablo4.PNG/revision/latest?cb=20200208130419',
      Dryosaurus:
        'https://static.wikia.nocookie.net/isle/images/4/4c/The_isle_dryosaurus_new_2020.png/revision/latest?cb=20200825030940',
      Hypsilophodon:
        'https://static.wikia.nocookie.net/isle/images/7/79/Hypsilophodon_The_Isle.png/revision/latest?cb=20200326005817',
      Maiasaura:
        'https://static.wikia.nocookie.net/isle/images/2/22/Maia1.PNG/revision/latest/scale-to-width-down/1200?cb=20200208133749',
      Pachycephalosaurus:
        'https://static.wikia.nocookie.net/isle/images/b/b0/Pachycephalosaurus.jpeg/revision/latest?cb=20201105160947',
      Tenontosaurus:
        'https://static.wikia.nocookie.net/isle/images/1/1f/Tenontosaurus_official.jpg/revision/latest?cb=20200329012329',
      Stegosaurus:
        'https://static.wikia.nocookie.net/isle/images/5/51/The_isle_stegosaurus_new_2020.jpeg/revision/latest?cb=20200825030723',
      Triceratops: 'https://i.ytimg.com/vi/orIM7qlljjU/hq720.jpg',
      Carnotaurus:
        'https://static.wikia.nocookie.net/isle/images/6/67/The_isle_carnotaurus_new_2020.jpeg/revision/latest?cb=20200825033245',
      Ceratosaurus:
        'https://static.wikia.nocookie.net/isle/images/6/66/Ceratosaurus_The_Isle.jpeg/revision/latest?cb=20201105160738',
      Deinosuchus:
        'https://static.wikia.nocookie.net/isle/images/7/7e/The_isle_deinosuchus_new_2020.jpeg/revision/latest/scale-to-width-down/250?cb=20200825031049',
      Dilophosaurus: 'https://i.redd.it/pb82xsmk4ox91.png',
      Herrerasaurus:
        'https://static.wikia.nocookie.net/isle/images/8/83/Herrerasaurus.jpeg/revision/latest?cb=20201105155626',
      Omniraptor:
        'https://static.wikia.nocookie.net/isle/images/c/cf/Utahraptor_The_Isle.jpeg/revision/latest?cb=20200825030406',
      Pteranodon:
        'https://static.wikia.nocookie.net/isle/images/2/29/The_isle_pteranodon_new_2020.jpeg/revision/latest?cb=20200825030749',
      Troodon:
        'https://static.wikia.nocookie.net/isle/images/1/1f/Troodon_The_Isle.jpeg/revision/latest?cb=20201105161108',
      Beipiaosaurus:
        'https://static.wikia.nocookie.net/survive-the-isle/images/1/13/Beipiaosaurus.jpg/revision/latest?cb=20230309012536',
      Gallimimus:
        'https://static.wikia.nocookie.net/isle/images/3/37/Gallimimus.jpeg/revision/latest?cb=20201105160559',
    };

    const bannerUrl = banners[dino.nome];

    const categoryColors = {
      Carnívoro: 0xff4d4d,
      Herbívoro: 0x4dff4d,
      Omnívoro: 0xffd24d,
      'Carnívoro (pterossauro)': 0xffa64d,
    };
    const color = categoryColors[dino.categoria] || 0x555555;

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`🦕 ${dino.nome}`)
      .setThumbnail(interaction.guild.iconURL({ size: 256 }))
      .setImage(bannerUrl)
      .setDescription(`**_${dino.descricao}_**`)
      .addFields(
        { name: '📌 Categoria', value: dino.categoria, inline: true },
        { name: '🍴 Dieta', value: dino.dieta, inline: true },
        { name: '🌍 Localização', value: dino.localizacao, inline: true },
        { name: '⏱ Crescimento', value: dino.growth_time, inline: true },
        { name: '⚖️ Peso', value: dino.peso, inline: true },
        { name: '💥 Bite Force', value: dino.bite_force, inline: true },
        { name: '🏃 Velocidade', value: dino.velocidade, inline: true },
        { name: '🧠 Comportamento', value: dino.comportamento, inline: false }
      )
      .setFooter({
        text: `${interaction.guild.name} • The Isle Evrima`,
        iconURL: client.user.displayAvatarURL(),
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },

  // autocomplete handler
  async autocomplete(client, interaction, clientMongo) {
    const focused = interaction.options.getFocused();
    const col = clientMongo.db('ProjetoGenoma').collection('Dinossauros');

    const lista = await col.find().project({ nome: 1 }).toArray();
    const nomes = lista
      .map(d => d.nome)
      .filter(n => n.toLowerCase().includes(focused.toLowerCase()))
      .slice(0, 25);

    await interaction.respond(nomes.map(n => ({ name: n, value: n })));
  },
};
