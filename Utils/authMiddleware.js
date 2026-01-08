/**
 * authMiddleware.js — Middlewares de autorização (permissions, cooldowns, rate-limits)
 *
 * Uso em comandos:
 * try {
 *   await authMiddleware.checkPermissions(interaction, ['ADMINISTRATOR']);
 *   await authMiddleware.checkCooldown(interaction, 'command-name', 5000);
 *   // Lógica do comando...
 * } catch (err) {
 *   // Tratamento de erro
 * }
 */

const { PermissionFlagsBits } = require('discord.js');
const embedFactory = require('./embedFactory');
const { logWarn } = require('../Utils/logger');

// Armazenam cooldowns e rate-limits por usuário
const cooldowns = new Map();
const rateLimits = new Map();

/**
 * Verifica permissões do usuário
 * @param {Interaction} interaction - Discord interaction
 * @param {string[]} requiredPerms - Array de permissões necessárias (ex: ['ADMINISTRATOR', 'MANAGE_MESSAGES'])
 * @throws {Error} Se usuário não tiver permissões
 */
const checkPermissions = async (interaction, requiredPerms = []) => {
  if (!interaction.guild) {
    throw new Error('Comando não pode ser usado em DM');
  }

  if (!requiredPerms || requiredPerms.length === 0) {
    return true; // Sem permissões requeridas
  }

  const member = interaction.member;
  if (!member) {
    throw new Error('Membro não encontrado');
  }

  // Admin sempre passa
  if (member.permissions.has(PermissionFlagsBits.Administrator)) {
    return true;
  }

  const missingPerms = [];

  for (const perm of requiredPerms) {
    try {
      const permBit = PermissionFlagsBits[perm];
      if (!member.permissions.has(permBit)) {
        missingPerms.push(perm);
      }
    } catch (e) {
      logWarn(`Permissão inválida: ${perm}`);
    }
  }

  if (missingPerms.length > 0) {
    const embed = embedFactory.error(
      'Permissões insuficientes',
      `Você precisa de: ${missingPerms.join(', ')}`
    );
    await interaction.reply({ embeds: [embed], ephemeral: true });
    throw new Error(`Missing permissions: ${missingPerms.join(', ')}`);
  }

  return true;
};

/**
 * Verifica cooldown (tempo mínimo entre execuções)
 * @param {Interaction} interaction - Discord interaction
 * @param {string} commandName - Nome único do comando/ação
 * @param {number} cooldownMs - Tempo de cooldown em milissegundos
 * @throws {Error} Se usuário está em cooldown
 */
const checkCooldown = async (interaction, commandName, cooldownMs = 5000) => {
  const userId = interaction.user.id;
  const key = `${userId}:${commandName}`;
  const now = Date.now();

  if (cooldowns.has(key)) {
    const expiresAt = cooldowns.get(key);
    if (now < expiresAt) {
      const remainingMs = expiresAt - now;
      const remainingSec = Math.ceil(remainingMs / 1000);

      const embed = embedFactory.warning(
        'Você está em cooldown',
        `Tente novamente em ${remainingSec} segundo${remainingSec > 1 ? 's' : ''}`
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
      throw new Error(`Cooldown active for ${remainingMs}ms`);
    }
  }

  cooldowns.set(key, now + cooldownMs);

  // Limpa cooldown expirado após o tempo
  setTimeout(() => cooldowns.delete(key), cooldownMs);

  return true;
};

/**
 * Verifica rate-limit (máximo de execuções em janela de tempo)
 * @param {Interaction} interaction - Discord interaction
 * @param {string} actionKey - Chave única da ação
 * @param {number} maxRequests - Máximo de requisições permitidas
 * @param {number} windowMs - Janela de tempo em milissegundos (ex: 60000 = 1 minuto)
 * @throws {Error} Se limite foi excedido
 */
const checkRateLimit = async (interaction, actionKey, maxRequests = 10, windowMs = 60000) => {
  const userId = interaction.user.id;
  const key = `${userId}:${actionKey}`;
  const now = Date.now();

  if (!rateLimits.has(key)) {
    rateLimits.set(key, []);
  }

  const timestamps = rateLimits.get(key);

  // Remove timestamps fora da janela
  const validTimestamps = timestamps.filter(ts => now - ts < windowMs);

  if (validTimestamps.length >= maxRequests) {
    const oldestTs = validTimestamps[0];
    const resetTime = Math.ceil((oldestTs + windowMs - now) / 1000);

    const embed = embedFactory.warning(
      'Você excedeu o limite de uso',
      `Máximo: ${maxRequests} uso${maxRequests > 1 ? 's' : ''} a cada ${Math.round(
        windowMs / 1000
      )} segundo${Math.round(windowMs / 1000) > 1 ? 's' : ''}.\nTente novamente em ${resetTime}s.`
    );
    await interaction.reply({ embeds: [embed], ephemeral: true });
    throw new Error(`Rate limit exceeded: ${maxRequests} in ${windowMs}ms window`);
  }

  validTimestamps.push(now);
  rateLimits.set(key, validTimestamps);

  // Limpa a chave se não tiver mais timestamps na janela
  setTimeout(() => {
    const remaining = rateLimits.get(key)?.filter(ts => now - ts < windowMs) || [];
    if (remaining.length === 0) {
      rateLimits.delete(key);
    } else {
      rateLimits.set(key, remaining);
    }
  }, windowMs);

  return true;
};

/**
 * Verifica se usuário é owner do bot
 * @param {Interaction} interaction - Discord interaction
 * @param {string} ownerId - ID do owner (do .env ou config)
 * @throws {Error} Se não é owner
 */
const checkOwner = async (interaction, ownerId) => {
  if (interaction.user.id !== ownerId) {
    const embed = embedFactory.error(
      'Acesso negado',
      'Apenas o dono do bot pode usar este comando.'
    );
    await interaction.reply({ embeds: [embed], ephemeral: true });
    throw new Error('User is not bot owner');
  }

  return true;
};

/**
 * Verifica se usuário é membro do servidor
 * @param {Interaction} interaction - Discord interaction
 * @throws {Error} Se não é membro válido
 */
const checkMember = async interaction => {
  if (!interaction.guild) {
    const embed = embedFactory.error('Erro', 'Este comando só pode ser usado em um servidor.');
    await interaction.reply({ embeds: [embed], ephemeral: true });
    throw new Error('Not in guild');
  }

  if (!interaction.member) {
    const embed = embedFactory.error('Erro', 'Não foi possível verificar seu status de membro.');
    await interaction.reply({ embeds: [embed], ephemeral: true });
    throw new Error('Member not found');
  }

  return true;
};

/**
 * Verifica múltiplas condições de forma concisa
 * @param {Interaction} interaction - Discord interaction
 * @param {object} config - { permissions: [...], cooldown: ms, rateLimit: { max, window }, ownerOnly: bool }
 */
const checkMultiple = async (interaction, config = {}) => {
  const { permissions = [], cooldown = 0, rateLimit = null, ownerOnly = false } = config;

  // Check member primeiro
  await checkMember(interaction);

  // Check owner se necessário
  if (ownerOnly) {
    await checkOwner(interaction, process.env.BOT_OWNER_ID);
  }

  // Check permissions
  if (permissions.length > 0) {
    await checkPermissions(interaction, permissions);
  }

  // Check cooldown
  if (cooldown > 0) {
    const commandName = interaction.commandName || interaction.customId;
    await checkCooldown(interaction, commandName, cooldown);
  }

  // Check rate-limit
  if (rateLimit) {
    const actionKey = interaction.commandName || interaction.customId;
    await checkRateLimit(interaction, actionKey, rateLimit.max || 10, rateLimit.window || 60000);
  }

  return true;
};

/**
 * Limpa cooldowns (para testes ou resets)
 * @param {string} userId - ID do usuário (opcional, limpa todos se omitido)
 */
const clearCooldowns = (userId = null) => {
  if (userId) {
    const keysToDelete = Array.from(cooldowns.keys()).filter(k => k.startsWith(`${userId}:`));
    keysToDelete.forEach(k => cooldowns.delete(k));
  } else {
    cooldowns.clear();
  }
};

/**
 * Limpa rate-limits (para testes ou resets)
 * @param {string} userId - ID do usuário (opcional, limpa todos se omitido)
 */
const clearRateLimits = (userId = null) => {
  if (userId) {
    const keysToDelete = Array.from(rateLimits.keys()).filter(k => k.startsWith(`${userId}:`));
    keysToDelete.forEach(k => rateLimits.delete(k));
  } else {
    rateLimits.clear();
  }
};

module.exports = {
  checkPermissions,
  checkCooldown,
  checkRateLimit,
  checkOwner,
  checkMember,
  checkMultiple,
  clearCooldowns,
  clearRateLimits,
};
