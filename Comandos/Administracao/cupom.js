const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const EMOJIS = {
  coupon: '🎟️',
  discount: '💰',
  expiry: '⏳',
  warning: '⚠️',
  gift: '🎁',
  party: '🎉',
};

function parseExpiry(input) {
  if (!input) return null;
  input = input.trim().toLowerCase();
  const match = input.match(/^(\d+)\s*(m|h|d)$/i);
  if (!match) return null;

  const num = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  if (num <= 0) return null;

  const multipliers = { m: 60000, h: 3600000, d: 86400000 };
  return new Date(Date.now() + num * multipliers[unit]);
}

function formatTimestamp(date) {
  return `<t:${Math.floor(date.getTime() / 1000)}:F>`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cupom')
    .setDescription('Cria ou reutiliza um cupom de desconto')
    .addStringOption(option =>
      option.setName('codigo').setDescription('Código do cupom (ex: MEUCUPOM)').setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('desconto')
        .setDescription('Desconto em porcentagem (ex: 20 ou 20%)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('expiracao')
        .setDescription('Tempo de validade (ex: 30m, 2h, 1d)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  async run(client, interaction, clientMongo) {
    const logger = require('../../Utils/logger');
    await interaction.deferReply({ ephemeral: true });
    const codigoRaw = interaction.options.getString('codigo');
    const descontoInput = interaction.options.getString('desconto');
    const expiracaoInput = interaction.options.getString('expiracao');

    const codigo = codigoRaw ? codigoRaw.toUpperCase().replace(/\s/g, '') : null;

    try {
      const db = clientMongo.db('ProjetoGenoma');
      const collection = db.collection('cupom');

      // Verifica se já existe cupom válido
      const cupomExistente = await collection.findOne({ tipo: 'cupom', codigo });

      if (cupomExistente && Date.now() < cupomExistente.expiracao) {
        const embedExistente = new EmbedBuilder()
          .setColor('#28a745')
          .setTitle(`${EMOJIS.gift} Cupom Já Existe`)
          .setDescription(`Este cupom está ativo e disponível para uso.`)
          .addFields(
            {
              name: `${EMOJIS.coupon} Código do Cupom`,
              value: `\`\`\`${cupomExistente.codigo}\`\`\``,
            },
            {
              name: `${EMOJIS.discount} Desconto`,
              value: `${cupomExistente.desconto}% OFF`,
              inline: true,
            },
            {
              name: `${EMOJIS.expiry} Expira em`,
              value: formatTimestamp(new Date(cupomExistente.expiracao)),
              inline: true,
            }
          )
          .setFooter({
            text: `Gerado anteriormente por ${
              cupomExistente.criadoPorTag || 'Usuário desconhecido'
            }`,
          })
          .setTimestamp();

        return interaction.editReply({
          content: `${EMOJIS.party} Um cupom válido já existe para este código:`,
          embeds: [embedExistente],
        });
      }

      // Verifica se inputs obrigatórios foram passados para criação
      if (!descontoInput || !expiracaoInput) {
        return interaction.editReply({
          content: `${EMOJIS.warning} Para criar um novo cupom, informe os parâmetros \`desconto\` e \`expiracao\`.`,
        });
      }

      // Normaliza e valida desconto
      const descontoNum = parseInt(descontoInput.replace(/[^\d]/g, ''), 10);
      if (isNaN(descontoNum) || descontoNum < 1 || descontoNum > 100) {
        return interaction.editReply({
          content: `${EMOJIS.warning} Informe um desconto válido entre 1% e 100%.`,
        });
      }

      // Parse da data de expiração
      const expiracaoDate = parseExpiry(expiracaoInput);
      if (!expiracaoDate) {
        return interaction.editReply({
          content: `${EMOJIS.warning} Expiração inválida. Use o formato: \`30m\`, \`2h\`, \`1d\`.`,
        });
      }

      // Busca username do criador para footer, se possível
      const usuario = await client.users.fetch(interaction.user.id);
      const criadoPorTag = usuario ? usuario.tag : interaction.user.id;

      // Salva no banco
      await collection.updateOne(
        { tipo: 'cupom', codigo },
        {
          $set: {
            tipo: 'cupom',
            codigo,
            desconto: descontoNum,
            criadoPor: interaction.user.id,
            criadoPorTag,
            usadoPor: [],
            criadoEm: Date.now(),
            expiracao: expiracaoDate.getTime(),
          },
        },
        { upsert: true }
      );

      // Embed de sucesso
      const embedSucesso = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`${EMOJIS.party} Cupom de Desconto Gerado!`)
        .setDescription(
          'Apresente este cupom no momento da sua compra para validar o desconto!\n\n' +
            `**Atenção:** Este cupom é de uso único e válido apenas até a data de expiração.`
        )
        .addFields(
          { name: `${EMOJIS.coupon} Código do Cupom`, value: `\`\`\`${codigo}\`\`\`` },
          { name: `${EMOJIS.discount} Desconto`, value: `${descontoNum}% OFF`, inline: true },
          {
            name: `${EMOJIS.expiry} Expira em`,
            value: formatTimestamp(expiracaoDate),
            inline: true,
          }
        )
        .setFooter({ text: `Gerado por ${criadoPorTag} • ${new Date().toLocaleString('pt-BR')}` })
        .setTimestamp();

      return interaction.editReply({ embeds: [embedSucesso] });
    } catch (err) {
      logger.logError('cupom', err);
      try {
        if (!interaction.replied)
          await interaction.editReply({
            content: `${EMOJIS.warning} Ocorreu um erro ao processar o cupom.`,
          });
        else
          await interaction.followUp({
            content: `${EMOJIS.warning} Ocorreu um erro ao processar o cupom.`,
            ephemeral: true,
          });
      } catch (e) {
        logger.logError('cupom_notify_error', e);
      }
    }
  },
};
