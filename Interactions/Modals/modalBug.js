const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
require('dotenv').config();

module.exports = {
  type: 'modal',
  match: id => id === 'modal_report_bug',

  run: async (client, interaction) => {
    const situacao = interaction.fields.getTextInputValue('situacao_bug');
    const erro = interaction.fields.getTextInputValue('erro_bug');
    const detalhe = interaction.fields.getTextInputValue('detalhe_bug');
    const imagem = interaction.fields.getTextInputValue('imagem_bug');

    await interaction.reply({ content: '✅ Seu report foi enviado com sucesso!', flags: 1 << 6 });

    const canalLogId = process.env.LOG_CHANNEL_BUG;
    const canalLog = interaction.guild.channels.cache.get(canalLogId);
    if (!canalLog) return console.log('Canal de logs de bug não encontrado.');

    const serverIcon = interaction.guild.iconURL({ dynamic: true });

    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('🐞 NOVO BUG REPORTADO!')
      .setThumbnail(serverIcon) // thumbnail com foto do servidor
      .setDescription(
        [
          `**\`👤\` Reportado por:** <@${interaction.user.id}>`,
          `**\`📋\` Situação:** ${situacao}`,
          `**\`🐞\` Erro:** ${erro}`,
          `**\`📝\` Descrição:** ${detalhe}`,
        ].join('\n')
      )
      .setFooter({
        text: `${interaction.guild.name} • Todos os direitos reservados`,
        iconURL: serverIcon, // foto do servidor no footer
      })
      .setTimestamp();

    if (imagem) embed.setImage(imagem);

    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('responder_report')
        .setLabel('Responder Report')
        .setEmoji('✅')
        .setStyle(ButtonStyle.Primary)
    );

    await canalLog.send({ embeds: [embed], components: [button] });
  },
};
