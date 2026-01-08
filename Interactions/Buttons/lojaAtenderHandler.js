const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  type: 'button',
  customId: null,
  match: id => id.startsWith('atender_'),

  run: async (client, interaction) => {
    const id = interaction.customId;
    const [, userId, produtoId] = id.split('_');

    const isStaff =
      interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
      interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!isStaff) {
      return interaction.reply({
        content: '❌ Apenas para membros da staff.',
        flags: 1 << 6, // Ephemeral
      });
    }

    const staffMention = `<@${interaction.user.id}>`;
    const dataAtendimento = new Date();
    const dataFormatada = dataAtendimento.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Atualiza embed substituindo o campo "📊 Status"
    const oldEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
    const newFields = oldEmbed.data.fields.map(field =>
      field.name === '📊 Status'
        ? { name: '📊 Status', value: `✅ Atendido por ${staffMention} em ${dataFormatada}` }
        : field
    );

    const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0]).setFields(newFields);

    await interaction.update({
      embeds: [updatedEmbed],
      components: [],
    });

    // DM opcional ao comprador
    try {
      const user = await client.users.fetch(userId);
      await user.send({
        embeds: [
          new EmbedBuilder()
            .setColor('Green')
            .setTitle('✅ Sua compra foi atendida!')
            .setDescription(
              `Sua compra foi marcada como atendida por ${staffMention}.\n\nSe tiver dúvidas, abra um ticket!`
            )
            .setFooter({ text: `${interaction.guild.name} • Loja` })
            .setTimestamp(),
        ],
      });
    } catch (err) {
      // Silencia erro se não puder enviar DM
    }
  },
};
