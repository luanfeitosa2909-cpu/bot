const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require('discord.js');
const ms = require('ms');

module.exports = {
  type: 'modal',
  customId: 'modal_sorteio',

  run: async (client, interaction) => {
    const dados = client.sorteiosTemp?.[interaction.user.id];
    if (!dados)
      return interaction.reply({
        content: '❌ Não consegui recuperar os dados do sorteio.',
        flags: 1 << 6,
      });

    const descricao = interaction.fields.getTextInputValue('descricao');
    const duracao = ms(dados.tempo);
    if (!duracao)
      return interaction.reply({ content: '❌ Tempo inválido. Ex: 5m, 1h', flags: 1 << 6 });

    const fim = Date.now() + duracao;

    const embed = new EmbedBuilder()
      .setTitle(`🎁 ${dados.premio.toUpperCase()}`)
      .setDescription(
        [
          `**Patrocinador:** ${interaction.user}`,
          `${descricao}`,
          `🕒 Termina: <t:${Math.floor(fim / 1000)}:R>`,
          `👥 Vencedores: **${dados.vencedores}**`,
          dados.cargo ? `🔒 Cargo necessário: <@&${dados.cargo.id}>` : null,
        ]
          .filter(Boolean)
          .join('\n')
      )
      .setColor(dados.cor)
      .setTimestamp(fim)
      .setFooter({
        text: `Criado por ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL(),
      });

    if (dados.imagem) embed.setImage(dados.imagem);

    const giveawayId = interaction.id; // ID único do sorteio
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`giveaway_join_${giveawayId}`)
        .setLabel('Participar')
        .setEmoji('🎉')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`giveaway_leave_${giveawayId}`)
        .setLabel('Sair')
        .setEmoji('❌')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`giveaway_list_${giveawayId}`)
        .setLabel('Ver participantes')
        .setEmoji('👥')
        .setStyle(ButtonStyle.Secondary)
    );

    // Reply sem fetchReply
    await interaction.reply({ embeds: [embed], components: [row] });

    // Agora pegamos a mensagem do reply com fetchReply
    const msg = await interaction.fetchReply();
    client.sorteiosTemp[giveawayId] = { dados, participantes: new Set(), msg, fim };

    // Collector do botão
    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: duracao,
    });
    collector.on('collect', async btn => {
      const buttonHandler = require('../Buttons/sorteioButton');
      buttonHandler.run(client, btn);
    });

    collector.on('end', async () => {
      const disabledRow = new ActionRowBuilder().addComponents(
        row.components.map(c => c.setDisabled(true))
      );
      await msg.edit({ components: [disabledRow] });

      const participantes = Array.from(client.sorteiosTemp[giveawayId]?.participantes || []);
      if (participantes.length === 0) {
        return msg.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor('Red')
              .setTitle('🎉 Sorteio Encerrado')
              .setDescription('Ninguém participou 😢'),
          ],
        });
      }

      const users = [...participantes];
      const ganhadores = [];
      for (let i = 0; i < Math.min(dados.vencedores, users.length); i++) {
        const index = Math.floor(Math.random() * users.length);
        ganhadores.push(users.splice(index, 1)[0]);
      }

      const resultEmbed = new EmbedBuilder()
        .setTitle('🏆 Sorteio Finalizado!')
        .setColor('Gold')
        .setDescription(
          [
            `**🎁 Prêmio:** ${dados.premio}`,
            `**🎊 Vencedores:** ${ganhadores.map(id => `<@${id}>`).join(', ')}`,
            `**👥 Participantes:** ${participantes.length}`,
          ].join('\n')
        )
        .setFooter({
          text: `Parabéns aos vencedores!`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();

      await msg.channel.send({
        content: `🎉 Parabéns ${ganhadores.map(id => `<@${id}>`).join(', ')}!`,
        embeds: [resultEmbed],
      });
      delete client.sorteiosTemp[giveawayId];
    });
  },
};
