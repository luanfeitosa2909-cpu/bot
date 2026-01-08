// interactions/Buttons/painelButtons.js

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Função que cria os botões para o painel
function criarBotoes(pagina) {
  const row = new ActionRowBuilder(); // Criação da linha que conterá os botões

  // Botão Home: Direciona para o painel principal
  const homeBtn = new ButtonBuilder()
    .setCustomId('painel_home') // Identificador único para este botão
    .setLabel('🏠 Home') // Texto do botão
    .setStyle(ButtonStyle.Primary) // Estilo do botão (cor)
    .setDisabled(pagina === 'desativar'); // Desativa o botão se a página for "desativar"

  // Botão Slots: Direciona para a página de slots
  const slotsBtn = new ButtonBuilder()
    .setCustomId('painel_slots') // Identificador único para este botão
    .setLabel('🎒 Slots') // Texto do botão
    .setStyle(ButtonStyle.Secondary) // Estilo do botão (cor)
    .setDisabled(pagina === 'desativar'); // Desativa o botão se a página for "desativar"

  // Se estamos na página de "slots", mudamos a aparência do botão:
  if (pagina === 'slots') {
    homeBtn.setStyle(ButtonStyle.Secondary); // Torna o botão Home secundário
    slotsBtn.setStyle(ButtonStyle.Primary); // Torna o botão Slots primário
  }

  // Adiciona os botões à linha
  row.addComponents(homeBtn, slotsBtn);

  return row; // Retorna a linha com os botões
}

module.exports = {
  criarBotoes,
};
