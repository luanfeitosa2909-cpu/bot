const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} = require('discord.js');
const logger = require('../../Utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('anunciar')
    .setDescription('Anuncie algo em uma embed.')
    .addStringOption(option =>
      option.setName('título').setDescription('Escreva o título.').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('descrição').setDescription('Escreva a descrição.').setRequired(true)
    )
    .addChannelOption(option =>
      option
        .setName('chat')
        .setDescription('Selecione o canal de envio.')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('cor')
        .setDescription('Coloque uma cor em hexadecimal (ex: #00ff00).')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  async run(client, interaction, _clientMongo) {
    try {
      await interaction.deferReply({ ephemeral: true });
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.editReply({
          content: '❌ Apenas administradores podem usar este comando.',
        });
      }

      const titulo = interaction.options.getString('título');
      const desc = interaction.options.getString('descrição');
      const cor = interaction.options.getString('cor') || 'Random';
      const chat = interaction.options.getChannel('chat');

      if (chat.type !== ChannelType.GuildText) {
        return interaction.editReply({ content: '❌ Este canal não é de texto.' });
      }

      const embed = new EmbedBuilder().setTitle(titulo).setDescription(desc).setColor(cor);

      await chat.send({ embeds: [embed] });
      await interaction.editReply({ content: `✅ Anúncio enviado em ${chat}.` });
    } catch (e) {
      logger.logError('anunciar', e);
      try {
        if (!interaction.replied)
          await interaction.editReply({ content: '❌ Erro ao enviar o anúncio.' });
        else
          await interaction.followUp({ content: '❌ Erro ao enviar o anúncio.', ephemeral: true });
      } catch (err) {
        logger.logError('anunciar_notify_error', err);
      }
    }
  },
};
