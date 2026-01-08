const { getUserData, getUserBySteamId, getCollection } = require('../database/userData');

/**
 * Busca jogador pelo Discord userId ou pelo SteamID.
 * Retorna o documento do usuário ou null.
 * @param {string} input - Discord user_id ou SteamID
 * @returns {Promise<Object|null>}
 */
async function getPlayerByUserIdOrSteamId(input) {
  if (!input) return null;

  // Busca por Discord user_id
  let player = await getUserData(input);
  if (player && Object.keys(player).length > 0) return player;

  // Busca por SteamID
  player = await getUserBySteamId(input);
  if (player) return player;

  return null;
}

/**
 * Salva uma ocorrência na coleção 'Ocorrencias'.
 * @param {Object} params
 * @param {string} params.userId - Discord user_id do usuário.
 * @param {string} params.tipo - Tipo da ocorrência (ex: leve, media, grave).
 * @param {string} params.descricao - Descrição da ocorrência.
 * @param {string} params.steamid - SteamID do usuário.
 * @param {string} params.steamname - Nome Steam do usuário.
 * @param {string} params.autor - Discord user id do autor.
 * @param {Date} params.data - Data da ocorrência.
 * @returns {Promise<boolean>} true se sucesso, false se erro
 */
async function salvarOcorrencia({ userId, tipo, descricao, steamid, steamname, autor, data }) {
  try {
    const baseCollection = getCollection();

    // Tentativa segura de obter referência ao db
    const db = baseCollection.databaseName
      ? baseCollection.client.db(baseCollection.databaseName)
      : baseCollection.s?.db || baseCollection.client.db('ProjetoGenoma');

    const ocorrenciasCollection = db.collection('Ocorrencias');

    const ocorrenciaDoc = {
      user_id: userId,
      steamid,
      steamname,
      tipo,
      descricao,
      autor,
      data,
    };

    await ocorrenciasCollection.insertOne(ocorrenciaDoc);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar ocorrência:', error);
    return false;
  }
}

/**
 * Busca todas as ocorrências de um usuário pelo user_id e formata para string.
 * Retorna string formatada ou null se não encontrar ocorrências.
 * @param {string} userId - Discord user_id do usuário
 * @returns {Promise<string|null>}
 */
async function formatarHistorico(userId) {
  try {
    const baseCollection = getCollection();

    const db = baseCollection.databaseName
      ? baseCollection.client.db(baseCollection.databaseName)
      : baseCollection.s?.db || baseCollection.client.db('ProjetoGenoma');

    const ocorrenciasCollection = db.collection('Ocorrencias');

    const ocorrencias = await ocorrenciasCollection
      .find({ user_id: userId })
      .sort({ data: -1 })
      .toArray();

    if (!ocorrencias.length) return null;

    // Formata uma lista simples: data, tipo e descrição
    return ocorrencias
      .map(
        o =>
          `• [${new Date(o.data).toLocaleDateString('pt-BR')}] [${(
            o.tipo || 'N/A'
          ).toUpperCase()}] - ${o.descricao || 'Sem descrição'}`
      )
      .join('\n');
  } catch (error) {
    console.error('❌ Erro ao formatar histórico:', error);
    return null;
  }
}

module.exports = {
  getPlayerByUserIdOrSteamId,
  salvarOcorrencia,
  formatarHistorico,
};
