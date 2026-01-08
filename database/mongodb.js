const { MongoClient, ServerApiVersion } = require('mongodb');
const logger = require('../Utils/logger');
require('dotenv').config();

const uri = process.env.MONGO_URI;

const clientMongo = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function connectDB() {
  try {
    await clientMongo.connect();
    await clientMongo.db('admin').command({ ping: 1 });
    logger.logInfo('✅ Conectado ao MongoDB Atlas com sucesso!');
    return clientMongo;
  } catch (error) {
    // Mostra erro real no terminal para facilitar o debug
    console.error('❌ Erro ao conectar no MongoDB:', error);
    logger.logError('❌ Erro ao conectar no MongoDB:', error?.message || error);
    throw error;
  }
}

function getUserDataCollection() {
  return clientMongo.db('ProjetoGenoma').collection('DataBase'); // substitua conforme necessário
}

module.exports = { clientMongo, connectDB, getUserDataCollection };
