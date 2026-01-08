require('dotenv').config();
const {
  StringSelectMenuBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const produtos = require('../../Loja/produtosLoja'); // Objeto de produtos
const steamChannelId = process.env.STEAM_CHANNEL_ID;

module.exports = {
  type: 'select',
  customId: 'loja_selecionar',

  async run(client, interaction, clientMongo) {
    if (!interaction.isStringSelectMenu() || interaction.customId !== this.customId) return;

    // 🔹 Verificação SteamID
    const db = clientMongo.db('ProjetoGenoma');
    const userCollection = db.collection('DataBase');
    const userId = interaction.user.id;
    const userData = await userCollection.findOne({ user_id: userId });

    if (!userData?.steamid) {
      const steamEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ SteamID não cadastrada')
        .setDescription(
          `Você precisa cadastrar sua SteamID antes de comprar.\nCadastre em <#${steamChannelId}>.`
        )
        .setTimestamp()
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });
      return interaction.reply({ embeds: [steamEmbed], flags: 1 << 6 });
    }

    // 🔹 Produto selecionado
    const produtoId = interaction.values[0];
    const produto = produtos[produtoId];

    if (!produto) {
      const invalidoEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Produto inválido')
        .setDescription('O produto selecionado não existe. Por favor, tente novamente.')
        .setTimestamp()
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });
      return interaction.reply({ embeds: [invalidoEmbed], flags: 1 << 6 });
    }

    // 🔹 Apenas reinicia o select menu (embed original não é alterada)
    const menu = new StringSelectMenuBuilder()
      .setCustomId('loja_selecionar')
      .setPlaceholder('🦴 Escolha outro item pré-histórico')
      .addOptions(
        Object.entries(produtos).map(([key, p]) => ({
          label: p.label,
          description: `💰 ${p.preco.toLocaleString('pt-BR')} coins`,
          value: key,
        }))
      );
    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.update({ components: [row] });

    // 🔹 Botões de confirmação
    const confirmarBtn = new ButtonBuilder()
      .setCustomId(`confirmar_${produtoId}`)
      .setLabel('Confirmar Compra')
      .setStyle(ButtonStyle.Success);

    const cancelarBtn = new ButtonBuilder()
      .setCustomId('cancelar')
      .setLabel('Cancelar')
      .setStyle(ButtonStyle.Danger);

    const cupomBtn = new ButtonBuilder()
      .setCustomId(`cupom_${produtoId}`)
      .setLabel('Adicionar Cupom')
      .setStyle(ButtonStyle.Primary);

    const rowConfirm = new ActionRowBuilder().addComponents(confirmarBtn, cancelarBtn, cupomBtn);

    // 🔹 Embed de confirmação
    const confirmEmbed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle('🛒 Confirmação de Compra')
      .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 512 }))
      .setDescription(
        `Você selecionou o produto **${produto.label}**\n` +
          `💰 Preço: **${produto.preco.toLocaleString('pt-BR')} coins**\n\n` +
          `Clique em **Confirmar Compra** para finalizar ou **Cancelar** para desistir.`
      )
      .setTimestamp()
      .setFooter({
        text: `The Isle • ${interaction.guild.name}`,
        iconURL: interaction.guild.iconURL(),
      });

    await interaction.followUp({
      embeds: [confirmEmbed],
      components: [rowConfirm],
      flags: 1 << 6, // flags 1 << 6
    });
  },
};
