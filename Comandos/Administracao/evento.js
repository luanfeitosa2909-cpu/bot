const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
} = require('discord.js');
require('dotenv').config();
const logger = require('../../Utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('evento')
    .setDescription('📣 Envia um anúncio de evento personalizado.')
    .addChannelOption(option =>
      option
        .setName('canal')
        .setDescription('Canal onde o anúncio será enviado.')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    )
    .addRoleOption(option =>
      option
        .setName('cargo_mencionado')
        .setDescription('Cargo a ser mencionado (ex: @Eventos).')
        .setRequired(true)
    )
    .addAttachmentOption(option =>
      option
        .setName('banner_anexo')
        .setDescription('Banner/imagem do evento (opcional).')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('banner_link')
        .setDescription('URL direta da imagem do banner (opcional).')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName('mencionar_everyone')
        .setDescription('Deseja mencionar @everyone junto com o cargo?')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  async run(client, interaction, _clientMongo) {
    const logger = require('../../Utils/logger');
    try {
      const staffRoleId = process.env.STAFF_ROLE_ID;
      if (staffRoleId && !interaction.member.roles.cache.has(staffRoleId)) {
        return interaction.reply({
          content: '❌ Você não tem permissão para usar este comando.',
          ephemeral: true,
        });
      }

      const canal = interaction.options.getChannel('canal');
      const cargo = interaction.options.getRole('cargo_mencionado');
      const bannerAnexo = interaction.options.getAttachment('banner_anexo');
      const bannerLink = interaction.options.getString('banner_link');
      const mencionarEveryone = interaction.options.getBoolean('mencionar_everyone');

      const modal = new ModalBuilder()
        .setCustomId(`evento_modal_${interaction.id}`)
        .setTitle('📣 Mensagem do Evento');

      const mensagemInput = new TextInputBuilder()
        .setCustomId('mensagem_evento')
        .setLabel('Mensagem a ser exibida no embed do evento')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1000);

      const row = new ActionRowBuilder().addComponents(mensagemInput);
      modal.addComponents(row);

      await interaction.showModal(modal);

      const submitted = await interaction
        .awaitModalSubmit({
          filter: i =>
            i.customId === `evento_modal_${interaction.id}` && i.user.id === interaction.user.id,
          time: 2 * 60 * 1000,
        })
        .catch(() => null);

      if (!submitted) {
        return interaction.followUp({
          content: '⏱️ Tempo esgotado. Nenhuma mensagem foi enviada.',
          ephemeral: true,
        });
      }

      const mensagem = submitted.fields.getTextInputValue('mensagem_evento');

      const embed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setDescription(mensagem)
        .setFooter({ text: `${interaction.guild.name} - EVENTO` })
        .setTimestamp();

      const imagemFinal = bannerAnexo?.url || bannerLink;
      if (imagemFinal) embed.setImage(imagemFinal);

      const conteudoMenção = mencionarEveryone ? `@everyone ${cargo}` : `${cargo}`;

      try {
        const msg = await canal.send({ content: conteudoMenção, embeds: [embed] });

        await msg.react('✅');
        await msg.react('❤️');
        await msg.pin().catch(() => {});

        await submitted.reply({
          content: `📢 Anúncio enviado com sucesso em ${canal}!`,
          ephemeral: true,
        });
      } catch (err) {
        logger.logError('evento_send', err);
        await submitted.reply({
          content: '❌ Ocorreu um erro ao tentar enviar o anúncio.',
          ephemeral: true,
        });
      }
    } catch (err) {
      logger.logError('evento', err);
      if (!interaction.replied)
        await interaction.reply({
          content: '❌ Erro interno ao executar o comando evento.',
          ephemeral: true,
        });
    }
  },
};
