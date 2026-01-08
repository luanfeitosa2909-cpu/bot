/**
 * uiConfig.js — Configurações centralizadas para UX (embeds, mensagens, temas)
 *
 * Define padrões visuais para sucesso, erro, aviso, info em toda a aplicação
 */

require('dotenv').config();

module.exports = {
  // Cores dos temas
  colors: {
    success: process.env.COLOR_SUCCESS || '#2ecc71',
    error: process.env.COLOR_ERROR || '#e74c3c',
    warning: process.env.COLOR_WARNING || '#f39c12',
    info: process.env.COLOR_INFO || '#3498db',
    primary: process.env.COLOR_PRIMARY || '#2ecc71',
    secondary: process.env.COLOR_SECONDARY || '#95a5a6',
  },

  // Emojis padronizados
  emojis: {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    loading: '⏳',
    arrow: '→',
    bullet: '•',
    dot: '◦',
    star: '⭐',
    lock: '🔒',
    unlock: '🔓',
    money: '💰',
    user: '👤',
    users: '👥',
    settings: '⚙️',
    trash: '🗑️',
    check: '✓',
    cross: '✗',
  },

  // Mensagens padrão
  messages: {
    noPermission: 'Você não tem permissão para usar este comando.',
    cooldown: 'Você está em cooldown. Tente novamente em {time}s.',
    rateLimitExceeded: 'Você excedeu o limite de uso. Máximo: {max} por {window}s.',
    guildOnly: 'Este comando só pode ser usado em um servidor.',
    ownerOnly: 'Apenas o dono do bot pode usar este comando.',
    success: 'Operação concluída com sucesso!',
    error: 'Ocorreu um erro inesperado. Tente novamente mais tarde.',
    loading: 'Processando...',
  },

  // Timeouts padrão (ms)
  timeouts: {
    ephemeral: 3000, // Resposta efêmera padrão
    modalTimeout: 15 * 60 * 1000, // 15 minutos
    buttonTimeout: 5 * 60 * 1000, // 5 minutos
    selectTimeout: 5 * 60 * 1000, // 5 minutos
  },

  // Limites padrão
  limits: {
    maxFieldLength: 1024,
    maxFields: 25,
    maxEmbedDescription: 4096,
    maxNameLength: 256,
    maxButtonLabel: 80,
  },

  // Configurações de logging
  logging: {
    includeTimestamp: true,
    includeUserId: true,
    includeCommand: true,
  },

  // Branding
  branding: {
    name: process.env.BOT_NAME || 'Bot',
    version: process.env.BOT_VERSION || '1.0.0',
    footer: process.env.BOT_FOOTER || '© 2026 All rights reserved',
    website: process.env.BOT_WEBSITE || 'https://example.com',
  },

  /**
   * Formata mensagem substituindo placeholders
   * @param {string} message - Mensagem com {placeholder}
   * @param {object} data - Dados para substituir
   * @returns {string}
   */
  formatMessage: (message, data = {}) => {
    let result = message;
    Object.entries(data).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{${key}}`, 'g'), value);
    });
    return result;
  },

  /**
   * Retorna emoji padronizado
   * @param {string} name - Nome do emoji
   * @returns {string}
   */
  getEmoji: name => {
    return module.exports.emojis[name] || '●';
  },

  /**
   * Retorna cor padronizada
   * @param {string} type - Tipo (success, error, warning, info)
   * @returns {string}
   */
  getColor: type => {
    return module.exports.colors[type] || module.exports.colors.primary;
  },
};
