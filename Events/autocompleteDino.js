// Events/autocompleteDino.js
const { Events } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  async run(client, interaction, clientMongo) {
    // Só continua se for autocomplete
    if (!interaction.isAutocomplete()) return;

    // Comandos que usam autocomplete de dinossauros
    const cmds = ['dino', 'combate'];
    if (!cmds.includes(interaction.commandName)) return;

    // Qual opção está sendo digitada?
    const focusedName = interaction.options.getFocused(true).name;
    // Para /dino é "nome"; para /combate pode ser "desafiante" ou "desafiado"
    if (!['nome', 'desafiante', 'desafiado'].includes(focusedName)) {
      return interaction.respond([]);
    }

    const focused = interaction.options.getFocused().toLowerCase();

    try {
      const dinos = await clientMongo
        .db('ProjetoGenoma')
        .collection('Dinossauros')
        .find({ nome: { $regex: focused, $options: 'i' } })
        .limit(25)
        .toArray();

      const suggestions = dinos.map(d => ({
        name: d.nome,
        value: d.nome,
      }));

      await interaction.respond(suggestions);
    } catch (err) {
      console.error('Erro no autocomplete de dinos:', err);
      await interaction.respond([]);
    }
  },
};
