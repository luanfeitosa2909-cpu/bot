const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  type: 'button',
  customId: null,
  match: id => id === 'staff_notificar_usuario',

  run: async (client, interaction) => {
    const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;

    // Verifica permissão de staff
    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({
        content: '❌ Apenas staff pode notificar usuários.',
        flags: 1 << 6,
      });
    }

    // Pega o usuário que abriu o ticket pelo channel.topic
    const ticketOwnerId = interaction.channel.topic;
    if (!ticketOwnerId) {
      return interaction.reply({
        content: '❌ Não foi possível identificar o dono do ticket.',
        flags: 1 << 6,
      });
    }

    let ticketOwner;
    try {
      ticketOwner = await client.users.fetch(ticketOwnerId);
    } catch (err) {
      console.error('Erro ao buscar usuário do ticket:', err);
      return interaction.reply({
        content: '❌ Não foi possível buscar o usuário do ticket.',
        flags: 1 << 6,
      });
    }

    // Embed de notificação para o PV
    const notifyEmbed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('🔔 AVISO DE NOTIFICAÇÃO')
      .setDescription(
        `Olá! Um staff respondeu ao seu ticket no servidor **${interaction.guild.name}**.\n\n` +
          `Para continuar com o ticket, por favor, responda a este ticket.\n` +
          'Caso contrário, ele será **deletado em 24 horas** ``(1 Dia)``.'
      )
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setTimestamp();

    // Botão de link para responder no ticket
    const linkButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Responder Ticket')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}`)
    );

    // Envia mensagem no PV do usuário
    try {
      await ticketOwner.send({ embeds: [notifyEmbed], components: [linkButton] });
    } catch (err) {
      console.log('Não foi possível enviar mensagem no PV:', err);
      return interaction.reply({
        content: '❌ Não foi possível enviar a mensagem no PV do usuário.',
        flags: 1 << 6,
      });
    }

    // Mensagem no canal do ticket
    await interaction.reply({ embeds: [notifyEmbed], components: [linkButton] });
  },
};
