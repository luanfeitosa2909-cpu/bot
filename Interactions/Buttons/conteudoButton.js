const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  customId: 'abrir_modal_inscricao',
  type: 'button',

  run: async (client, interaction) => {
    const modal = new ModalBuilder()
      .setCustomId('form_criador_conteudo')
      .setTitle('📥 Inscrição - Criador de Conteúdo'); // ✅ < 45 caracteres

    // 1️⃣ Nome no Discord
    const nomeDiscord = new TextInputBuilder()
      .setCustomId('nome_discord')
      .setLabel('📛 Nome no Discord') // ✅ 21 caracteres
      .setPlaceholder('Ex: Luan#1234')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    // 2️⃣ Link do canal
    const linkCanal = new TextInputBuilder()
      .setCustomId('link_canal')
      .setLabel('📺 Link do canal ou plataforma') // ✅ 35 caracteres
      .setPlaceholder('Ex: https://youtube.com/@seudominio')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    // 3️⃣ Plataforma principal + frequência de postagens
    const plataforma = new TextInputBuilder()
      .setCustomId('plataforma')
      .setLabel('💻 Plataforma e frequência') // ✅ 32 caracteres
      .setPlaceholder('Ex: Twitch - lives 3x por semana')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    // 4️⃣ Tipo de conteúdo produzido
    const tipoConteudo = new TextInputBuilder()
      .setCustomId('tipo_conteudo')
      .setLabel('🎮 Tipo de conteúdo produzido') // ✅ 33 caracteres
      .setPlaceholder('Gameplay, tutoriais, vlogs, etc...')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    // 5️⃣ Motivação para entrar + observações (texto longo)
    const motivacao = new TextInputBuilder()
      .setCustomId('motivacao')
      .setLabel('🧠 Por que fazer parte do Projeto Genoma?') // ✅ 41 caracteres
      .setPlaceholder('Fale sobre seu interesse e dedicação...')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    // Adicionando os campos (máximo de 5 linhas permitidas)
    const rows = [
      new ActionRowBuilder().addComponents(nomeDiscord),
      new ActionRowBuilder().addComponents(linkCanal),
      new ActionRowBuilder().addComponents(plataforma),
      new ActionRowBuilder().addComponents(tipoConteudo),
      new ActionRowBuilder().addComponents(motivacao),
    ];

    modal.addComponents(...rows);
    await interaction.showModal(modal);
  },
};
