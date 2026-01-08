require('dotenv').config();
const { EmbedBuilder } = require('discord.js');

module.exports = {
  customId: 'form_staff',
  type: 'modal',

  run: async (client, interaction) => {
    const nomeDiscord = interaction.fields.getTextInputValue('nome_discord');
    const idade = interaction.fields.getTextInputValue('idade');
    const disponibilidade = interaction.fields.getTextInputValue('disponibilidade');
    const experiencia = interaction.fields.getTextInputValue('experiencia');
    const motivacao = interaction.fields.getTextInputValue('motivacao');

    const canalId = process.env.LOG_CHANNEL_FORMULARIO;
    const canal = await client.channels.fetch(canalId).catch(() => null);

    if (!canal) {
      return interaction.reply({
        content:
          '❌ Não foi possível encontrar o canal de inscrições. Verifique `LOG_CHANNEL_STAFF` no `.env`.',
        flags: 1 << 6,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('🛡️ Nova Inscrição para Staff')
      .setColor('#1ABC9C')
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 512 }))
      .addFields(
        { name: '👤 Usuário', value: `${interaction.user} \n\`${nomeDiscord}\``, inline: true },
        { name: '🆔 ID do Usuário', value: `\`${interaction.user.id}\``, inline: true },
        { name: '📅 Idade', value: idade, inline: true },
        { name: '🕒 Disponibilidade', value: disponibilidade, inline: true },
        { name: '📌 Experiência prévia', value: experiencia, inline: false },
        { name: '🧠 Motivação', value: motivacao, inline: false }
      )
      .setTimestamp()
      .setFooter({
        text: `${interaction.guild.name} • Nova inscrição para staff`,
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      });

    await canal.send({ embeds: [embed] });

    const confirmEmbed = new EmbedBuilder()
      .setColor('#2ECC71')
      .setTitle('✅ Inscrição enviada com sucesso!')
      .setDescription(
        [
          `Agradecemos seu interesse em fazer parte da equipe do **${interaction.guild.name}**!`,
          '',
          'Sua inscrição será avaliada com cuidado, e entraremos em contato em breve.',
        ].join('\n')
      )
      .setFooter({ text: `${interaction.guild.name} • Equipe de Avaliação` })
      .setTimestamp();

    await interaction.reply({
      embeds: [confirmEmbed],
      flags: 1 << 6,
    });
  },
};
