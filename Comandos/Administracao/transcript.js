const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const transcript = require('discord-html-transcripts');
require('dotenv').config();

/**
 * Gera e envia um transcript HTML com todas as mensagens do canal.
 */
async function gerarTranscript(client, canal, solicitadoPor) {
  const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_TRANSCRIPT;
  const FILES_CHANNEL_ID = process.env.ATTACHMENTS;

  let limit = 1000;
  let buffer;

  const safeName = canal.name.replace(/[^\w-]/gi, '-').toLowerCase();
  const filename = `transcript-${safeName}-${Date.now()}.html`;

  // Tenta gerar o transcript respeitando o limite de tamanho (7.7MB)
  while (limit > 0) {
    const temp = await transcript.createTranscript(canal, {
      limit,
      returnType: 'buffer',
      filename,
      saveImages: false,
      poweredBy: false,
    });

    if (temp.length <= 7.7 * 1024 * 1024) {
      buffer = temp;
      break;
    }

    limit = Math.floor(limit * 0.8);
  }

  if (!buffer)
    throw new Error('❌ Não foi possível gerar o transcript dentro do limite de tamanho (7.7MB).');

  // Envia no canal oculto de arquivos
  const canalArquivos = client.channels.cache.get(FILES_CHANNEL_ID);
  if (!canalArquivos || !canalArquivos.isTextBased()) {
    throw new Error('❌ Canal de armazenamento de transcripts não encontrado.');
  }

  const fileMessage = await canalArquivos.send({
    files: [{ attachment: buffer, name: filename }],
  });
  const fileUrl = fileMessage.attachments.first()?.url;

  // Busca mensagens do canal para estatísticas
  const fetchMessages = async limit => {
    let messages = [];
    let lastId;

    while (messages.length < limit) {
      const options = { limit: Math.min(100, limit - messages.length) };
      if (lastId) options.before = lastId;

      const fetched = await canal.messages.fetch(options);
      if (!fetched.size) break;

      messages.push(...fetched.values());
      lastId = fetched.last().id;
    }

    return messages;
  };

  const messages = await fetchMessages(limit);
  const timestamps = messages.map(m => m.createdTimestamp).sort();
  const firstMessageTime = timestamps[0] ? `<t:${Math.floor(timestamps[0] / 1000)}:f>` : 'N/A';
  const lastMessageTime = timestamps.at(-1)
    ? `<t:${Math.floor(timestamps.at(-1) / 1000)}:f>`
    : 'N/A';

  // Envia DM para o solicitante
  const rowDM = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('📂 Abrir histórico da conversa')
      .setStyle(ButtonStyle.Link)
      .setURL(fileUrl)
  );

  const embedDM = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle(`✅ Ticket Finalizado | ${canal.guild.name}™`)
    .setDescription(
      'Clique abaixo para acessar o histórico completo da conversa.\n' +
        'Somente você tem acesso a este link.'
    )
    .setThumbnail(canal.guild.iconURL({ dynamic: true }))
    .addFields(
      { name: '🆔 Ticket', value: `\`${canal.id}\`` },
      { name: '👤 Solicitante', value: `${solicitadoPor}`, inline: true },
      { name: '🔒 Finalizado por', value: `${solicitadoPor}`, inline: true }
    )
    .setFooter({ text: `${canal.guild.name}™ © Todos os direitos reservados` })
    .setTimestamp();

  try {
    await solicitadoPor.send({ embeds: [embedDM], components: [rowDM] });
  } catch {
    await canal.send('⚠️ Não consegui enviar o transcript na DM do usuário.');
  }

  // Envia embed no canal de logs
  const rowLogs = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('📂 Abrir histórico da conversa')
      .setStyle(ButtonStyle.Link)
      .setURL(fileUrl)
  );

  const embedLogs = new EmbedBuilder()
    .setColor(0xe67e22)
    .setTitle(`📑 Transcript Registrado | ${canal.guild.name}™`)
    .setThumbnail(canal.guild.iconURL({ dynamic: true }))
    .addFields(
      { name: '🆔 Ticket', value: `\`${canal.id}\`` },
      { name: '👤 Solicitante', value: `${solicitadoPor}`, inline: true },
      { name: '🔒 Finalizado por', value: `${solicitadoPor}`, inline: true },
      { name: '💬 Mensagens', value: `\`${messages.length}\`` },
      { name: '🕑 Período', value: `${firstMessageTime} até ${lastMessageTime}` }
    )
    .setFooter({ text: `📁 Sistema de Transcript • ${canal.guild.name}` })
    .setTimestamp();

  const canalLogs = client.channels.cache.get(LOG_CHANNEL_ID);
  if (canalLogs && canalLogs.isTextBased()) {
    await canalLogs.send({ embeds: [embedLogs], components: [rowLogs] });
  }
}

/**
 * Comando Slash /transcript
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('transcript')
    .setDescription('📄 Gera um registro HTML com todas as mensagens do canal atual.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  /**
   * Executa o comando /transcript
   */
  async run(client, interaction, _clientMongo) {
    const logger = require('../../Utils/logger');
    const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;
    const canal = interaction.channel;

    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({
        content: '❌ Você não tem permissão para usar este comando.',
        ephemeral: true,
      });
    }

    try {
      await interaction.deferReply({ ephemeral: true });

      const embedLoading = new EmbedBuilder()
        .setColor(0xf1c40f)
        .setTitle('⏳ Gerando Transcript...')
        .setDescription('Salvando mensagens e criando link de acesso.')
        .addFields({ name: '🕐 Iniciado em', value: `<t:${Math.floor(Date.now() / 1000)}:f>` })
        .setFooter({ text: `${canal.guild.name}™ © Todos os direitos reservados` });

      await interaction.editReply({ embeds: [embedLoading] });

      await gerarTranscript(client, canal, interaction.user);

      const embedDone = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle('📝 Transcript Gerado com Sucesso!')
        .setDescription(
          '📌 O histórico completo foi processado e já está disponível na sua **DM**.\n\n' +
            '✅ Apenas você tem acesso ao link enviado de forma privada.\n\n' +
            'Se não recebeu a mensagem, verifique se suas DMs estão abertas.'
        )
        .setThumbnail(canal.guild.iconURL({ dynamic: true }))
        .setFooter({ text: `📁 Sistema de Transcript • ${canal.guild.name}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embedDone] });
    } catch (error) {
      const logger = require('../../Utils/logger');
      logger.logError('transcript', error);
      try {
        if (interaction.deferred)
          await interaction.editReply({
            content: '❌ Ocorreu um erro ao gerar ou enviar o transcript.',
          });
        else if (!interaction.replied)
          await interaction.reply({
            content: '❌ Ocorreu um erro ao gerar ou enviar o transcript.',
            ephemeral: true,
          });
      } catch (e) {
        logger.logError('transcript_notify_error', e);
      }
    }
  },

  gerarTranscript,
};
