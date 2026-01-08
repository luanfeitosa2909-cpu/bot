const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { logError, logInfo } = require('../../Utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('painel')
    .setDescription('🎮 Exibe um painel interativo com seus dados e slots.')
    .addUserOption(opt =>
      opt
        .setName('usuario')
        .setDescription('Visualizar o painel de outro jogador')
        .setRequired(false)
    ),

  run: async (client, interaction, clientMongo) => {
    const { STAFF_ROLE_ID } = process.env;

    const userId = interaction.user.id;
    const targetUser = interaction.options.getUser('usuario') || interaction.user;

    const isStaff = interaction.member.roles.cache.has(STAFF_ROLE_ID);

    if (targetUser.id !== userId && !isStaff) {
      return interaction.reply({
        content: '🚫 Você não tem permissão para ver o painel de outros jogadores.',
        flags: 1 << 6,
      });
    }

    const db = clientMongo.db('ProjetoGenoma');
    const collectionDataBase = db.collection('DataBase');
    const collectionInventario = db.collection('Inventario');

    try {
      // Busca as informações do jogador alvo na base de dados
      const userData = await collectionDataBase.findOne({ user_id: targetUser.id });

      if (!userData?.steamid) {
        return interaction.reply({
          content: '⚠️ Este jogador ainda não vinculou a conta Steam.',
          flags: 1 << 6,
        });
      }

      // Busca o inventário do jogador alvo baseado no SteamID
      let invData = await collectionInventario.findOne({
        user_id: targetUser.id,
        steamid: userData.steamid,
      });

      if (!invData) {
        invData = {
          slots: [
            { nome: 'Vazio', tier: 0, tipo: 'N/A', saude: '100%', local: 'N/A' },
            { nome: 'Vazio', tier: 0, tipo: 'N/A', saude: '100%', local: 'N/A' },
            { nome: 'Vazio', tier: 0, tipo: 'N/A', saude: '100%', local: 'N/A' },
          ],
        };
      }

      const embed = criarEmbedHome(interaction, targetUser, userData);
      const row = criarBotoes('home');

      await interaction.reply({
        embeds: [embed],
        components: [row],
        flags: 1 << 6,
      });

      const collector = interaction.channel.createMessageComponentCollector({
        filter: i => i.user.id === userId,
        time: 90_000,
      });

      collector.on('collect', async i => {
        if (!i.isButton()) return;

        try {
          await i.deferUpdate();
        } catch {
          // Pode já estar respondida ou expirada
          return;
        }

        if (i.customId === 'painel_home') {
          const embed = criarEmbedHome(i, targetUser, userData);
          const row = criarBotoes('home');
          await i.editReply({ embeds: [embed], components: [row] });
        }

        if (i.customId === 'painel_slots') {
          const embed = criarEmbedSlots(invData, targetUser);
          const row = criarBotoes('slots');
          await i.editReply({ embeds: [embed], components: [row] });
        }
      });

      collector.on('end', async () => {
        try {
          const disabledRow = criarBotoes('desativar');
          await interaction.editReply({ components: [disabledRow] });
        } catch (err) {
          logInfo('Não foi possível desativar botões, provavelmente a mensagem foi removida.');
        }
      });
    } catch (err) {
      logError('Erro ao executar /painel:', err);
      return interaction.reply({
        content: '❌ Ocorreu um erro ao carregar o painel.',
        flags: 1 << 6,
      });
    }
  },
};

// Embed principal
function criarEmbedHome(interaction, user, data) {
  return new EmbedBuilder()
    .setColor('#1e90ff')
    .setTitle('🏠 Painel Principal do Jogador')
    .setDescription(
      [
        '📡 **Status do Jogador**',
        `Você está conectado ao painel **${interaction.guild?.name || 'Servidor'}**.`,
        '\u200B',
      ].join('\n')
    )
    .addFields(
      { name: '🆔 SteamID Vinculado', value: `\`${data.steamid}\`` },
      { name: '👤 Discord', value: `<@${user.id}>`, inline: true },
      { name: '🧾 ID Discord', value: `\`${user.id}\``, inline: true },
      {
        name: '📺 Live Twitch',
        value: '[🎥 Assista à Transmissão Ao Vivo](https://twitch.tv/goldzerak)',
      }
    )
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: 'Use os botões abaixo para navegar.' })
    .setTimestamp();
}

// Embed de slots
function criarEmbedSlots(invData, user) {
  const slots = invData?.slots ?? [];

  const embed = new EmbedBuilder()
    .setColor('#facc15')
    .setTitle('🎒 Gerenciador de Slots de Dinos')
    .setDescription(
      [
        '🔧 **Organize seus slots de forma estratégica.**',
        'Salve, visualize ou troque seus dinos salvos aqui.',
        '\u200B',
      ].join('\n')
    )
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: 'Use o botão 🏠 Home para voltar ao painel principal.' })
    .setTimestamp();

  for (let i = 0; i < 3; i++) {
    const slot = slots[i];
    embed.addFields({
      name: `🎯 Slot ${i + 1}`,
      value: slot
        ? `• **Nome:** ${slot.nome || 'Desconhecido'}\n• **Tier:** ${slot.tier ?? 0}\n• **Tipo:** ${
            slot.tipo || 'N/A'
          }\n• **Saúde:** ${slot.saude || '100%'}\n• **Local:** ${slot.local || 'N/A'}`
        : '`[ Vazio ]`',
      inline: true,
    });
  }

  return embed;
}

// Botões de navegação
function criarBotoes(pagina) {
  const row = new ActionRowBuilder();

  const homeBtn = new ButtonBuilder()
    .setCustomId('painel_home')
    .setLabel('🏠 Home')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(pagina === 'desativar');

  const slotsBtn = new ButtonBuilder()
    .setCustomId('painel_slots')
    .setLabel('🎒 Slots')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(pagina === 'desativar');

  if (pagina === 'slots') {
    homeBtn.setStyle(ButtonStyle.Secondary);
    slotsBtn.setStyle(ButtonStyle.Primary);
  }

  row.addComponents(homeBtn, slotsBtn);
  return row;
}
