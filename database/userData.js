const { clientMongo } = require('./mongodb');

async function ensureConnected() {
  if (!clientMongo.topology || !clientMongo.topology.isConnected()) {
    await clientMongo.connect();
  }
}

function getCollection() {
  return clientMongo.db('ProjetoGenoma').collection('DataBase');
}

/**
 * Busca os dados do usuário pelo user_id.
 * Retorna objeto vazio se não encontrar.
 */
async function getUserData(userId) {
  try {
    await ensureConnected();
    const collection = getCollection();
    const userData = await collection.findOne({ user_id: userId });
    return userData || {};
  } catch (error) {
    console.error('❌ Erro ao buscar dados do usuário:', error);
    return {};
  }
}

/**
 * Busca um usuário pelo steamid.
 * Retorna o documento do usuário se encontrar, ou null.
 */
async function getUserBySteamId(steamid) {
  try {
    await ensureConnected();
    const collection = getCollection();
    return await collection.findOne({ steamid });
  } catch (error) {
    console.error('❌ Erro ao buscar usuário por SteamID:', error);
    return null;
  }
}

/**
 * Atualiza ou insere dados do usuário.
 * Recebe o userId e um objeto parcial com os campos a atualizar.
 * Faz merge automático para não sobrescrever dados existentes.
 */
async function setUserData(userId, newData) {
  try {
    await ensureConnected();
    const collection = getCollection();

    // Busca dados atuais para merge
    const currentData = (await collection.findOne({ user_id: userId })) || {};

    // Merge shallow dos dados atuais com os novos (priorizando os novos)
    const updatedData = { ...currentData, ...newData, user_id: userId };

    await collection.updateOne({ user_id: userId }, { $set: updatedData }, { upsert: true });
  } catch (error) {
    console.error('❌ Erro ao salvar dados do usuário:', error);
  }
}

module.exports = { getUserData, setUserData, getCollection, getUserBySteamId };
