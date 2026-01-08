const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

module.exports = {
  customId: 'select_rules_info',
  type: 'select',
  run: async (client, interaction) => {
    const choice = interaction.values[0];
    const guild = interaction.guild;
    const icon = guild?.iconURL({ dynamic: true, size: 512 }) || client.user.displayAvatarURL();

    let embed;
    const rowButtons = new ActionRowBuilder();

    if (choice === 'rules_server') {
      embed = new EmbedBuilder()
        .setTitle('📜 Regras do Servidor Discord')
        .setColor('Red')
        .setDescription(
          [
            '**Regra 1:** Respeite todos os membros do servidor. Sem insultos, racismo, sexismo, homofobia, transfobia e outros discursos discriminatórios.',
            '',
            '**Regra 2:** Não permitimos imagens, áudios, nicknames, fotos de perfil ou qualquer outra coisa relacionada a conteúdos 18+ (pornografia, hentai etc).',
            '',
            '**Regra 3:** Sem spam/flood e não polua os canais de texto com menções.',
            '',
            '**Regra 4:** É proibido divulgar ou citar outros servidores de The Isle, enviar convites para outros servidores de Discord, links desconhecidos e/ou sites maliciosos.',
            '',
            '**Regra 5:** Não mencione a Staff/Admins e nem qualquer membro à toa.',
            '',
            '**Regra 6:** É proibido compartilhar informações pessoais sem consentimento.',
            '',
            '**Regra 7:** Apenas entre nas calls do dinossauro que você está jogando.',
            '',
            '**Regra 8:** O apelido dos membros neste Discord deve ser igual ao nome da conta no jogo (Steam).',
            '',
            '**Regra 9:** Se presenciar uma quebra de regra in-game, avise no chat global. Caso não vejam/ignorem sua mensagem, chame um staff.',
            '',
            '**Regra 10:** É proibido fazer acusações falsas.',
            '',
            '**VOLTE AO MENU CLICANDO AQUI EMBAIXO!**',
          ].join('\n')
        );
    } else if (choice === 'info_evrima') {
      embed = new EmbedBuilder()
        .setTitle('🦖 Regras & Dicas Evrima')
        .setColor('Green')
        .setDescription(
          [
            'Bem-vindo às **Regras & Dicas do Evrima**!',
            '',
            'Este painel está dividido em **4 páginas**:',
            '',
            '📄 **Página 1 - Regras Gerais**',
            '• Conduta geral dos jogadores',
            '• Comportamentos proibidos',
            '• Regras sobre grupos e filhotes',
            '',
            '⚔️ **Página 2 - Regras de Combate**',
            '• Engages (combates)',
            '• Regras específicas de luta',
            '• Dinossauros territoriais e emboscadas',
            '',
            '🌿 **Página 3 - Disputa por Comida**',
            '• Disputas entre herbívoros/onívoros',
            '• Passo a passo para iniciar um confronto por plantas',
            '',
            '🦴 **Página 4 - Caça, Carcaças e Chat**',
            '• Regras de caça e carcaça',
            '• Conduta no chat global',
            '',
            'Clique em uma das páginas abaixo para começar a leitura!',
          ].join('\n')
        );

      rowButtons.addComponents(
        new ButtonBuilder()
          .setCustomId('evrima_page_1')
          .setLabel('📄 Página 1')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('evrima_page_2')
          .setLabel('⚔️ Página 2')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('evrima_page_3')
          .setLabel('🌿 Página 3')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('evrima_page_4')
          .setLabel('🦴 Página 4')
          .setStyle(ButtonStyle.Primary)
      );
    } else if (choice === 'back_to_main') {
      // Mensagem inicial igual ao botão abrir_menu_regras
      embed = new EmbedBuilder()
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
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId('select_rules_info')
      .setPlaceholder('Você pode voltar ao menu aqui')
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
        {
          label: 'Voltar ao Menu',
          value: 'back_to_main',
          description: 'Retorna ao painel principal com todas as instruções',
          emoji: '📚',
        },
      ]);

    const rowSelect = new ActionRowBuilder().addComponents(menu);
    const components = [rowSelect];
    if (rowButtons.components.length > 0) components.push(rowButtons);

    await interaction.update({ embeds: [embed], components });
  },
};
