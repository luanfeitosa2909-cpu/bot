const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('comando')
    .setDescription('Descrição do comando'),
  /**
   * run(client, interaction, clientMongo)
   * - client: Discord Client
   * - interaction: Command interaction
   * - clientMongo: MongoDB client (opcional)
   */
  run: async (client, interaction, clientMongo) => {
    await interaction.reply({ content: 'Olá! Comando-exemplo funcionando.', ephemeral: true });
  }
};