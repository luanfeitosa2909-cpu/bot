const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Veja informações de um usuário.')
    .addUserOption(option =>
      option.setName('usuário').setDescription('Mencione um usuário.').setRequired(true)
    ),

  run: async (client, interaction, _clientMongo) => {
    const user = interaction.options.getUser('usuário');
    const data_conta = user.createdAt.toLocaleString('pt-BR');
    const id = user.id;
    const tag = user.tag;
    const is_bot = user.bot ? 'Sim' : 'Não';

    const embed = new EmbedBuilder()
      .setColor('Random')
      .setAuthor({ name: user.username, iconURL: user.displayAvatarURL({ dynamic: true }) })
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setTitle('Informações do Usuário:')
      .addFields(
        { name: '🎇 Tag:', value: `\`${tag}\``, inline: false },
        { name: '🆔 Id:', value: `\`${id}\``, inline: false },
        { name: '📅 Criação da conta:', value: `\`${data_conta}\``, inline: false },
        { name: '🤖 É um bot?', value: `\`${is_bot}\``, inline: false }
      );

    const botao = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setURL(user.displayAvatarURL({ dynamic: true }))
        .setEmoji('📎')
        .setStyle(ButtonStyle.Link)
        .setLabel(`Avatar de ${user.username}`)
    );

    await interaction.reply({ embeds: [embed], components: [botao] });
  },
};
