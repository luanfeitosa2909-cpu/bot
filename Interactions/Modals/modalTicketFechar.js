// Interactions/Modals/modal_ticket_fechar.js
const { EmbedBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
  type: 'modal',
  customId: 'modal_ticket_fechar',
  async run(client, interaction, _clientMongo) {
    if (!interaction.isModalSubmit() || interaction.customId !== this.customId) return;

    const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;
    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({ content: '❌ Apenas staff.', flags: 1 << 6 });
    }

    const canal = interaction.channel;
    const comentario =
      interaction.fields.getTextInputValue('ticket_comentario') || 'Sem comentário.';

    const { gerarTranscript } = require('../../Comandos/Administracao/transcript');

    // Embed "aguarde"
    const embedLoading = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle('⏳ Aguarde, estamos concluindo sua solicitação.')
      .setDescription('📌 **Status:** Salvando suas mensagens e gerando o link para acesso.\n\n')
      .addFields({ name: '🕐 Horário', value: `<t:${Math.floor(Date.now() / 1000)}:f>` })
      .setFooter({ text: `${canal.guild.name}™ © Todos os direitos reservados` });

    await interaction.reply({ embeds: [embedLoading] });

    // Gera transcript
    await gerarTranscript(client, canal, interaction.user, comentario);

    // Embed "sucesso"
    const embedDone = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle('📝 Transcript Gerado com Sucesso!')
      .setDescription(
        [
          `📌 O histórico completo deste ticket foi processado e já está disponível na sua **DM**.`,
          ``,
          `✅ Agora você pode acessar todas as mensagens trocadas de forma organizada.`,
          `🔒 Apenas você tem acesso ao link do transcript enviado na mensagem privada.`,
          ``,
          `> Caso não tenha recebido a mensagem, verifique se suas DMs estão abertas.`,
        ].join('\n')
      )
      .setThumbnail(canal.guild.iconURL({ dynamic: true }))
      .setFooter({ text: `📁 Sistema de Transcript • ${canal.guild.name}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embedDone] });

    // Mensagem no canal antes de fechar
    await canal.send({
      embeds: [
        new EmbedBuilder()
          .setColor('#E74C3C') // vermelho profissional
          .setTitle('Ticket sendo fechado')
          .setDescription(
            'Este ticket será encerrado automaticamente em **10 segundos**.\n\nPor favor, certifique-se de que todas as informações importantes foram registradas antes do fechamento.'
          )
          .addFields(
            { name: 'Fechado por', value: `<@${interaction.user.id}>`, inline: true },
            { name: 'Canal', value: `<#${canal.id}>`, inline: true }
          )
          .setFooter({ text: `${canal.guild.name}™ • Sistema de Tickets` })
          .setTimestamp(),
      ],
    });

    // Fecha o canal após 10 segundos
    setTimeout(() => canal.delete().catch(() => {}), 10000);
  },
};
