const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');
const fetch = require('node-fetch');
const { getUserData, setUserData, getUserBySteamId } = require('../../database/userData');
const logger = require('../../Utils/logger');

const canalLogId = process.env.LOG_CHANNEL_VERIFICACAO;
const steamId64Regex = /^\d{17}$/;
const STEAM_API_KEY = process.env.STEAM_API_KEY;

// Cooldown em memória (por userId)
const cooldowns = new Map();
const COOLDOWN_MS = 60 * 1000; // 1 minuto

// Limite de tentativas por hora
const attempts = new Map();
const ATTEMPT_LIMIT = 5;
const ATTEMPT_WINDOW = 60 * 60 * 1000; // 1 hora

// Função para buscar o perfil completo da Steam
async function getSteamProfile(steamid64) {
  try {
    const res = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steamid64}`
    );
    logger.logInfo(`Steam API status: ${res.status} para SteamID ${steamid64}`);
    if (!res.ok) {
      logger.logError(`Erro Steam API: status ${res.status} para SteamID ${steamid64}`);
      return null;
    }

    const json = await res.json();
    const player = json.response.players?.[0];
    if (!player || !player.personaname) return null;

    return player; // retorna o objeto completo
  } catch (err) {
    logger.logError('Erro ao buscar perfil da Steam:', err);
    return null;
  }
}

module.exports = {
  type: 'modal',
  customId: 'modal_steamid',
  async run(client, interaction, _clientMongo) {
    if (!interaction.isModalSubmit() || interaction.customId !== this.customId) return;

    // Cooldown por usuário
    const userId = interaction.user.id;
    const now = Date.now();

    // Limite de tentativas por hora
    const userAttempts = attempts.get(userId) || [];
    const recentAttempts = userAttempts.filter(ts => now - ts < ATTEMPT_WINDOW);
    if (recentAttempts.length >= ATTEMPT_LIMIT) {
      const limitEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('🚫 Limite de tentativas atingido')
        .setDescription(
          'Você atingiu o limite de tentativas de verificação de SteamID. Por favor, tente novamente mais tarde.'
        )
        .setFooter({
          text: `Sistema de Verificação • ${interaction.guild.name}`,
          iconURL: client.user.displayAvatarURL(),
        })
        .setTimestamp();
      return interaction.reply({ embeds: [limitEmbed], flags: 1 << 6 });
    }
    recentAttempts.push(now);
    attempts.set(userId, recentAttempts);

    if (cooldowns.has(userId) && now - cooldowns.get(userId) < COOLDOWN_MS) {
      const restante = Math.ceil((COOLDOWN_MS - (now - cooldowns.get(userId))) / 1000);
      const cooldownEmbed = new EmbedBuilder()
        .setColor('#f1c40f')
        .setTitle('⏳ Aguarde um momento!')
        .setDescription(
          `Você precisa esperar **${restante}s** antes de tentar novamente para evitar sobrecarga na Steam API.\n\nEvite spam para não ser bloqueado!`
        )
        .setFooter({
          text: `Sistema de Verificação • ${interaction.guild.name}`,
          iconURL: client.user.displayAvatarURL(),
        })
        .setTimestamp();
      return interaction.reply({
        embeds: [cooldownEmbed],
        flags: 1 << 6,
      });
    }
    cooldowns.set(userId, now);

    await interaction.deferReply({ flags: 1 << 6 });

    const steamid = interaction.fields.getTextInputValue('steamid_input').trim();

    // Validação extra: começa com 7656
    if (!steamId64Regex.test(steamid) || !steamid.startsWith('7656')) {
      const invalidEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('❌ SteamID64 Inválida')
        .setDescription(
          'O SteamID64 informado não parece ser válido.\n\n> IDs válidos geralmente começam com **7656** e possuem 17 dígitos numéricos.\nExemplo: `76561198419559590`'
        )
        .setFooter({
          text: `Sistema de Verificação • ${interaction.guild.name}`,
          iconURL: client.user.displayAvatarURL(),
        })
        .setTimestamp();
      return interaction.editReply({ embeds: [invalidEmbed] });
    }

    // Verifica se o usuário já tem SteamID cadastrada
    const existing = await getUserData(userId);
    if (existing?.steamid) {
      const alreadyEmbed = new EmbedBuilder()
        .setColor('#e67e22')
        .setTitle('⚠️ SteamID64 já verificada')
        .setDescription(
          'Você já verificou sua SteamID64.\n\nSe precisar alterar, fale com um administrador.'
        )
        .setFooter({
          text: `Sistema de Verificação • ${interaction.guild.name}`,
          iconURL: client.user.displayAvatarURL(),
        })
        .setTimestamp();
      return interaction.editReply({ embeds: [alreadyEmbed] });
    }

    // Verifica se a SteamID já está cadastrada por outro usuário
    const steamIdExists = await getUserBySteamId(steamid);
    if (steamIdExists && steamIdExists.user_id !== userId) {
      const conflictEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('🚫 SteamID64 já cadastrada')
        .setDescription(
          [
            'Esta SteamID64 já está vinculada a outro usuário em nosso sistema.',
            '',
            'Cada conta só pode ser associada a **uma única SteamID64**.',
            '',
            `Se você acredita que isto é um erro, entre em contato com o suporte do ${interaction.guild.name}.`,
          ].join('\n')
        )
        .setFooter({
          text: `Sistema de Verificação • ${interaction.guild.name}`,
          iconURL: client.user.displayAvatarURL(),
        })
        .setTimestamp();
      return interaction.editReply({ embeds: [conflictEmbed] });
    }

    // Busca perfil completo da Steam
    const steamProfile = await getSteamProfile(steamid);
    if (!steamProfile) {
      const failEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('❌ Não foi possível verificar sua Steam')
        .setDescription(
          [
            'Não conseguimos obter seu nome da Steam.',
            '',
            '🔒 **Certifique-se de que sua conta está pública** e o SteamID64 está correto.',
            '',
            '🔓 Vá até suas configurações de privacidade na Steam e torne o perfil **público temporariamente** para verificação.',
            '',
            '> Se o problema persistir, entre em contato com o suporte.',
          ].join('\n')
        )
        .setFooter({
          text: `Sistema de Verificação • ${interaction.guild.name}`,
          iconURL: client.user.displayAvatarURL(),
        })
        .setTimestamp();
      return interaction.editReply({ embeds: [failEmbed] });
    }
    const steamUsername = steamProfile.personaname;

    const timestamp = Date.now();
    await setUserData(userId, {
      steamid,
      steamname: steamUsername,
      steamidTimestamp: timestamp,
    });

    // Atualiza o apelido no servidor
    try {
      const member = await interaction.guild.members.fetch(userId);
      if (
        interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageNicknames) &&
        member.manageable
      ) {
        await member.setNickname(steamUsername, 'Verificação SteamID64');
      }
    } catch (e) {
      logger.logWarn('Erro ao alterar apelido:', e);
    }

    // Confirmação ao usuário
    const confirmEmbed = new EmbedBuilder()
      .setTitle('✅ SteamID64 Verificada com Sucesso!')
      .setDescription(
        [
          `🆔 **SteamID:** \`${steamid}\``,
          `👤 **Apelido:** ${steamUsername}`,
          '',
          '🎉 Agora você pode solicitar seu Grow normalmente!',
          '',
          `> Bem-vindo ao ${interaction.guild.name}!`,
        ].join('\n')
      )
      .setColor('#2ecc71')
      .setThumbnail(
        steamProfile.avatarfull ||
          'https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/avatars/ee/eea7e2e7e6e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7_full.jpg'
      )
      .setFooter({
        text: `Sistema de Verificação • ${interaction.guild.name}`,
        iconURL: client.user.displayAvatarURL(),
      })
      .setTimestamp();
    await interaction.editReply({ embeds: [confirmEmbed] });

    // Log no canal de verificação
    try {
      const logChannel = client.channels.cache.get(canalLogId);
      if (logChannel?.isTextBased()) {
        const member = await interaction.guild.members.fetch(userId);
        const roles =
          member.roles.cache
            .filter(r => r.id !== interaction.guild.id)
            .map(r => `<@&${r.id}>`)
            .join(', ') || 'Nenhum';

        const logEmbed = new EmbedBuilder()
          .setTitle('📥 Nova Verificação de SteamID')
          .setColor('#3498db')
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: '👤 Usuário', value: `<@${userId}> (${interaction.user.tag})`, inline: true },
            { name: '🎮 SteamName', value: steamUsername, inline: true },
            { name: '🆔 SteamID', value: steamid, inline: true },
            {
              name: '🕒 Verificado em',
              value: `<t:${Math.floor(timestamp / 1000)}:F>`,
              inline: true,
            },
            { name: '🎭 Cargos', value: roles, inline: false },
            {
              name: '🔒 Banido?',
              value: steamProfile.communitybanned ? 'Sim' : 'Não',
              inline: true,
            },
            { name: '🚫 VAC Ban?', value: steamProfile.vacbanned ? 'Sim' : 'Não', inline: true },
            { name: '🟢 Status', value: String(steamProfile.personastate), inline: true }
          )
          .setFooter({
            text: `Sistema de Verificação • ${interaction.guild.name}`,
            iconURL: client.user.displayAvatarURL(),
          })
          .setTimestamp();
        await logChannel.send({ embeds: [logEmbed] });
      }
    } catch (err) {
      logger.logWarn('Erro ao enviar log de verificação:', err);
    }
  },
};
