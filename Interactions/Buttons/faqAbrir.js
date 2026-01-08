const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  type: 'button',
  customId: null, // usaremos match
  match: id => id === 'faq_button',

  async run(client, interaction) {
    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('faq_menu')
        .setPlaceholder('📂 Selecione uma categoria')
        .addOptions(
          {
            label: 'The Isle - Jogo',
            description: 'Gameplay, evolução, comandos e dicas',
            value: 'faq_the_isle',
            emoji: '🦖',
          },
          {
            label: 'Bot',
            description: 'Comandos, economia e integração com Steam',
            value: 'faq_bot',
            emoji: '🤖',
          },
          {
            label: 'Servidor Discord',
            description: 'Regras, suporte e canais úteis',
            value: 'faq_discord',
            emoji: '💬',
          }
        )
    );

    const embed = new EmbedBuilder()
      .setColor('#6a0dad')
      .setTitle('📘 Central de Ajuda • FAQ')
      .setDescription(
        [
          `👋 Seja bem-vindo à **Central de Ajuda** do ${interaction.guild.name}!`,
          '',
          'Aqui você encontra respostas rápidas e diretas sobre as principais dúvidas.',
          '',
          '🧭 Use o menu abaixo para navegar pelas categorias.',
          '',
          '> 💡 *Você pode trocar de aba a qualquer momento.*',
        ].join('\n')
      )
      .addFields({ name: '📂 Categorias disponíveis', value: '🦖 The Isle • 🤖 Bot • 💬 Discord' })
      .setFooter({ text: `${interaction.guild.name} • Suporte Automatizado` })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      components: [menu],
      flags: 1 << 6, // substitui flags: 1 << 6
    });
  },
};
