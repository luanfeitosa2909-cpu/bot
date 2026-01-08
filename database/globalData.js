const { clientMongo } = require('./mongodb');

async function getGlobalData(key) {
  try {
    await clientMongo.connect(); // Conecta sempre (não causa erro se já estiver conectado)
    const db = clientMongo.db('ProjetoGenoma');
    const collection = db.collection('GlobalData');

    const doc = await collection.findOne({ key });
    return doc?.value || null;
  } catch (error) {
    console.error('❌ Erro ao buscar GlobalData:', error);
    return null;
  }
}

async function setGlobalData(key, value) {
  try {
    await clientMongo.connect(); // Mesma coisa aqui
    const db = clientMongo.db('ProjetoGenoma');
    const collection = db.collection('GlobalData');

    await collection.updateOne({ key }, { $set: { value } }, { upsert: true });
  } catch (error) {
    console.error('❌ Erro ao salvar GlobalData:', error);
  }
}

module.exports = { getGlobalData, setGlobalData };
