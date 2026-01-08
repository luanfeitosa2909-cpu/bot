const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { getUserData } = require('../../database/userData');
const logger = require('../../Utils/logger');

module.exports = {
  type: 'button',
  customId: null,
  match: id => id === 'verificar_steamid',

  run: async (client, interaction) => {
    try {
      const userId = interaction.user.id;
      const existing = await getUserData(userId);

      // Se já verificou, só avisa
      if (existing?.steamid) {
        logger.logInfo(`Usuário ${userId} tentou registrar SteamID já existente.`);
        return interaction.reply({
          content:
            '❌ Você já verificou sua SteamID64.\nSe precisar alterar, fale com um administrador.',
          flags: 1 << 6,
        });
      }

      // Monta o modal
      const modal = new ModalBuilder()
        .setCustomId('modal_steamid')
        .setTitle('🔒 Verificação SteamID64');

      const input = new TextInputBuilder()
        .setCustomId('steamid_input')
        .setLabel('Digite sua SteamID64 (17 dígitos numéricos)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ex: 765611932748958193')
        .setRequired(true);

      const row = new ActionRowBuilder().addComponents(input);
      modal.addComponents(row);

      await interaction.showModal(modal);
      logger.logInfo(`Modal de verificação SteamID enviado para ${userId}`);
    } catch (err) {
      logger.logError('Erro ao abrir modal de verificação SteamID:', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Ocorreu um erro ao abrir o modal de verificação. Tente novamente.',
          flags: 1 << 6,
        });
      }
    }
  },
};
