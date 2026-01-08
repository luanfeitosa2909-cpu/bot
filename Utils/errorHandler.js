const { EmbedBuilder } = require('discord.js');

module.exports = async (interaction, next) => {
  try {
    await next();
  } catch (err) {
    console.error(`[❌][${new Date().toISOString()}] Erro ao processar interação:`, {
      user: interaction.user?.tag,
      command: interaction.commandName || interaction.customId || 'desconhecido',
      id: interaction.id,
      error: err,
      stack: err?.stack,
    });

    // ❗ Se for AUTOCOMPLETE, não tenta responder → causa erro
    if (interaction.isAutocomplete()) {
      console.warn(`[⚠️][${new Date().toISOString()}] Erro ignorado no autocomplete:`, err.message);
      return; // ✔ para autocomplete isso já é o suficiente
    }

    const errorEmbed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('❌ Ocorreu um erro inesperado!')
      .setDescription(
        'Algo deu errado ao processar seu comando.\n' +
          'Nossa equipe já foi notificada e irá analisar o ocorrido.\n\n' +
          'Se o problema persistir, entre em contato com o suporte.'
      )
      .setFooter({
        text: `${interaction.guild?.name || 'Mensagem Direta'} • Sistema de Erros`,
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setTimestamp();

    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], flags: 1 << 6 });
      } else {
        await interaction.reply({ embeds: [errorEmbed], flags: 1 << 6 });
      }
    } catch (sendErr) {
      console.error(
        `[❌][${new Date().toISOString()}] Falha ao enviar mensagem de erro ao usuário:`,
        sendErr
      );
    }
  }
};
