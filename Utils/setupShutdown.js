module.exports = (client, clientMongo) => {
  const shutdown = async () => {
    console.log('\n⏹️ Encerrando bot...');
    try {
      await client.destroy();
      await clientMongo.close();
      console.log('✅ Bot e MongoDB desconectados com sucesso.');
    } catch (err) {
      console.error('❌ Erro ao encerrar:', err);
    }
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};
