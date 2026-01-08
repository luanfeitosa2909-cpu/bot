const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const logger = require('../../Utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removerdino')
    .setDescription('🗑️ Remove um dinossauro do seu inventário.')
    .addIntegerOption(option =>
      option
        .setName('slot')
        .setDescription('Número do slot (1 a 3)')
        .setMinValue(1)
        .setMaxValue(3)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  run: async (client, interaction, clientMongo) => {
    try {
      await interaction.deferReply({ ephemeral: true });
      const userId = interaction.user.id;
      const slot = interaction.options.getInteger('slot');

      const db = clientMongo.db('ProjetoGenoma');
      const collection = db.collection('Inventario');
      const data = await collection.findOne({ user_id: userId });

      if (!data || !data.slots || data.slots.length < slot) {
        return interaction.editReply({
          content: `❌ Nenhum dinossauro encontrado no slot ${slot}.`,
        });
      }

      const removed = data.slots[slot - 1];

      data.slots.splice(slot - 1, 1); // remove o slot

      await collection.updateOne({ user_id: userId }, { $set: { slots: data.slots } });

      return interaction.editReply({
        content: `✅ Dinossauro \`${
          removed.nome || 'Desconhecido'
        }\` foi removido do slot ${slot}.`,
      });
    } catch (err) {
      logger.logError('removerDino', err);
      try {
        if (!interaction.replied)
          await interaction.editReply({ content: '❌ Erro ao remover dinossauro.' });
      } catch (e) {
        logger.logError('removerDino_notify_error', e);
      }
    }
  },
};
