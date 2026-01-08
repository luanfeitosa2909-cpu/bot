const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Faz o bot enviar uma mensagem em embed (via formulário)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption(option =>
      option
        .setName('mencao')
        .setDescription('Cargo a ser mencionado (opcional)')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName('mencionar_everyone')
        .setDescription('Deseja mencionar @everyone?')
        .setRequired(false)
    ),

  async run(client, interaction) {
    const logger = require('../../Utils/logger');

    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          content: '❌ Você não tem permissão para usar este comando.',
          ephemeral: true,
        });
      }

      const mencao = interaction.options.getRole('mencao');
      const mencionarEveryone = interaction.options.getBoolean('mencionar_everyone');

      const modal = new ModalBuilder()
        .setCustomId(`modal_say_${interaction.id}`)
        .setTitle('Mensagem a ser enviada');

      const texto = new TextInputBuilder()
        .setCustomId('mensagem_input')
        .setLabel('Mensagem para enviar (embed)')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setPlaceholder('Você pode usar várias linhas, emojis...');

      const row = new ActionRowBuilder().addComponents(texto);
      modal.addComponents(row);

      await interaction.showModal(modal);

      const submitted = await interaction
        .awaitModalSubmit({
          filter: i =>
            i.customId === `modal_say_${interaction.id}` && i.user.id === interaction.user.id,
          time: 2 * 60 * 1000,
        })
        .catch(() => null);

      if (!submitted) {
        return interaction.followUp({
          content: '⏱️ Tempo esgotado. Nenhuma mensagem foi enviada.',
          ephemeral: true,
        });
      }

      const mensagem = submitted.fields.getTextInputValue('mensagem_input');

      const mencoes = [];
      if (mencionarEveryone) mencoes.push('@everyone');
      if (mencao) mencoes.push(`${mencao}`);
      const conteudoMencao = mencoes.length > 0 ? mencoes.join(' ') : null;

      try {
        await interaction.channel.send({
          content: conteudoMencao,
          embeds: [{ description: mensagem, color: 0x2ecc71 }],
        });
        await submitted.reply({ content: '📨 Mensagem enviada com sucesso.', ephemeral: true });
      } catch (error) {
        logger.logError('say', error);
        await submitted.reply({
          content: '❌ Ocorreu um erro ao enviar a mensagem.',
          ephemeral: true,
        });
      }
    } catch (err) {
      logger.logError('say', err);
      try {
        if (!interaction.replied)
          await interaction.reply({ content: '❌ Erro interno no comando say.', ephemeral: true });
      } catch (e) {
        logger.logError('say_notify_error', e);
      }
    }
  },
};
