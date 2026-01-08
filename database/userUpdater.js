// userUpdater.js
const { clientMongo } = require('./mongodb');

// garante que sempre esteja conectado
async function ensureConnected() {
  if (!clientMongo.topology || !clientMongo.topology.isConnected()) {
    await clientMongo.connect();
  }
}

// retorna a collection padrão do projeto
function getCollection() {
  return clientMongo.db('ProjetoGenoma').collection('DataBase');
}

/**
 * Atualiza o user_id (Discord ID) OU o steamid de um usuário.
 * Pode buscar tanto pelo user_id quanto pelo steamid.
 *
 * @param {Object} filter - Ex: { user_id: "123" } ou { steamid: "456" }
 * @param {Object} updates - Ex: { user_id: "novoID" } ou { steamid: "novoSteam" }
 * @returns {Boolean} true se deu certo, false se falhou
 */
async function updateUserIdOrSteamId(filter, updates) {
  try {
    await ensureConnected();
    const collection = getCollection();

    const result = await collection.updateOne(filter, { $set: updates });

    if (result.matchedCount === 0) {
      console.log('⚠️ Nenhum usuário encontrado com o filtro fornecido:', filter);
      return false;
    }

    console.log('✅ Usuário atualizado com sucesso:', updates);
    return true;
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
    return false;
  }
}

module.exports = { updateUserIdOrSteamId, getCollection, ensureConnected };
