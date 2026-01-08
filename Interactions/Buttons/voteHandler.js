const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
  type: 'button',
  customId: null,
  match: id => ['vote_yes', 'vote_no', 'vote_neutral'].includes(id),

  run: async (client, interaction, clientMongo) => {
    const { customId, message, user } = interaction;
    const collection = clientMongo.db().collection('Sugestao');
    const sugestao = await collection.findOne({ messageId: message.id });

    if (!sugestao) {
      return interaction.reply({
        content: '❌ Não foi possível encontrar esta sugestão no sistema.',
        flags: 1 << 6,
      });
    }

    // Cria conjuntos para manipulação de votos
    let votesYes = new Set(sugestao.votesYes);
    let votesNo = new Set(sugestao.votesNo);

    // Só altera votos se for "sim" ou "não"
    if (customId === 'vote_yes' || customId === 'vote_no') {
      // Remove votos anteriores caso o usuário mude de opinião
      votesYes.delete(user.id);
      votesNo.delete(user.id);

      if (customId === 'vote_yes') votesYes.add(user.id);
      if (customId === 'vote_no') votesNo.add(user.id);

      // Atualiza no MongoDB
      await collection.updateOne(
        { messageId: message.id },
        { $set: { votesYes: Array.from(votesYes), votesNo: Array.from(votesNo) } }
      );
    }

    // Calcula totais e porcentagens
    const totalYes = votesYes.size;
    const totalNo = votesNo.size;
    const total = totalYes + totalNo;
    const percentYes = total ? ((totalYes / total) * 100).toFixed(2) : '0.00';
    const percentNo = total ? ((totalNo / total) * 100).toFixed(2) : '0.00';

    // Atualiza labels dos botões com porcentagem
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('vote_yes')
        .setLabel(`✅ A favor: ${totalYes} | ${percentYes}%`)
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('vote_no')
        .setLabel(`❌ Contra: ${totalNo} | ${percentNo}%`)
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('vote_neutral')
        .setLabel('📄 Relatório')
        .setStyle(ButtonStyle.Secondary)
    );

    await message.edit({ components: [row] });

    // Botão "relatório" apenas mostra embed informativo
    if (customId === 'vote_neutral') {
      const embedRelatorio = new EmbedBuilder()
        .setTitle('📊 Relatório da Sugestão')
        .setColor('#5865F2')
        .setDescription(`Sugestão: **${sugestao.titulo}**`)
        .addFields(
          {
            name: '> ``✅`` A favor',
            value: `${totalYes} voto(s) | ${percentYes}%`,
            inline: false,
          },
          { name: '> ``❌`` Contra', value: `${totalNo} voto(s) | ${percentNo}%`, inline: false },
          { name: '> ``🔹`` Total de votos', value: `${total}`, inline: false }
        )
        .setFooter({
          text: `Solicitado por: ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      return interaction.reply({ embeds: [embedRelatorio], flags: 1 << 6 });
    }

    // Confirmação de voto
    const embedConfirm = new EmbedBuilder()
      .setDescription(
        `✅ **Seu voto foi registrado com sucesso!**\nVocê votou: **${
          customId === 'vote_yes' ? 'A favor ✅' : 'Contra ❌'
        }**`
      )
      .setColor('#57F287')
      .setFooter({
        text: `Sugestão: ${sugestao.titulo}`,
        iconURL: message.guild.iconURL({ dynamic: true }),
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embedConfirm], flags: 1 << 6 });
  },
};
