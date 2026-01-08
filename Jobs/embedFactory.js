/**
 * embedFactory.js — Utilitário centralizado para criar embeds padronizadas
 * Suporta temas: success, error, warning, info com footers dinâmicos
 *
 * Uso:
 * const embed = embedFactory.success('Operação concluída!', 'Descrição adicional');
 * await interaction.reply({ embeds: [embed] });
 */

const { EmbedBuilder } = require('discord.js');

const BOT_NAME = process.env.BOT_NAME || 'Bot';
const BOT_VERSION = process.env.BOT_VERSION || '1.0.0';
const BRAND_COLOR = process.env.BRAND_COLOR || '#2ecc71';

/**
 * Cria um footer padrão com branding
 * @param {string} customText - Texto customizado (opcional)
 * @returns {object} Footer com nome do bot e timestamp
 */
const createFooter = (customText = '') => {
  const text = customText
    ? `${customText} • ${BOT_NAME} v${BOT_VERSION}`
    : `${BOT_NAME} v${BOT_VERSION}`;
  return { text, iconURL: undefined };
};

/**
 * Embed de sucesso (verde)
 * @param {string} title - Título do embed
 * @param {string} description - Descrição principal
 * @param {object} options - Opções adicionais { color, thumbnail, image, fields }
 * @returns {EmbedBuilder}
 */
const success = (title, description, options = {}) => {
  const embed = new EmbedBuilder()
    .setColor(options.color || '#2ecc71')
    .setTitle(`✅ ${title}`)
    .setDescription(description || '')
    .setFooter(createFooter('Operação bem-sucedida'));

  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);
  if (options.fields && Array.isArray(options.fields)) {
    options.fields.forEach(f => embed.addFields(f));
  }
  if (options.timestamp !== false) embed.setTimestamp();

  return embed;
};

/**
 * Embed de erro (vermelho)
 * @param {string} title - Título do erro
 * @param {string} description - Mensagem de erro
 * @param {object} options - Opções adicionais
 * @returns {EmbedBuilder}
 */
const error = (title, description, options = {}) => {
  const embed = new EmbedBuilder()
    .setColor(options.color || '#e74c3c')
    .setTitle(`❌ ${title}`)
    .setDescription(description || '')
    .setFooter(createFooter('Erro durante operação'));

  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);
  if (options.fields && Array.isArray(options.fields)) {
    options.fields.forEach(f => embed.addFields(f));
  }
  if (options.timestamp !== false) embed.setTimestamp();

  return embed;
};

/**
 * Embed de aviso (amarelo)
 * @param {string} title - Título do aviso
 * @param {string} description - Mensagem de aviso
 * @param {object} options - Opções adicionais
 * @returns {EmbedBuilder}
 */
const warning = (title, description, options = {}) => {
  const embed = new EmbedBuilder()
    .setColor(options.color || '#f39c12')
    .setTitle(`⚠️ ${title}`)
    .setDescription(description || '')
    .setFooter(createFooter('Atenção'));

  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);
  if (options.fields && Array.isArray(options.fields)) {
    options.fields.forEach(f => embed.addFields(f));
  }
  if (options.timestamp !== false) embed.setTimestamp();

  return embed;
};

/**
 * Embed de informação (azul)
 * @param {string} title - Título da informação
 * @param {string} description - Conteúdo informativo
 * @param {object} options - Opções adicionais
 * @returns {EmbedBuilder}
 */
const info = (title, description, options = {}) => {
  const embed = new EmbedBuilder()
    .setColor(options.color || '#3498db')
    .setTitle(`ℹ️ ${title}`)
    .setDescription(description || '')
    .setFooter(createFooter('Informação'));

  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);
  if (options.fields && Array.isArray(options.fields)) {
    options.fields.forEach(f => embed.addFields(f));
  }
  if (options.timestamp !== false) embed.setTimestamp();

  return embed;
};

/**
 * Embed customizado com total flexibilidade
 * @param {object} config - Configuração completa do embed
 * @returns {EmbedBuilder}
 */
const custom = config => {
  const embed = new EmbedBuilder();

  if (config.color) embed.setColor(config.color);
  if (config.title) embed.setTitle(config.title);
  if (config.description) embed.setDescription(config.description);
  if (config.author) embed.setAuthor(config.author);
  if (config.thumbnail) embed.setThumbnail(config.thumbnail);
  if (config.image) embed.setImage(config.image);
  if (config.footer) {
    embed.setFooter(config.footer);
  } else {
    embed.setFooter(createFooter(config.footerText));
  }

  if (config.fields && Array.isArray(config.fields)) {
    config.fields.forEach(f => embed.addFields(f));
  }

  if (config.timestamp !== false) embed.setTimestamp();

  return embed;
};

/**
 * Embed de confirmação (para botões/reações)
 * @param {string} message - Mensagem de confirmação
 * @param {object} options - Opções adicionais
 * @returns {EmbedBuilder}
 */
const confirm = (message, options = {}) => {
  return success('Confirme sua ação', message, {
    ...options,
    color: options.color || '#3498db',
  });
};

/**
 * Embed de carregamento (animado com tempo)
 * @param {string} title - Título
 * @param {string} message - Mensagem de progresso
 * @returns {EmbedBuilder}
 */
const loading = (title, message) => {
  return info(title, `⏳ ${message}`, {
    timestamp: false,
  });
};

module.exports = {
  success,
  error,
  warning,
  info,
  custom,
  confirm,
  loading,
  createFooter,
};
