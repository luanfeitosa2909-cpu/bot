const { EmbedBuilder } = require('discord.js');

module.exports = {
  type: 'modal',
  customId: 'avaliacaoStaffModal',

  run: async (client, interaction, clientMongo) => {
    const staffInput = interaction.fields.getTextInputValue('staffName'); // Pode ser nome ou ID
    const nota = interaction.fields.getTextInputValue('nota');
    const avaliacao = interaction.fields.getTextInputValue('avaliacao');
    const sugestao = interaction.fields.getTextInputValue('sugestao') || 'Nenhuma';

    // Buscar dados do usuário no MongoDB
    const userId = interaction.user.id;
    const db = clientMongo.db('ProjetoGenoma');
    const collection = db.collection('DataBase'); // Coleção correta
    const userData = await collection.findOne({ user_id: userId });

    const steamId = userData?.steamid || 'Desconhecido';
    const steamName = userData?.steamname || 'Desconhecido';
    const despesa = userData?.despesa?.toString() || '0';
    const avatarURL = interaction.user.displayAvatarURL({ dynamic: true, size: 1024 });

    // Verificar se o input do staff é um ID válido
    let staffMention;
    if (/^\d{17,19}$/.test(staffInput)) {
      // Tenta buscar usuário no Discord
      try {
        const staffUser = await client.users.fetch(staffInput);
        staffMention = `<@${staffUser.id}>`;
      } catch {
        staffMention = staffInput; // Caso ID inválido, mantém texto
      }
    } else {
      staffMention = staffInput; // Se não for ID, usa texto
    }

    // Embed profissional
    const embed = new EmbedBuilder()
      .setTitle('📊 Avaliação de Staff Recebida')
      .setColor('#1ABC9C') // Cor moderna e agradável
      .setThumbnail(avatarURL)
      .setDescription(`Uma nova avaliação foi registrada no sistema!`)
      .addFields(
        { name: '👤 Usuário', value: `<@${userId}>`, inline: true },
        { name: '🎮 Steam Name', value: steamName, inline: true },
        { name: '🆔 SteamID', value: steamId, inline: true },
        { name: '💰 Despesa', value: despesa, inline: true },
        { name: '🛠️ Staff Avaliado', value: staffMention, inline: true },
        { name: '⭐ Nota', value: nota, inline: true },
        { name: '📝 Avaliação', value: avaliacao },
        { name: '💡 Sugestão', value: sugestao }
      )
      .setFooter({
        text: `Sistema de Avaliação • Projeto Genoma`,
        iconURL: client.user.displayAvatarURL(),
      })
      .setTimestamp()
      .setImage(
        'https://media.discordapp.net/attachments/1385726045034123445/1417537441786761327/image.png?ex=68cad81e&is=68c9869e&hm=276b68b208bf69ff61036c4ed3bedb742654fd44c394f9304179cd302c75d9d5&=&format=webp&quality=lossless'
      ); // Banner moderno

    // Enviar para canal de logs
    const logChannel = await client.channels.fetch(process.env.LOG_CHANNEL_AVALIACAO);
    if (logChannel) await logChannel.send({ embeds: [embed] });

    // Confirmação para o usuário
    await interaction.reply({ content: '✅ Avaliação enviada com sucesso!', flags: 1 << 6 });
  },
};
