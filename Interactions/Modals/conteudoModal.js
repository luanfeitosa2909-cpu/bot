require('dotenv').config();
const { EmbedBuilder } = require('discord.js');

module.exports = {
  customId: 'form_criador_conteudo',
  type: 'modal',

  run: async (client, interaction) => {
    const nomeDiscord = interaction.fields.getTextInputValue('nome_discord');
    const linkCanal = interaction.fields.getTextInputValue('link_canal');
    const plataforma = interaction.fields.getTextInputValue('plataforma');
    const tipoConteudo = interaction.fields.getTextInputValue('tipo_conteudo');
    const motivacao = interaction.fields.getTextInputValue('motivacao');

    // 🔎 Verifica se o link é válido
    let urlValida = true;
    try {
      new URL(linkCanal);
    } catch (err) {
      urlValida = false;
    }

    if (!urlValida) {
      return interaction.reply({
        content:
          '❌ O link do canal informado não é válido. Certifique-se de inserir um link completo (ex: https://youtube.com/@seucanal).',
        flags: 1 << 6,
      });
    }

    const canalId = process.env.LOG_CHANNEL_CRIADOR;
    const canal = await client.channels.fetch(canalId).catch(() => null);

    if (!canal) {
      return interaction.reply({
        content:
          '❌ Não foi possível encontrar o canal de inscrições. Verifique a variável `LOG_CHANNEL_CRIADOR` no `.env`.',
        flags: 1 << 6,
      });
    }

    // 🔔 Embed de log para staff
    const embed = new EmbedBuilder()
      .setTitle('📥 Nova Inscrição — Criador de Conteúdo')
      .setColor('#8E44AD')
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 512 }))
      .addFields(
        { name: '👤 Usuário', value: `${interaction.user} \n\`${nomeDiscord}\``, inline: true },
        { name: '🆔 ID do Usuário', value: `\`${interaction.user.id}\``, inline: true },
        { name: '📺 Link do Canal', value: `[Acessar Canal](${linkCanal})`, inline: true },
        { name: '💻 Plataforma', value: plataforma, inline: true },
        { name: '🎮 Tipo de Conteúdo', value: tipoConteudo, inline: true },
        { name: '\u200B', value: '\u200B', inline: true },
        { name: '🧠 Por que entrar no Genoma?', value: motivacao }
      )
      .setTimestamp()
      .setFooter({
        text: `${interaction.guild.name} • Nova inscrição recebida`,
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      });

    await canal.send({ embeds: [embed] });

    // ✅ Embed de resposta para o usuário
    const confirmEmbed = new EmbedBuilder()
      .setColor('#2ECC71')
      .setTitle('✅ Inscrição enviada com sucesso!')
      .setDescription(
        [
          `Agradecemos por se inscrever para ser um **Criador Oficial do ${interaction.guild.name}**!`,
          '',
          'Nossa equipe irá analisar sua inscrição e você será notificado em breve.',
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
