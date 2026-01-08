// Interactions/StringSelectMenus/faqHandler.js
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  type: 'select',
  customId: 'faq_menu',
  async run(client, interaction, _clientMongo) {
    if (!interaction.isStringSelectMenu()) return;

    const selection = interaction.values[0];
    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(this.customId)
        .setPlaceholder('📂 Selecione uma categoria')
        .addOptions(
          {
            label: 'The Isle - Jogo',
            description: 'Gameplay, comandos e dicas',
            value: 'faq_the_isle',
            emoji: '🦖',
          },
          {
            label: 'Bot',
            description: 'Comandos, economia e Steam',
            value: 'faq_bot',
            emoji: '🤖',
          },
          {
            label: 'Servidor Discord',
            description: 'Regras, suporte e canais',
            value: 'faq_discord',
            emoji: '💬',
          }
        )
    );

    // primeira renderização
    if (!selection) {
      const intro = new EmbedBuilder()
        .setColor('#6a0dad')
        .setTitle('📘 Central de Ajuda • FAQ')
        .setDescription('👋 Bem-vindo! Use o menu abaixo para navegar pelas categorias.')
        .addFields({ name: '📂 Categorias', value: '🦖 Jogo • 🤖 Bot • 💬 Discord' })
        .setTimestamp();
      return interaction.reply({ embeds: [intro], components: [menu], flags: 1 << 6 });
    }

    // seleção
    const replyEmbed = new EmbedBuilder().setColor('#6a0dad').setTimestamp();
    if (selection === 'faq_the_isle') {
      replyEmbed.setTitle('🦖 FAQ - The Isle').addFields(
        {
          name: 'Como jogar?',
          value:
            'Controle seu dinossauro, sobreviva num vasto mapa cheio de predadores e sobreviva o maximo que puder.',
        },
        { name: 'Dinossauros disponíveis', value: 'Raptors, Triceratops, Dilofossaurus, etc.' },
        {
          name: 'Como evoluir?',
          value: 'Participe de calls para ganhar coins e trocar por beneficios.',
        }
      );
    } else if (selection === 'faq_bot') {
      replyEmbed.setTitle('🤖 FAQ - Bot').addFields(
        {
          name: 'Sistema de coins',
          value: 'Ganhe em chamadas, eventos, jogando ou interagindo.',
        },
        {
          name: 'Como utilizar coins?',
          value: 'Vá para o canal <#1386085767004291174> e selecione o produto que deseja.',
        },
        { name: 'Verificar SteamID', value: 'Clique no botão em <#1353475845062398093> .' }
      );
    } else if (selection === 'faq_discord') {
      replyEmbed.setTitle('💬 FAQ - Discord').addFields(
        { name: 'Regras', value: 'Confira em <#1353475836598030367>.' },
        {
          name: 'Abrir ticket',
          value: 'Use o painel acima para selecionar a categoria do ticket.',
        },
        {
          name: 'Denúncias',
          value:
            'Selecione na categoria de denúncia e nos envie o maximo de informações possiveis.',
        }
      );
    } else {
      replyEmbed.setTitle('❓ Categoria inválida').setDescription('Tente novamente.');
    }

    await interaction.update({ embeds: [replyEmbed], components: [menu] });
  },
};
