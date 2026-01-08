const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const logger = require('../../Utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resetarcoins')
    .setDescription('Reseta ou apaga os coins de todos os usuários.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option
        .setName('modo')
        .setDescription('Escolha entre resetar ou apagar os coins')
        .setRequired(true)
        .addChoices(
          { name: 'Resetar para 0', value: 'reset' },
          { name: 'Apagar campo coins', value: 'apagar' }
        )
    ),

  async run(client, interaction, clientMongo) {
    const logger = require('../../Utils/logger');
    const modo = interaction.options.getString('modo');

    await interaction.deferReply({ ephemeral: true });

    // Conexão ao MongoDB
    const mongoClient = clientMongo || client.mongoClient;
    if (!mongoClient) {
      return interaction.editReply({
        content: '❌ Banco de dados não conectado no client.',
        ephemeral: true,
      });
    }

    const db = mongoClient.db('PrimordialSurvival');
    const collection = db.collection('DataBase');

    try {
      let resultado;

      if (modo === 'reset') {
        resultado = await collection.updateMany({}, { $set: { coins: 0 } });
      } else if (modo === 'apagar') {
        resultado = await collection.updateMany({}, { $unset: { coins: '' } });
      }

      await interaction.editReply({
        content: `✅ Coins ${modo === 'reset' ? 'resetados para 0' : 'apagados'} em ${
          resultado.modifiedCount
        } usuários.`,
        ephemeral: true,
      });
      logger.logInfo(
        'resetarcoins',
        `Operação ${modo} aplicada em ${resultado.modifiedCount} usuários por ${interaction.user.tag}`
      );
    } catch (error) {
      logger.logError('resetarcoins', error);
      try {
        if (!interaction.replied)
          await interaction.editReply({
            content: '❌ Ocorreu um erro ao atualizar os dados.',
            ephemeral: true,
          });
        else
          await interaction.followUp({
            content: '❌ Ocorreu um erro ao atualizar os dados.',
            ephemeral: true,
          });
      } catch (e) {
        logger.logError('resetarcoins_notify_error', e);
      }
    }
  },
};
