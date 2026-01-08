const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  type: 'modal',
  match: id => id === 'modal_resposta_bug',

  run: async (client, interaction) => {
    const resposta = interaction.fields.getTextInputValue('resposta_bug');

    const embedOriginal = interaction.message.embeds[0];
    if (!embedOriginal)
      return interaction.reply({
        content: '❌ Não foi possível identificar o usuário.',
        flags: 1 << 6,
      });

    const regex = /<@(\d+)>/;
    const match = embedOriginal.description.match(regex);
    if (!match)
      return interaction.reply({
        content: '❌ Não foi possível identificar o usuário.',
        flags: 1 << 6,
      });

    const userId = match[1];
    const user = await client.users.fetch(userId);

    const respostaEmbed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('🐞 REPORT RESPONDIDO!')
      .setDescription(
        [
          `Olá <@${user.id}>, o **BUG** que você reportou foi resolvido.`,
          `O BUG reportado foi no servidor **${interaction.guild.name}**.`,
          '',
          'Mensagem enviada por um administrador:',
          `\`\`\`${resposta}\`\`\``,
        ].join('\n')
      )
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setFooter({
        text: `${interaction.guild.name} © Todos os direitos reservados`,
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setTimestamp();

    try {
      await user.send({ embeds: [respostaEmbed] });
      await interaction.reply({ content: '✅ Resposta enviada com sucesso!', flags: 1 << 6 });
    } catch (err) {
      await interaction.reply({
        content: '❌ Não foi possível enviar a mensagem ao usuário.',
        flags: 1 << 6,
      });
      console.log(err);
    }

    // Altera botão da mensagem do canal de logs
    const newButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('responder_report')
        .setLabel('Report Respondido')
        .setEmoji('✅')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );
    await interaction.message.edit({ components: [newButton] });
  },
};
