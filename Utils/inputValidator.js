/**
 * inputValidator.js — Validação e sanitização de entradas de usuário
 *
 * Funções para validar e sanitizar dados antes de persistir no banco
 * Protege contra injeção, XSS, e dados malformados
 */

const { logWarn } = require('./logger');

/**
 * Remove caracteres perigosos para evitar injeção
 * @param {string} input - Entrada do usuário
 * @returns {string} - String sanitizada
 */
const sanitizeString = input => {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/[<>"'`]/g, '') // Remove caracteres perigosos
    .replace(/\$/g, '') // Remove $ para evitar injeção MongoDB
    .substring(0, 1024); // Limita tamanho
};

/**
 * Valida um ID do Discord (deve ser número de 18+ dígitos)
 * @param {string} id - ID para validar
 * @returns {boolean}
 */
const isValidDiscordId = id => {
  if (!id) return false;
  return /^\d{18,}$/.test(String(id));
};

/**
 * Valida um email
 * @param {string} email - Email para validar
 * @returns {boolean}
 */
const isValidEmail = email => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email) && email.length <= 254;
};

/**
 * Valida um número inteiro dentro de um intervalo
 * @param {number} value - Valor para validar
 * @param {number} min - Mínimo (inclusive)
 * @param {number} max - Máximo (inclusive)
 * @returns {boolean}
 */
const isValidInteger = (value, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const num = parseInt(value, 10);
  return !isNaN(num) && num >= min && num <= max;
};

/**
 * Valida URL
 * @param {string} url - URL para validar
 * @returns {boolean}
 */
const isValidUrl = url => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Valida steamID64
 * @param {string} steamid - SteamID para validar
 * @returns {boolean}
 */
const isValidSteamId = steamid => {
  if (!steamid) return false;
  // SteamID64 é um número de 17 dígitos começando com 76561198
  return /^76561198\d{9,}$/.test(String(steamid));
};

/**
 * Sanitiza e valida um nome de usuário
 * @param {string} username - Nome para validar
 * @returns {string|null} - Nome sanitizado ou null se inválido
 */
const sanitizeUsername = username => {
  if (!username || typeof username !== 'string') return null;

  const sanitized = username
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '') // Permite apenas alphanumeric, _, -
    .substring(0, 32); // Limita a 32 caracteres

  return sanitized.length > 0 ? sanitized : null;
};

/**
 * Valida objeto de permissões
 * @param {object} permissions - Objeto com permissões
 * @returns {object} - Permissões validadas
 */
const validatePermissions = (permissions = {}) => {
  const valid = {};

  // Lista de permissões permitidas
  const allowedPerms = [
    'ADMINISTRATOR',
    'MANAGE_MESSAGES',
    'MANAGE_ROLES',
    'MANAGE_CHANNELS',
    'BAN_MEMBERS',
    'KICK_MEMBERS',
  ];

  Object.entries(permissions).forEach(([key, value]) => {
    if (allowedPerms.includes(key) && typeof value === 'boolean') {
      valid[key] = value;
    }
  });

  return valid;
};

/**
 * Valida dados de usuário antes de persistir
 * @param {object} userData - Dados do usuário
 * @returns {object|null} - Dados validados ou null se inválido
 */
const validateUserData = userData => {
  if (!userData || typeof userData !== 'object') return null;

  const validated = {};

  // Validar ID
  if (!isValidDiscordId(userData.user_id)) {
    logWarn('userdata: ID do Discord inválido');
    return null;
  }
  validated.user_id = userData.user_id;

  // Validar nome (opcional)
  if (userData.nome) {
    const sanitized = sanitizeString(userData.nome);
    if (sanitized.length > 0) {
      validated.nome = sanitized;
    }
  }

  // Validar coins
  if (userData.coins !== undefined) {
    if (isValidInteger(userData.coins, 0, 999999999)) {
      validated.coins = Math.floor(userData.coins);
    } else {
      logWarn('userData: coins inválido, usando 0');
      validated.coins = 0;
    }
  }

  // Validar steamid se presente
  if (userData.steamid && !isValidSteamId(userData.steamid)) {
    logWarn('userData: SteamID inválido, removendo');
    // Não inclui no validado
  } else if (userData.steamid) {
    validated.steamid = userData.steamid;
  }

  // Validar timestamps
  if (userData.createdAt && typeof userData.createdAt === 'number') {
    validated.createdAt = userData.createdAt;
  }

  return validated;
};

/**
 * Valida dados de aposta
 * @param {object} apostaData - Dados da aposta
 * @returns {object|null} - Dados validados
 */
const validateAposta = apostaData => {
  if (!apostaData || typeof apostaData !== 'object') return null;

  const validated = {};

  // ID do usuario
  if (!isValidDiscordId(apostaData.userId)) {
    return null;
  }
  validated.userId = apostaData.userId;

  // Valor
  if (!isValidInteger(apostaData.valor, 1, 999999)) {
    return null;
  }
  validated.valor = Math.floor(apostaData.valor);

  // Descrição (sanitizada)
  if (apostaData.descricao) {
    const sanitized = sanitizeString(apostaData.descricao);
    if (sanitized.length > 0) {
      validated.descricao = sanitized;
    }
  }

  // Status
  const validStatus = ['pendente', 'ganha', 'perde', 'cancelada'];
  if (validStatus.includes(apostaData.status)) {
    validated.status = apostaData.status;
  } else {
    validated.status = 'pendente';
  }

  return validated;
};

/**
 * Valida entrada de texto longo (descrição, conteúdo)
 * @param {string} text - Texto para validar
 * @param {number} maxLength - Comprimento máximo (padrão 4096)
 * @returns {string|null} - Texto validado ou null
 */
const validateLongText = (text, maxLength = 4096) => {
  if (typeof text !== 'string') return null;

  const sanitized = text.trim().substring(0, maxLength);
  return sanitized.length > 0 ? sanitized : null;
};

/**
 * Verifica se entrada contém padrões suspeitos
 * @param {string} input - Entrada para verificar
 * @returns {boolean} - true se suspeita
 */
const isSuspicious = input => {
  if (typeof input !== 'string') return false;

  const suspiciousPatterns = [
    /\$where/gi, // MongoDB injection
    /\$ne/gi, // MongoDB injection
    /\$gt/gi, // MongoDB injection
    /javascript:/gi, // XSS
    /onerror=/gi, // XSS
    /onclick=/gi, // XSS
    /<script/gi, // XSS
  ];

  return suspiciousPatterns.some(pattern => pattern.test(input));
};

module.exports = {
  sanitizeString,
  sanitizeUsername,
  isValidDiscordId,
  isValidEmail,
  isValidInteger,
  isValidUrl,
  isValidSteamId,
  validatePermissions,
  validateUserData,
  validateAposta,
  validateLongText,
  isSuspicious,
};
