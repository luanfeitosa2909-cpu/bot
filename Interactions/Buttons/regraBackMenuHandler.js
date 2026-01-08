const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  customId: 'evrima_back_to_menu',
  type: 'button',
  run: async (client, interaction) => {
    const embed = new EmbedBuilder()
      .setTitle(`📘 Regras e Informações do ${interaction.guild.name}`)
      .setColor('Blue')
      .setDescription(
        [
          `👋 **Seja bem-vindo ao ${interaction.guild.name}!**`,
          '',
          'Aqui estão as principais diretrizes para garantir uma convivência saudável e uma ótima experiência de jogo:',
          '',
          '📜 **Regras do Discord:**',
          '• Respeite todos os membros e a equipe.',
          '• Proibido spam, flood, preconceito ou divulgação sem permissão.',
          '• Utilize os canais corretamente.',
          '• Punições podem ser aplicadas sem aviso em casos graves.',
          '',
          '🦖 **Regras do Evrima:**',
          '• Respeite o RP e o gameplay de todos.',
          '• É proibido uso de cheats, bugs ou exploits.',
          '• Fique atento aos eventos e anúncios oficiais.',
          '',
          '💡 **Dicas Importantes:**',
          '• Use /help para ver todos os comandos.',
          '• Para suporte, abra um ticket em <#1353512604353433741>.',
          '• Veja a <#1386085767004291174> para acessar vantagens exclusivas.',
          '• Novidades sempre em <#1353475835008647168>.',
          '',
          '🔽 **Selecione abaixo o que deseja visualizar com mais detalhes.**',
        ].join('\n')
      );

    const menu = new StringSelectMenuBuilder()
      .setCustomId('select_rules_info') // <-- deve ser o mesmo do menu principal
      .setPlaceholder('Escolha o conteúdo que deseja visualizar')
      .addOptions([
        {
          label: 'Regras do Servidor',
          value: 'rules_server',
          description: 'Veja as regras gerais do servidor',
          emoji: '📜',
        },
        {
          label: 'Regras do Evrima',
          value: 'info_evrima',
          description: 'Saiba mais sobre o servidor Evrima',
          emoji: '🦖',
        },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.update({ embeds: [embed], components: [row] });
  },
};
