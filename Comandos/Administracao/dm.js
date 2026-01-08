const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dm')
    .setDescription('Envie uma mensagem no privado de um usuário.')
    .addUserOption(option =>
      option.setName('usuário').setDescription('Usuário para receber a mensagem.').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('mensagem').setDescription('Mensagem que será enviada.').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  async run(client, interaction, _clientMongo) {
    const logger = require('../../Utils/logger');
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({
          content: '❌ Você não possui permissão para utilizar este comando!',
          ephemeral: true,
        });
      }

      await interaction.deferReply({ ephemeral: true });

      const user = interaction.options.getUser('usuário');
      const msg = interaction.options.getString('mensagem');

      const embed = new EmbedBuilder()
        .setColor('Random')
        .setAuthor({
          name: interaction.user.tag,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setDescription(msg);

      try {
        await user.send({ embeds: [embed] });
        await interaction.editReply({ content: `✅ Mensagem enviada para ${user.tag}.` });
      } catch (err) {
        logger.logWarn(`Falha ao enviar DM para ${user.id}: ${err.message || err}`);
        await interaction.editReply({
          content: `❌ Não foi possível enviar mensagem para ${user.tag}.`,
        });
      }
    } catch (err) {
      logger.logError('dm', err);
      try {
        if (!interaction.replied)
          await interaction.reply({ content: '❌ Erro interno ao processar DM.', ephemeral: true });
        else
          await interaction.followUp({
            content: '❌ Erro interno ao processar DM.',
            ephemeral: true,
          });
      } catch (e) {
        logger.logError('dm_notify_error', e);
      }
    }
  },
};
