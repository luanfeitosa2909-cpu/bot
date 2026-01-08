const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserData } = require('../../database/userData');

module.exports = {
  type: 'modal',
  customId: 'modal_sugestao',
  async run(client, interaction, clientMongo) {
    if (!interaction.isModalSubmit() || interaction.customId !== this.customId) return;
    await interaction.deferReply({ flags: 1 << 6 });

    const titulo = interaction.fields.getTextInputValue('input_titulo').trim();
    const sugestao = interaction.fields.getTextInputValue('input_sugestao').trim();
    const categoria =
      interaction.fields.getTextInputValue('input_categoria')?.trim() || 'Não especificada';

    const canalLogs = client.channels.cache.get(process.env.LOG_CHANNEL_SUGESTAO);
    if (!canalLogs?.isTextBased()) {
      return interaction.editReply({
        content: '❌ Não consegui encontrar o canal de sugestões.',
        flags: 1 << 6,
      });
    }

    const userId = interaction.user.id;
    const userData = (await getUserData(userId)) || {};
    if (!userData.steamid || !userData.steamname) {
      return interaction.editReply({
        content: '❌ Você precisa registrar sua SteamID e SteamName.',
        flags: 1 << 6,
      });
    }

    // Monta embed
    const embedSugestao = new EmbedBuilder()
      .setTitle(`💡 ${titulo}`)
      .setColor('#FF0000')
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setDescription(`\`\`\`${sugestao}\`\`\``)
      .addFields({ name: 'Autor', value: `<@${userId}>` }, { name: 'Categoria', value: categoria })
      .setFooter({ text: `${interaction.guild.name}™ © Todos os direitos reservados` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('vote_yes')
        .setLabel('✅ 0 votos')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('vote_no')
        .setLabel('❌ 0 votos')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('vote_neutral').setLabel('?').setStyle(ButtonStyle.Secondary)
    );

    const msg = await canalLogs.send({ embeds: [embedSugestao], components: [row] });

    await msg.startThread({
      name: `Debate: ${titulo}`,
      autoArchiveDuration: 10080,
      reason: 'Thread de debate da sugestão',
    });

    // Salva a sugestão no MongoDB
    const collection = clientMongo.db().collection('Sugestao');
    await collection.insertOne({
      messageId: msg.id,
      guildId: interaction.guild.id,
      titulo,
      descricao: sugestao,
      categoria,
      autorId: userId,
      votesYes: [],
      votesNo: [],
    });

    await interaction.editReply({ content: '✅ Sugestão enviada com sucesso!', flags: 1 << 6 });
  },
};
