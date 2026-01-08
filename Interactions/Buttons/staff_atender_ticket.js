const { EmbedBuilder } = require('discord.js');

module.exports = {
  type: 'button',
  customId: null,
  match: id => id === 'staff_atender_ticket',

  run: async (client, interaction) => {
    const staffUser = interaction.user; // usuário que está atendendo
    const guild = interaction.guild; // servidor atual
    const channel = interaction.channel;

    // 🔹 Busca a primeira mensagem do ticket (que contém a embed original)
    const fetchedMessages = await channel.messages.fetch({ limit: 10 });
    const ticketMessage = fetchedMessages.find(
      m => m.embeds.length > 0 && m.embeds[0].title?.startsWith('📩 Atendimento')
    );

    if (ticketMessage) {
      const oldEmbed = ticketMessage.embeds[0];
      const newEmbed = EmbedBuilder.from(oldEmbed);

      // Substitui o "Responsável pelo atendimento: --" pelo staff
      const updatedDescription = oldEmbed.description.replace(
        /(\*\*Responsável pelo atendimento:\*\*\n)(--|<@!?\d+>)/,
        `$1<@${staffUser.id}>`
      );

      newEmbed.setDescription(updatedDescription);

      await ticketMessage.edit({
        embeds: [newEmbed],
        components: ticketMessage.components,
      });
    }

    // 🔹 Mensagem informando no chat do ticket
    const embedAtendimento = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('🔔 RESPONSÁVEL PELO ATENDIMENTO')
      .setDescription(
        `Esse atendimento está sendo tratado pelo nosso colaborador <@${staffUser.id}>.\n\n` +
          `Nossa equipe está empenhada em prestar o melhor suporte possível para você.\n` +
          `Para dar continuidade ao atendimento, por favor, responda a este ticket com uma mensagem.\n\n` +
          'É importante destacar que, caso não haja resposta em até 24 horas ``(1 dia)``, o ticket será automaticamente excluído.\n' +
          `Portanto, fique atento(a) para que possamos ajudá-lo(a) de maneira eficiente.\n` +
          `Estamos à disposição para qualquer dúvida ou necessidade que você possa ter.`
      )
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .setFooter({ text: guild.name, iconURL: guild.iconURL({ dynamic: true }) })
      .setTimestamp();

    await interaction.reply({ embeds: [embedAtendimento] });
  },
};
