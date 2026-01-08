const { EmbedBuilder } = require('discord.js');

module.exports = {
  type: 'button',
  customId: null,
  match: id => id === 'membro_chamar_staff',

  run: async (client, interaction) => {
    const staffRoleId = process.env.STAFF_ROLE_ID;

    await interaction.reply({
      content: `<@&${staffRoleId}>`,
      allowedMentions: { roles: [staffRoleId] }, // força menção funcionar
      embeds: [
        new EmbedBuilder()
          .setColor('Yellow')
          .setDescription(`📣 O membro <@${interaction.user.id}> está solicitando atendimento.`),
      ],
    });
  },
};
