const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { getUserData } = require('../../database/userData');
require('dotenv').config();

const categorias = {
  ticket_suporte: {
    nome: 'suporte',
    categoria: process.env.CATEGORIA_SUPORTE,
    titulo: 'Suporte Técnico',
  },
  ticket_compras: {
    nome: 'compras',
    categoria: process.env.CATEGORIA_COMPRAS,
    titulo: 'Compras e Pagamentos',
  },
  ticket_denuncia: {
    nome: 'denuncia',
    categoria: process.env.CATEGORIA_DENUNCIA,
    titulo: 'Denúncias',
  },
};

module.exports = {
  type: 'modal',
  match: customId => customId.startsWith('ticket_modal:'),

  async run(client, interaction) {
    if (!interaction.isModalSubmit()) return;

    const [, categoriaKey] = interaction.customId.split(':');
    const config = categorias[categoriaKey];
    if (!config) {
      return interaction.reply({ content: '❌ Categoria inválida.', flags: 1 << 6 });
    }

    await interaction.deferReply({ flags: 1 << 6 });

    const assunto = interaction.fields.getTextInputValue('ticket_assunto').trim();
    const userId = interaction.user.id;

    // 🔹 valida se já existe ticket na mesma categoria
    const ticketExistente = interaction.guild.channels.cache.find(
      c => c.type === ChannelType.GuildText && c.topic === `${userId}:${categoriaKey}`
    );
    if (ticketExistente) {
      return interaction.editReply({
        content: `❌ Você já possui um ticket aberto em **${config.titulo}**: <#${ticketExistente.id}>`,
      });
    }

    const userData = (await getUserData(userId)) || {};
    const steamId = userData.steamid || 'Desconhecido';
    const steamName = userData.steamname || 'Não vinculado';
    const coins = userData.coins || 0;

    // 🔹 cria canal
    const canal = await interaction.guild.channels.create({
      name: `${config.nome}-${interaction.user.username}`,
      type: ChannelType.GuildText,
      parent: config.categoria,
      topic: `${userId}:${categoriaKey}`, // salva chave única user + categoria
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: userId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        {
          id: process.env.STAFF_ROLE_ID,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.UseApplicationCommands,
          ],
        },
      ],
    });

    // 🔹 embed personalizada
    const embed = new EmbedBuilder()
      .setColor('#6a0dad')
      .setTitle(`📩 Atendimento | Chamado de ${config.titulo}`)
      .setDescription(
        [
          `> Olá, <@${userId}>! Seja muito bem-vindo ao nosso atendimento personalizado.`,
          ``,
          `> Estamos felizes em tê-lo aqui e faremos o possível para fornecer a ajuda que você precisa. Em breve, um dos nossos staff estará disponível para atendê-lo.`,
          ``,
          `**Responsável pelo atendimento:**`,
          `--`, // será substituído pelo staff atender
          `ㅤ`,
          `**Assunto do atendimento:**`,
          `> ${assunto}`,
          ``,
          `**Informações adicionais do jogador:**`,
          `🎮 Steam Name: \`${steamName}\``,
          `🆔 Steam ID: \`${steamId}\``,
          `💰 Coins: \`${coins.toLocaleString()} coins\``,
          ``,
          `> Agradecemos desde já pelo seu contato. Caso queira realizar alguma alteração no atendimento, fique à vontade para interagir conosco abaixo:`,
          ``,
          `${interaction.guild.name}™ © Todos os direitos reservados`,
        ].join('\n')
      )
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `Sistema de Tickets • ${interaction.guild.name}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('painel_membro')
        .setLabel('📑 Painel do Membro')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('painel_staff')
        .setLabel('🛠️ Painel da Staff')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('ticket_fechar')
        .setLabel('🔒 Fechar Ticket')
        .setStyle(ButtonStyle.Danger)
    );

    await canal.send({
      content: `<@${userId}> | 🎟️ Seu ticket foi aberto com sucesso!`,
      embeds: [embed],
      components: [row],
    });

    await interaction.editReply({ content: `✅ Ticket criado: <#${canal.id}>` });
  },
};
