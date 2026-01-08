const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  customId: 'abrir_modal_staff',
  type: 'button',

  run: async (client, interaction) => {
    const modal = new ModalBuilder()
      .setCustomId('form_staff')
      .setTitle('📥 Formulário de Inscrição - Staff');

    const nomeDiscord = new TextInputBuilder()
      .setCustomId('nome_discord')
      .setLabel('📛 Nome de usuário no Discord')
      .setPlaceholder('Ex: Luan#1234')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const idade = new TextInputBuilder()
      .setCustomId('idade')
      .setLabel('📅 Sua idade')
      .setPlaceholder('Ex: 18')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const disponibilidade = new TextInputBuilder()
      .setCustomId('disponibilidade')
      .setLabel('🕒 Quanto tempo tem disponível por semana?')
      .setPlaceholder('Ex: 3h por dia, finais de semana, etc...')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const experiencia = new TextInputBuilder()
      .setCustomId('experiencia')
      .setLabel('📌 Já foi staff antes? Em qual servidor?')
      .setPlaceholder('Fale um pouco sobre sua experiência (ou diga que não tem)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const motivacao = new TextInputBuilder()
      .setCustomId('motivacao')
      .setLabel('🧠 Por que deseja entrar para a equipe?')
      .setPlaceholder('Explique seu interesse, pontos fortes e o que pode contribuir.')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const rows = [
      new ActionRowBuilder().addComponents(nomeDiscord),
      new ActionRowBuilder().addComponents(idade),
      new ActionRowBuilder().addComponents(disponibilidade),
      new ActionRowBuilder().addComponents(experiencia),
      new ActionRowBuilder().addComponents(motivacao),
    ];

    modal.addComponents(...rows);
    await interaction.showModal(modal);
  },
};
