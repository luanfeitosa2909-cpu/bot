const { EmbedBuilder } = require('discord.js');

module.exports = {
  type: 'button',
  customId: null,
  match: id => id === 'membro_fechar_ticket',

  run: async (client, interaction) => {
    const staffRoleId = process.env.STAFF_ROLE_ID;

    await interaction.reply({
      content: `<@&${staffRoleId}>`, // menção visível
      allowedMentions: { roles: [staffRoleId] }, // garante que a menção notifique
      embeds: [
        new EmbedBuilder()
          .setColor('Red')
          .setDescription(`🔒 O membro <@${interaction.user.id}> deseja fechar o ticket.`),
      ],
    });
  },
};
