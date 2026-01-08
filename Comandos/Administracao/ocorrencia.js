const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ocorrencia')
    .setDescription('Registrar uma ocorrência para um jogador.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option
        .setName('jogador')
        .setDescription('Selecione o jogador (Discord user).')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('gravidade')
        .setDescription('Gravidade da infração')
        .setRequired(true)
        .addChoices(
          { name: 'Leve', value: 'leve' },
          { name: 'Média', value: 'media' },
          { name: 'Grave', value: 'grave' }
        )
    ),

  async run(client, interaction) {
    const logger = require('../../Utils/logger');
    try {
      const jogadorUser = interaction.options.getUser('jogador');
      const gravidade = interaction.options.getString('gravidade');

      const modal = new ModalBuilder()
        .setCustomId(`modal_ocorrencia|${jogadorUser.id}|${gravidade}`)
        .setTitle('Registrar Ocorrência');

      const descricaoInput = new TextInputBuilder()
        .setCustomId('descricao')
        .setLabel('Descreva o ocorrido')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const observacoesInput = new TextInputBuilder()
        .setCustomId('observacoes')
        .setLabel('Observações adicionais (opcional)')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);

      const duracaoInput = new TextInputBuilder()
        .setCustomId('duracao')
        .setLabel('Duração da punição (ex: 7 dias / N/A)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(descricaoInput),
        new ActionRowBuilder().addComponents(observacoesInput),
        new ActionRowBuilder().addComponents(duracaoInput)
      );

      await interaction.showModal(modal);
    } catch (err) {
      logger.logError('ocorrencia', err);
      try {
        if (!interaction.replied)
          await interaction.reply({
            content: '❌ Erro ao abrir modal de ocorrência.',
            ephemeral: true,
          });
      } catch (e) {
        logger.logError('ocorrencia_notify_error', e);
      }
    }
  },
};
