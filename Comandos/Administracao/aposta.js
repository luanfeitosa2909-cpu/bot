// Comandos/diversao/aposta.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
} = require('discord.js');

const COLLECTION_NAME = 'apostas';
const DEFAULT_MIN = 100;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('aposta')
    .setDescription('Cria uma aposta entre dois lutadores (com dinossauros).')
    .addUserOption(opt =>
      opt.setName('lutador1').setDescription('Primeiro lutador').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('dino1').setDescription('Dinossauro do lutador 1').setRequired(true)
    )
    .addUserOption(opt =>
      opt.setName('lutador2').setDescription('Segundo lutador').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('dino2').setDescription('Dinossauro do lutador 2').setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('minimo').setDescription('Valor mínimo para apostar').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  async run(client, interaction, clientMongo) {
    const logger = require('../../Utils/logger');
    await interaction.deferReply({ ephemeral: true });
    try {
      const lutador1 = interaction.options.getUser('lutador1');
      const lutador2 = interaction.options.getUser('lutador2');
      const dino1 = interaction.options.getString('dino1');
      const dino2 = interaction.options.getString('dino2');
      const minimo = interaction.options.getInteger('minimo') || DEFAULT_MIN;

      if (lutador1.id === lutador2.id) {
        return interaction.editReply({ content: '❌ Os lutadores não podem ser a mesma pessoa.' });
      }

      const db = clientMongo && typeof clientMongo.db === 'function' ? clientMongo.db() : null;

      // Modo A: permitir apenas 1 aposta ativa por canal
      if (db) {
        const existing = await db
          .collection(COLLECTION_NAME)
          .findOne({ channelId: interaction.channelId, active: true });
        if (existing) {
          return interaction.editReply({
            content: '❌ Já existe uma aposta ativa neste canal. Finalize-a antes de criar outra.',
          });
        }
      } else {
        client.apostasMap = client.apostasMap || new Map();
        const exists = Array.from(client.apostasMap.values()).find(
          a => a.channelId === interaction.channelId && a.active
        );
        if (exists) {
          return interaction.editReply({
            content: '❌ Já existe uma aposta ativa neste canal. Finalize-a antes de criar outra.',
          });
        }
      }

      // 🎨 Embed estilizada
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(`⚔️ BATALHA ÉPICA — ${lutador1.username} VS ${lutador2.username}`)
        .setThumbnail('https://i.imgur.com/pYxZ5DN.png')
        .setDescription(
          `🔥 **Aposta aberta!** Escolha seu lado e registre seu valor.\n` +
            `A arena está aberta... **apenas um sairá vitorioso!** 🩸\n\n` +
            `> 💥 *Clique no botão abaixo para apostar!*`
        )
        .addFields(
          {
            name: `🔴 Lutador 1 — ${lutador1.username}`,
            value: `🦖 Dino: **${dino1}**`,
            inline: true,
          },
          {
            name: `🔵 Lutador 2 — ${lutador2.username}`,
            value: `🦕 Dino: **${dino2}**`,
            inline: true,
          },
          {
            name: '💰 Aposta mínima',
            value: `**${minimo.toLocaleString()} coins**`,
            inline: false,
          }
        )
        .setImage(
          'https://media.discordapp.net/attachments/1385726045034123445/1417537441786761327/image.png'
        )
        .setFooter({
          text: `Sistema de Apostas • ${interaction.guild?.name || 'Servidor'}`,
        })
        .setTimestamp();

      // 🔘 Botões estilizados
      const btnAposta1 = new ButtonBuilder()
        .setCustomId('aposta_vote_1')
        .setLabel(`🔥 Apostar em ${lutador1.username}`)
        .setEmoji('🔴')
        .setStyle(ButtonStyle.Danger);

      const btnAposta2 = new ButtonBuilder()
        .setCustomId('aposta_vote_2')
        .setLabel(`💥 Apostar em ${lutador2.username}`)
        .setEmoji('🔵')
        .setStyle(ButtonStyle.Primary);

      const btnStatus = new ButtonBuilder()
        .setCustomId('aposta_status')
        .setLabel('📊 Ver status da aposta')
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder().addComponents(btnAposta1, btnAposta2, btnStatus);

      // Enviar no canal
      const sent = await interaction.channel.send({ embeds: [embed], components: [row] });

      // Salvar aposta (salva channelId + messageId)
      const apostaDoc = {
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        messageId: sent.id,
        lutador1: { id: lutador1.id, tag: lutador1.tag, nome: lutador1.username, dino: dino1 },
        lutador2: { id: lutador2.id, tag: lutador2.tag, nome: lutador2.username, dino: dino2 },
        minimo,
        bets: [],
        active: true,
        createdAt: new Date(),
      };

      if (db) {
        const res = await db.collection(COLLECTION_NAME).insertOne(apostaDoc);
        apostaDoc._id = res.insertedId;
      }

      // Cache local por messageId (usado pelo modal e pelo handler de botões)
      if (!client.apostasMap) client.apostasMap = new Map();
      client.apostasMap.set(sent.id, apostaDoc);

      await interaction.editReply({ content: '✅ Aposta criada com sucesso!' });
    } catch (err) {
      logger.logError('aposta', err);

      try {
        if (!interaction.replied)
          await interaction.editReply({ content: '❌ Erro interno ao criar aposta.' });
        else
          await interaction.followUp({
            content: '❌ Erro interno ao criar aposta.',
            ephemeral: true,
          });
      } catch (e) {
        logger.logError('aposta_notify_error', e);
      }
    }
  },
};
