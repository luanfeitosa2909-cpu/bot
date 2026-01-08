const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require('discord.js');
const axios = require('axios');
const { logError } = require('../../Utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('social')
    .setDescription('Interaja socialmente com outro membro ou veja uma waifu aleatória')
    .addStringOption(option =>
      option
        .setName('ação')
        .setDescription('Escolha a ação')
        .setRequired(true)
        .addChoices(
          { name: 'Hug 🤗', value: 'hug' },
          { name: 'Kiss 😘', value: 'kiss' },
          { name: 'Slap 👋', value: 'slap' },
          { name: 'Waifu 🐱', value: 'waifu' }
        )
    )
    .addUserOption(option =>
      option
        .setName('membro')
        .setDescription('Selecione um membro para interagir')
        .setRequired(false)
    ),

  async run(client, interaction, _clientMongo) {
    const acao = interaction.options.getString('ação');
    const user = interaction.options.getUser('membro');

    // Listas de gifs
    const gifs = {
      hug: {
        start: [
          'https://imgur.com/RgfGLNk.gif',
          'https://i.imgur.com/r9aU2xv.gif',
          'https://i.imgur.com/wOmoeF8.gif',
          'https://i.imgur.com/nrdYNtL.gif',
          'https://imgur.com/82xVqUg.gif',
        ],
        return: [
          'https://imgur.com/c3WzMZu.gif',
          'https://imgur.com/BPLqSJC.gif',
          'https://imgur.com/ntqYLGl.gif',
          'https://imgur.com/v47M1S4.gif',
          'https://imgur.com/6qYOUQF.gif',
        ],
      },
      kiss: {
        start: [
          'https://i.pinimg.com/originals/88/da/d4/88dad431d098e1a0e6f11d5f0b53bc48.gif',
          'https://i.pinimg.com/originals/13/06/73/1306732d3351afe642c9a7f6d46f548e.gif',
          'https://pa1.aminoapps.com/6568/af89126bde3cf558d93c786266fa47e7385fe1e4_hq.gif',
          'https://usagif.com/wp-content/uploads/anime-kissin-8.gif',
          'https://pa1.aminoapps.com/6462/166bc30fac9b739b6b78cb42a0c89dafc927297c_hq.gif',
        ],
        return: [
          'https://media.tenor.com/ZDqsYLDQzIUAAAAM/shirayuki-zen-kiss-anime.gif',
          'https://i.gifer.com/i0I.gif',
          'https://usagif.com/wp-content/uploads/anime-kissin-10.gif',
          'https://i.gifer.com/Lyne.gif',
          'https://i.gifer.com/T0lE.gif',
        ],
      },
      slap: {
        start: [
          'https://imgur.com/HYJHoG7.gif',
          'https://imgur.com/9GxTsgl.gif',
          'https://imgur.com/mT4VjD6.gif',
          'https://imgur.com/w66ZqGR.gif',
        ],
        return: [
          'https://imgur.com/oSoudVd.gif',
          'https://imgur.com/T9w8eFV.gif',
          'https://imgur.com/nuDmQu5.gif',
          'https://imgur.com/wlLCjRo.gif',
          'https://imgur.com/sVeYncu.gif',
        ],
      },
    };

    if (acao === 'waifu') {
      // Waifu
      const getImage = async () => {
        try {
          const response = await axios.get('https://waifu.pics/api/sfw/waifu');
          return response.data.url;
        } catch (err) {
          logError('Erro ao buscar waifu:', err);
          return null;
        }
      };

      const embed = new EmbedBuilder()
        .setColor('#FF69B4')
        .setTitle('✨ Waifu Aleatória!')
        .setDescription('Clique em **Outra Waifu** para ver mais!')
        .setImage(await getImage())
        .setFooter({
          text: `Pedido por ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();

      const waifuButton = new ButtonBuilder()
        .setLabel('Outra Waifu')
        .setStyle(ButtonStyle.Primary)
        .setCustomId('waifu_button');

      const stopButton = new ButtonBuilder()
        .setLabel('Fechar')
        .setStyle(ButtonStyle.Danger)
        .setCustomId('stop_button');

      const buttonRow = new ActionRowBuilder().addComponents(waifuButton, stopButton);

      await interaction.reply({ embeds: [embed], components: [buttonRow] });
      const reply = await interaction.fetchReply();

      const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: i =>
          ['waifu_button', 'stop_button'].includes(i.customId) && i.user.id === interaction.user.id,
        time: 120_000,
      });

      collector.on('collect', async i => {
        if (i.customId === 'waifu_button') {
          const newImage = await getImage();
          embed.setImage(newImage);
          await i.update({ embeds: [embed] });
        } else {
          buttonRow.components.forEach(btn => btn.setDisabled(true));
          await i.update({ components: [buttonRow] });
          collector.stop();
        }
      });

      collector.on('end', async () => {
        buttonRow.components.forEach(btn => btn.setDisabled(true));
        try {
          await reply.edit({ components: [buttonRow] });
        } catch (e) {
          if (e.code !== 10008) logError(e);
        }
      });
    } else {
      // Hug/Kiss/Slap precisa de usuário
      if (!user)
        return interaction.reply({
          content: '❌ Você precisa mencionar um membro para esta ação.',
          flags: 1 << 6,
        });

      const embed = new EmbedBuilder()
        .setDescription(
          `**${interaction.user} ${
            acao === 'hug' ? 'abraçou' : acao === 'kiss' ? 'deu um beijo em' : 'deu um tapa em'
          } ${user}!**`
        )
        .setImage(gifs[acao].start[Math.floor(Math.random() * gifs[acao].start.length)])
        .setColor('Random');

      const embedReturn = new EmbedBuilder()
        .setDescription(`**${user} retribuiu a ação de ${interaction.user}!**`)
        .setImage(gifs[acao].return[Math.floor(Math.random() * gifs[acao].return.length)])
        .setColor('Random');

      const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`${acao}_return`)
          .setLabel('Retribuir')
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.reply({ embeds: [embed], components: [buttonRow] });
      const reply = await interaction.fetchReply();

      const filter = i => i.customId === `${acao}_return` && i.user.id === user.id;
      const collector = reply.createMessageComponentCollector({ filter, max: 1, time: 30_000 });

      collector.on('collect', async i => {
        await i.reply({ embeds: [embedReturn] });
      });

      collector.on('end', async () => {
        buttonRow.components.forEach(btn => btn.setDisabled(true));
        try {
          await interaction.editReply({ components: [buttonRow] });
        } catch (e) {
          if (e.code !== 10008) logError(e);
        }
      });
    }
  },
};
