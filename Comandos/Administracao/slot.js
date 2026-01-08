const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slot')
    .setDescription('👮 Comando para STAFF gerenciar slots de dinos de um jogador.')
    .addSubcommand(sub =>
      sub
        .setName('adicionar')
        .setDescription('➕ Adiciona um dino ao slot de um jogador.')
        .addUserOption(opt =>
          opt.setName('player').setDescription('Jogador alvo.').setRequired(true)
        )
        .addIntegerOption(opt =>
          opt
            .setName('slot')
            .setDescription('Slot de destino (1, 2 ou 3).')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(3)
        )
        .addStringOption(opt =>
          opt.setName('nome').setDescription('Nome do dino.').setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName('tier').setDescription('Tier do dino.').setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('tipo').setDescription('Tipo do dino.').setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('saude').setDescription('Saúde do dino (ex: 100%).').setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('local').setDescription('Local do dino (ex: South, North).').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('remover')
        .setDescription('➖ Remove o dino de um slot de um jogador.')
        .addUserOption(opt =>
          opt.setName('player').setDescription('Jogador alvo.').setRequired(true)
        )
        .addIntegerOption(opt =>
          opt
            .setName('slot')
            .setDescription('Slot a ser limpo (1, 2 ou 3).')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(3)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  run: async (client, interaction, clientMongo) => {
    const logger = require('../../Utils/logger');
    await interaction.deferReply({ ephemeral: true });

    try {
      const staffMember = interaction.member;
      const staffRoleId = process.env.STAFF_ROLE_ID;

      if (!staffMember.roles.cache.has(staffRoleId)) {
        return interaction.editReply({
          content: '🚫 Você não tem permissão para usar este comando.',
          ephemeral: true,
        });
      }

      const db = clientMongo.db('ProjetoGenoma');
      const collectionDataBase = db.collection('DataBase');
      const collectionInventario = db.collection('Inventario');

      const sub = interaction.options.getSubcommand();
      const targetUser = interaction.options.getUser('player');
      const slotIndex = interaction.options.getInteger('slot') - 1;

      // Buscar o steamID do jogador alvo
      const userData = await collectionDataBase.findOne({ user_id: targetUser.id });
      if (!userData?.steamid) {
        return interaction.editReply({
          content: `⚠️ O jogador <@${targetUser.id}> ainda não vinculou a conta Steam.`,
          ephemeral: true,
        });
      }

      const steamid = userData.steamid;
      let invData = await collectionInventario.findOne({ user_id: targetUser.id, steamid });

      if (!invData) {
        invData = {
          user_id: targetUser.id,
          steamid,
          slots: [
            { nome: 'Vazio', tier: 0, tipo: 'N/A', saude: '100%', local: 'N/A' },
            { nome: 'Vazio', tier: 0, tipo: 'N/A', saude: '100%', local: 'N/A' },
            { nome: 'Vazio', tier: 0, tipo: 'N/A', saude: '100%', local: 'N/A' },
          ],
        };
        await collectionInventario.insertOne(invData);
      }

      if (sub === 'adicionar') {
        const nome = interaction.options.getString('nome');
        const tier = interaction.options.getInteger('tier');
        const tipo = interaction.options.getString('tipo');
        const saude = interaction.options.getString('saude');
        const local = interaction.options.getString('local');

        invData.slots[slotIndex] = { nome, tier, tipo, saude, local };

        await collectionInventario.updateOne(
          { user_id: targetUser.id, steamid },
          { $set: { [`slots.${slotIndex}`]: invData.slots[slotIndex] } },
          { upsert: true }
        );

        return interaction.editReply({
          content: `✅ O dino **${nome}** foi adicionado ao slot **${slotIndex + 1}** de <@${
            targetUser.id
          }>.`,
          ephemeral: true,
        });
      }

      if (sub === 'remover') {
        invData.slots[slotIndex] = {
          nome: 'Vazio',
          tier: 0,
          tipo: 'N/A',
          saude: '100%',
          local: 'N/A',
        };

        await collectionInventario.updateOne(
          { user_id: targetUser.id, steamid },
          { $set: { [`slots.${slotIndex}`]: invData.slots[slotIndex] } },
          { upsert: true }
        );

        return interaction.editReply({
          content: `🗑️ O slot **${slotIndex + 1}** de <@${targetUser.id}> foi limpo.`,
          ephemeral: true,
        });
      }
    } catch (err) {
      logger.logError('slot', err);
      try {
        if (!interaction.replied)
          await interaction.editReply({
            content: '❌ Erro ao processar o comando slot.',
            ephemeral: true,
          });
        else
          await interaction.followUp({
            content: '❌ Erro ao processar o comando slot.',
            ephemeral: true,
          });
      } catch (e) {
        logger.logError('slot_notify_error', e);
      }
    }
  },
};
