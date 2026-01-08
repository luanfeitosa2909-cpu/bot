const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('adddino')
    .setDescription('🦖 Adiciona um dinossauro ao seu inventário.')
    .addStringOption(option =>
      option.setName('nome').setDescription('Nome do dinossauro').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('tipo').setDescription('Tipo da espécie (ex: Carnívoro)').setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('nivel').setDescription('Nível do dinossauro (padrão: 1)').setRequired(false)
    )
    .addStringOption(option =>
      option.setName('saude').setDescription('Saúde do dino (ex: 100%)').setRequired(false)
    )
    .addStringOption(option =>
      option.setName('status').setDescription('Status (Vivo, Morto, etc)').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  run: async (client, interaction, clientMongo) => {
    const logger = require('../../Utils/logger');
    await interaction.deferReply({ ephemeral: true });
    try {
      const userId = interaction.user.id;

      const nome = interaction.options.getString('nome');
      const tipo = interaction.options.getString('tipo');
      const nivel = interaction.options.getInteger('nivel') ?? 1;
      const saude = interaction.options.getString('saude') ?? '100%';
      const status = interaction.options.getString('status') ?? 'Vivo';

      const dino = { nome, tipo, nivel, saude, status };

      const db = clientMongo.db('ProjetoGenoma');
      const collection = db.collection('Inventario');

      const player = await collection.findOne({ user_id: userId });

      if (player?.slots?.length >= 3) {
        return interaction.editReply({
          content: '⚠️ Seu inventário já está cheio. Use `/removerdino` para liberar espaço.',
          ephemeral: true,
        });
      }

      await collection.updateOne({ user_id: userId }, { $push: { slots: dino } }, { upsert: true });

      return interaction.editReply({
        content: `✅ Dinossauro \`${nome}\` adicionado ao seu inventário!`,
        ephemeral: true,
      });
    } catch (err) {
      logger.logError('Erro ao adicionar dino:', err);
      try {
        if (!interaction.replied)
          await interaction.editReply({
            content: '❌ Erro interno ao adicionar dinossauro.',
            ephemeral: true,
          });
        else
          await interaction.followUp({
            content: '❌ Erro interno ao adicionar dinossauro.',
            ephemeral: true,
          });
      } catch (e) {
        logger.logError('adicionarDino_notify_error', e);
      }
    }
  },
};
