const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const TIERS = require('../../Utils/patrocinioConfig');
const { isNewWeek } = require('../../Utils/patrocinioUtils');

/* ─────────────────────────────
 * UTILITÁRIOS DE DATA / TEMPO
 * ───────────────────────────── */
const ts = d => Math.floor(new Date(d).getTime() / 1000);
const formatDate = d => `<t:${ts(d)}:F>`;
const formatRelative = d => `<t:${ts(d)}:R>`;
const formatShort = d => `<t:${ts(d)}:d>`;

/* ─────────────────────────────
 * LIMITES SEMANAIS POR TIER
 * ───────────────────────────── */
const WEEKLY_LIMITS = {
  1: 4,
  2: 3,
  3: 2,
  4: 2,
  5: 1,
  6: 1,
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('patrocinio')
    .setDescription('💎 Sistema completo de patrocínio do servidor')

    /* ───── ENTREGAR ───── */
    .addSubcommand(sub =>
      sub
        .setName('entregar')
        .setDescription('🎁 Entregar ou renovar um patrocínio para um usuário')
        .addUserOption(o =>
          o
            .setName('usuario')
            .setDescription('Usuário que irá receber o patrocínio')
            .setRequired(true)
        )
        .addIntegerOption(o =>
          o
            .setName('tier')
            .setDescription('Tier de patrocínio adquirido')
            .setRequired(true)
            .addChoices(
              { name: 'Tier 1', value: 1 },
              { name: 'Tier 2', value: 2 },
              { name: 'Tier 3', value: 3 },
              { name: 'Tier 4', value: 4 },
              { name: 'Tier 5', value: 5 },
              { name: 'Tier 6', value: 6 }
            )
        )
    )

    /* ───── RESGATAR ───── */
    .addSubcommand(sub =>
      sub
        .setName('resgatar')
        .setDescription('🦖 Resgatar um benefício disponível no seu patrocínio')
        .addIntegerOption(o =>
          o
            .setName('tier')
            .setDescription('Tier do benefício')
            .setRequired(true)
            .addChoices(
              { name: 'Tier 1', value: 1 },
              { name: 'Tier 2', value: 2 },
              { name: 'Tier 3', value: 3 },
              { name: 'Tier 4', value: 4 },
              { name: 'Tier 5', value: 5 },
              { name: 'Tier 6', value: 6 }
            )
        )
        .addStringOption(o =>
          o
            .setName('dino')
            .setDescription('Dinossauro a ser resgatado')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )

    /* ───── STATUS ───── */
    .addSubcommand(sub =>
      sub.setName('status').setDescription('📊 Visualizar o status completo do seu patrocínio')
    )

    /* ───── RELATÓRIO ───── */
    .addSubcommand(sub =>
      sub.setName('relatorio').setDescription('📑 Relatório administrativo de patrocínios')
    ),

  /* ─────────────────────────────
   * AUTOCOMPLETE DINOS
   * ───────────────────────────── */
  async autocomplete(interaction) {
    const tier = interaction.options.getInteger('tier');
    if (!tier || !TIERS[tier]) return interaction.respond([]);

    const dinos = TIERS[tier].dinos || [];
    const focused = interaction.options.getFocused().toLowerCase();

    const filtered = dinos
      .filter(d => d.toLowerCase().includes(focused))
      .slice(0, 25)
      .map(d => ({ name: d, value: d }));

    return interaction.respond(filtered);
  },

  /* ─────────────────────────────
   * EXECUÇÃO PRINCIPAL
   * ───────────────────────────── */
  async run(client, interaction, clientMongo) {
    const logger = require('../../Utils/logger');
    try {
      await interaction.deferReply({ ephemeral: true });

      const db = clientMongo && clientMongo.db ? clientMongo.db('ProjetoGenoma') : null;
      const col = db ? db.collection('Patrocinio') : null;

      const sub = interaction.options.getSubcommand();
      const guildName = interaction.guild?.name || 'Servidor';

      /* ─────────────────────────────
       * PERMISSÕES
       * ───────────────────────────── */
      const member = interaction.member;
      const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
      const roleBase = interaction.guild.roles.cache.get(process.env.PATROCINIO_ROLE_ID);

      const hasPermission =
        isAdmin || (roleBase && member.roles.cache.some(r => r.position >= roleBase.position));

      /* ─────────────────────────────
       * 🎁 ENTREGAR PATROCÍNIO
       * ───────────────────────────── */
      if (sub === 'entregar') {
        if (!hasPermission) {
          return interaction.editReply({
            content: '❌ Você não possui permissão para entregar patrocínios.',
          });
        }

        const user = interaction.options.getUser('usuario');
        const tier = interaction.options.getInteger('tier');
        const config = TIERS[tier];

        if (!config) {
          return interaction.editReply({
            content: '❌ O tier selecionado é inválido ou inexistente.',
          });
        }

        const now = new Date();
        const existing = await col.findOne({ userId: user.id });

        const expireAt =
          existing?.expireAt && existing.expireAt > now
            ? new Date(existing.expireAt.getTime() + 30 * 86400000)
            : new Date(now.getTime() + 30 * 86400000);

        const tiers = Array.from(new Set([...(existing?.tiers || []), tier]));
        const dinos = Array.from(new Set([...(existing?.dinos || []), ...config.dinos]));
        const usosPorTier = existing?.usosPorTier || {};

        usosPorTier[tier] = usosPorTier[tier] || {
          weeklyLimit: WEEKLY_LIMITS[tier],
          usedThisWeek: 0,
          lastUse: null,
        };

        await col.updateOne(
          { userId: user.id },
          {
            $set: {
              userId: user.id,
              tiers,
              dinos,
              usosPorTier,
              expireAt,
              active: true,
              updatedAt: now,
            },
            $push: {
              history: {
                tier,
                date: now,
                by: interaction.user.id,
              },
            },
            $setOnInsert: { createdAt: now },
          },
          { upsert: true }
        );

        /* ───── LOG STAFF ───── */
        const logChannel = interaction.guild.channels.cache.get(process.env.LOG_PATROCINIO_ENTREGA);

        if (logChannel) {
          logChannel
            .send({
              embeds: [
                new EmbedBuilder()
                  .setColor(0xf1c40f)
                  .setTitle('📦 Patrocínio Entregue / Renovado')
                  .setDescription('Registro administrativo de entrega de patrocínio.')
                  .addFields(
                    { name: '👤 Usuário', value: `${user} \n\`${user.id}\`` },
                    { name: '🎁 Tier Entregue', value: `Tier ${tier}` },
                    { name: '🦖 Dinossauros Liberados', value: config.dinos.join(', ') },
                    {
                      name: '📅 Nova Expiração',
                      value: `${formatDate(expireAt)} (${formatRelative(expireAt)})`,
                    },
                    { name: '🛠️ Staff Responsável', value: `${interaction.user}` }
                  )
                  .setFooter({ text: guildName })
                  .setTimestamp(),
              ],
            })
            .catch(err => logger.logWarn('patrocinio_logchannel_send', err));
        }

        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xf1c40f)
              .setTitle('💎 Patrocínio Atualizado com Sucesso')
              .setDescription('O patrocínio foi aplicado corretamente ao usuário.')
              .addFields(
                { name: '👤 Usuário', value: `${user}`, inline: true },
                {
                  name: '📦 Tiers Ativos',
                  value: tiers.map(t => `Tier ${t}`).join(', '),
                  inline: true,
                },
                { name: '🦖 Dinossauros Disponíveis', value: dinos.join(', ') || 'Nenhum' },
                {
                  name: '⏳ Validade',
                  value: `${formatDate(expireAt)}\n${formatRelative(expireAt)}`,
                }
              )
              .setFooter({ text: guildName })
              .setTimestamp(),
          ],
        });
      }

      /* ─────────────────────────────
       * 🦖 RESGATAR BENEFÍCIO
       * ───────────────────────────── */
      if (sub === 'resgatar') {
        const tier = interaction.options.getInteger('tier');
        const dino = interaction.options.getString('dino');

        const data = col ? await col.findOne({ userId: interaction.user.id, active: true }) : null;

        if (!data) {
          return interaction.editReply({
            content: '❌ Você não possui um patrocínio ativo no momento.',
          });
        }

        const info = data.usosPorTier[tier];
        if (!info) {
          return interaction.editReply({
            content: '❌ Este tier não está disponível no seu patrocínio.',
          });
        }

        if (isNewWeek(info.lastUse)) {
          info.usedThisWeek = 0;
        }

        if (info.usedThisWeek >= info.weeklyLimit) {
          return interaction.editReply({
            content: '⛔ Você atingiu o limite semanal deste tier.',
          });
        }

        info.usedThisWeek++;
        info.lastUse = new Date();

        await col.updateOne(
          { userId: interaction.user.id },
          { $set: { usosPorTier: data.usosPorTier } }
        );

        /* ───── LOG RESGATE ───── */
        const logChannel = interaction.guild.channels.cache.get(process.env.LOG_PATROCINIO_RESGATE);

        if (logChannel) {
          logChannel
            .send({
              embeds: [
                new EmbedBuilder()
                  .setColor(0x2ecc71)
                  .setTitle('🦖 Benefício Resgatado')
                  .setDescription('Registro de resgate de benefício por patrocínio.')
                  .addFields(
                    { name: '👤 Usuário', value: `${interaction.user}` },
                    { name: '📦 Tier Utilizado', value: `Tier ${tier}` },
                    { name: '🦖 Dinossauro', value: dino },
                    { name: '🔁 Usos Restantes', value: `${info.weeklyLimit - info.usedThisWeek}` }
                  )
                  .setFooter({ text: guildName })
                  .setTimestamp(),
              ],
            })
            .catch(err => logger.logWarn('patrocinio_logchannel_resgate', err));
        }

        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x2ecc71)
              .setTitle('✅ Resgate Concluído')
              .setDescription('Seu benefício foi resgatado com sucesso!')
              .addFields(
                { name: '📦 Tier', value: `Tier ${tier}`, inline: true },
                { name: '🦖 Dinossauro', value: dino, inline: true },
                {
                  name: '🔁 Usos Restantes nesta Semana',
                  value: `${info.weeklyLimit - info.usedThisWeek}`,
                  inline: true,
                },
                {
                  name: '📅 Último Uso',
                  value: info.lastUse ? formatRelative(info.lastUse) : 'Nunca',
                }
              )
              .setFooter({ text: guildName })
              .setTimestamp(),
          ],
        });
      }
    } catch (err) {
      logger.logError('patrocinio', err);
      try {
        if (!interaction.replied)
          await interaction.editReply({ content: '❌ Erro interno no sistema de patrocínio.' });
        else
          await interaction.followUp({
            content: '❌ Erro interno no sistema de patrocínio.',
            ephemeral: true,
          });
      } catch (e) {
        logger.logError('patrocinio_notify_error', e);
      }
    }
  },
};
