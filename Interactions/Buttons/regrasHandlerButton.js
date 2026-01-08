const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../../Utils/logger');

module.exports = {
  type: 'button',
  customId: 'abrir_menu_regras',
  async run(client, interaction) {
    try {
      const guild = interaction.guild;
      const icon = guild?.iconURL({ dynamic: true, size: 512 }) || client.user.displayAvatarURL();

      const embed = new EmbedBuilder()
        .setTitle(`📚 Regras e Informações do ${interaction.guild.name}`)
        .setColor('Blurple')
        .setThumbnail(icon)
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
        )
        .setFooter({
          text: `${interaction.guild.name} • Sistema de Regras`,
          iconURL: client.user.displayAvatarURL(),
        })
        .setTimestamp();

      const menu = new StringSelectMenuBuilder()
        .setCustomId('select_rules_info')
        .setPlaceholder('Escolha o conteúdo que deseja visualizar')
        .addOptions([
          {
            label: 'Regras do Servidor',
            value: 'rules_server',
            description: 'Normas de convivência e uso do Discord',
            emoji: '📜',
          },
          {
            label: 'Regras do Evrima',
            value: 'info_evrima',
            description: 'Diretrizes e mecânicas no servidor The Isle',
            emoji: '🦖',
          },
        ]);

      const row = new ActionRowBuilder().addComponents(menu);

      await interaction.reply({
        embeds: [embed],
        components: [row],
        flags: 1 << 6,
      });
    } catch (err) {
      logger.logError('Erro ao processar botão abrir_menu_regras:', err);
      if (!interaction.replied) {
        await interaction.reply({
          content: '❌ Ocorreu um erro ao abrir o painel de regras.',
          flags: 1 << 6,
        });
      }
    }
  },
};
