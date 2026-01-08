const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const pages = {
  evrima_page_1: {
    title: '📄 Regras Evrima - Página 1/4',
    color: 'Green',
    description: `📜 **REGRAS GERAIS**

🔸 **1. Proibido Mix-Packing!**
*Mix-packing é quando espécies diferentes de dinossauros se ajudam e andam juntos.*
▫️ a. Não pode andar próximo ou ajudar espécies diferentes em combate. Quando isso acontecer, os grupos devem se separar;
▫️ b. Espécies permitidas: *Beipi com Deino; Hypsi*, *Dryo com qualquer herbívoro*; *Troodon com qualquer carnívoro*; (O grupo que esta em mix, não pode participar de manadas);
▫️ c. Troodon só pode ficar em grupo com outro carnívoro para suprir a quantidade de membros do grupo.
*Exemplo: em um grupo de ceratos que tiver 2 membros, só poderá ter 3 troodons; se tiver 3 ceratos, só poderá 1 troodon; e assim por diante...*
▫️ d. Mesmo com espécies permitidas, o Mix-packing não garante imunidade. Elas estão sujeitas a serem expulsas ou caçadas, dependendo da situação.
▫️ e. Todo e qualquer Mix-packing deve estar em suas calls correspondentes. Ex.: Mix Beipi/Deino; Mix Hypsi/Dryo/Herb...

🔸 **2. Proibido Over-Packing!**
*Over-packing é quando indivíduos da mesma espécie colaboram e convivem juntos, quando se excede o número do grupo permitido.*
▫️ a. As mesmas espécies não podem andar e colaborar juntas se já excedeu a quantidade de indivíduos no grupo. Por exemplo: um grupo de diablo comporta 5 indivíduos, o 6º (sexto) indivíduo deve se afastar e ser expulso do grupo.
▫️ b. Só é permitido o Over-packing para Deino. Mas ainda assim, quando houver engage, os grupos devem se separar e não podem se ajudar.

🔸 **3. Proibido uso de trapaças.**
▫️ a. Hacks, cheats, exploits e similares resultam em strike 3 ou ban;
▫️ b. Metagaming (usar informações externas) também é trapaça.

📌 **Integridade é prioridade. Abusos serão investigados e punidos.**

🔸 **3. Herbívoros e Onívoros podem atacar sem ameaça prévia.**
▫️ a. Podem atacar carnívoros que estão no seu campo de visão em seu território;
▫️ b. **No entanto**, herbívoros não caçam outros herbívoros ou carnívoros. Eles somente podem perseguir para afastar, ou se estiver perto para matar.
▫️ c. Podem atacar os carnívoros que estiverem perto de seus ninhos e filhotes;
▫️ d. Não pode bloquear carcaças propositalmente;
▫️ e. Disputas por bioma, vide a regra FONTES DE COMIDA da Página 3.

🔸 **4. Herbívoros e Onívoros diferentes podem andar juntos, mas não se ajudar em combate.**
▫️ a. Ajudar = Mix-Packing (ver regra 1);
▫️ b. Grupos devem ser visivelmente separados;
▫️ c. Em combate, grupos próximos devem se afastar.

📌 **Proibido usar outros como escudo. Se insistirem, ataque para evitar punição.**
*Permitido somente para filhotes.*

🔸 **5. Filhotes de ninho.**
▫️ a. Caso não tenha atingido o número máximo de indivíduos por grupo, os filhotes podem ficar no grupo. Mas se já atingiu o limite máximo, eles podem ficar no grupo até conseguirem comer sozinhos, depois disso, devem ser expulsos e seguir sozinhos ou em um novo grupo;
▫️ b. Donos de ninho podem ser agressivos;
▫️ c. No drop de carcaça perto de ninho de herbívoros, os carnívoros devem carregar a carcaça para longe;
▫️ d. Caso o item acima não seja possível, herbívoros devem ceder espaço para carnívoros comerem carcaça próxima ao ninho;
▫️ e. Carnívoros devem escolher entre defender ou liberar carcaça.

🔸 **6. Proibido atacar/eliminar membros do próprio grupo (exceto canibais).**
▫️ a. Caso um indivíduo saia do grupo, os outros do grupo não devem atacá-lo até 1 minuto, se ele estiver sendo ameaçado a sair.

🔸 **7. Proibido bloquear passagens ou forçar lutas.**

🔸 **8. Proibido deslogar durante combate.**

🔸 **9. É *estritamente* proibido caçar por esporte! Toda caça deve ser para se alimentar ou para se defender e somente.**

🔸 **10. Proibido iniciar engage nos últimos 5 minutos antes do restart.**
*Combates iniciados antes disso podem continuar.*`,
  },

  evrima_page_2: {
    title: '⚔️ Regras de Combate - Página 2/4',
    color: 'Green',
    description: `⚔️ **COMBATE**

🔸 **1. Proibido interferir em combate de outros!**
▫️ a. Espere o combate terminar. Um novo engage com o grupo visto, deve acontecer somente após 1 minuto para carnivoro e 5 minutos para herbivoro; (se caso houver drop de CC) tempo de safe exceto para DEINOS e HERREIRAS. Eles podem atacar sem esperar o tempo.
▫️ b. Caso o grupo que foi atacado, continuar ameaçando e provocando após o término do engage, pode desconsiderar o 1 minuto de espera;
▫️ c. Aproximar-se permite que te ataquem.
▫️ d. Se não houver drop de CC não tem tempo safe. (após identificar o término do engage)

🔸 **2. Deinosuchus só pode interferir se o animal estiver na margem d'água.**
▫️ a. Mesmo em engage alheio, pode atacar qualquer um bebendo ou com pés na água;
▫️ b. Caso algum dino atravesse a água para trocar de posição estará sujeito a ser agarrado por um Deino ou mais;
▫️ c. Porém, o Deino não pode interferir em combates entre semi-aquáticos.

🔸 **3. Herrera só pode interferir no engage, se ele for atacar de uma árvore ou de uma pedra.**
▫️ a. Se o Herrera estiver em terra, ele não poderá interferir em engage.

📌 **Após a fuga, o jogador pode ser atacado por outros.**
*• Somente se estes outros não souberem do engage anterior. Caso saibam, aplica-se a regra 1, item a, desta mesma página.*
 
🔸 **3. Proibido negar carcaça indo para lugares inacessíveis.**
*Exemplo: entrar em água funda e não sair de lá (não atravessar ou não voltar) até que o carnívoro terrestre desista.*

🔸 **4. Um grupo não pode estar em dois engages ao mesmo tempo.**

🔸 **5. Combates sem disputa seguem até morte ou fuga.**
*Pedido de desistência é opcional.*

🔸 **6. Gallimimus, Beipi e carnívoros podem atacar ninhos para comer ovos.**
▫️ a. No entanto, não se pode atacar o ninho caso os donos do ninho estiverem em um engage. 

🔸 **7. Engage inicia ao perseguir, cercar, ameaçar ou atacar.**
▫️ a. Não precisa atacar para estar em combate;
▫️ b. Não precisa de ameaça para entrar em combate.

🔸 **8. Beipiaossauros podem defender lagos/riachos.**
▫️ a. Ataque permitido só com o Beipi dentro da água;
▫️ b. O invasor deve sair e enviar 4 para parar o combate. E a desistência/submissão deve ser respeitada;
▫️ c. Proibido interferir em outro engage.

🔸 **9. Comer durante combate é permitido (mas é arriscado).**

🔸 **10. Herrera e Deino podem usar carcaças para emboscada.**
*A carcaça da emboscada também pertence a quem armou.*

🔸 **11. Proibido vingança!**
*Vingança: após morrer para um dinossauro, você spawna com o mesmo dinossauro ou outro dinossauro, e voltar na localização em que o dinossauro que te matou está e atacá-lo novamente para matá-lo.*
▫️ a. Sendo você mesmo que morreu ou um indivíduo de seu grupo, é estritamente proibido realizar vingança.

🔸 **12. Proibido perseguição de player!**
*Quando há perseguição por um player, não importando o dinossauro em que este player está usando.*`,
  },

  evrima_page_3: {
    title: '🌿 Disputa por Comida - Página 3/4',
    color: 'Green',
    description: `🥕 **DISPUTA POR COMIDA (HERBÍVOROS E ONÍVOROS)**

🔹 Caso os grupos chegarem ao mesmo tempo em um bioma, evite conflitos no primeiro momento.
🔹 Prefira revezar ou dividir — priorize o roleplay e bom senso.
🔹 Onívoros podem compartilhar os alimentos herbívoros com outros dinossauros herbívoros menores.

🌿 **FONTES DE COMIDA**
🔸 Disputa existe quando 2+ grupos se aproximam ao mesmo tempo.
🔸 O primeiro a chegar tem prioridade, mas deve revezar quando possível.
🔸 Também terá a opção de desafio pela comida, onde os líderes dos grupos disputam até a desistência 4 (opcional), mas sem mortes.
*• O desistente deve sair imediatamente do local. Caso não saia, estará sujeito a continuar a ser atacado.*
*• O vencedor deve respeitar a aguardar a saída do desistente. Caso ele insista, pode atacá-lo novamente, como aviso, mas não deve matá-lo.*

💧 **FONTES DE ÁGUA**
🔸 São livres, mas bloqueios agressivos podem gerar combate;
🔸 Ataque só se houver tentativa clara de bloqueio.

📌 **Evite PvP desnecessário por bioma** — respeite o ambiente e os outros. 
`,
  },

  evrima_page_4: {
    title: '🦴 Caça, Carcaças e Chat - Página 4/4',
    color: 'Green',
    description: `🦴 **CAÇA E CARCAÇAS**

🔸 O último a dar o killing blow tem direito à carcaça.

🔸 Espere o outro jogador sair da carcaça para comer.

🔸 Após uma briga, o grupo vencedor só pode ser atacado novamente 2 minutos após a morte do dinossauro ou após a desistência do oponente, para poder se recuperar ou fugir.

🔸 Quando uma carcaça cair, você tem 1 minuto safe para que, carnívoros em volta, não disputem sua carcaça. Após este tempo, eles estarão livres para disputar.
*A disputa pela carcaça deve ocorrer até a desistência 4 ou quando houver afastamento. Se o dono da carcaça aceitar o desafio, a disputa será até a morte.

🔸 Você deve comer a carcaça até a ossada. Por isso, cace dinossauros que estão em sua dieta para evitar matanças.
*O 1 minuto de safe valem apenas para não te atacarem pela carcaça, mas após esse 1 minuto, estará sujeito a ser atacado.*

🔸 A carcaça só poderá ser abandonada, no ÚNICO CASO em que o carnívoro matou o oponente por defesa.
*Assim, ele não é obrigado a ficar em uma carcaça que ele mesmo não caçou, mas é uma grande oportunidade para se alimentar.*

🔸 Proibido trap kill para atrair jogadores.

🔸 Você não pode caçar **somente** para fazer emboscadas. Deve se alimentar da carcaça e, quando estiver acabando ou acabarem os órgãos, você pode usá-la para emboscadas.

🔸 Caso tenha conseguido mais uma carcaça por emboscada, deve se alimentar das duas. Por isso, gerencie bem o tempo da carcaça usada em emboscada.

💬 **REGRAS DE CHAT (NO JOGO)**

🔹 Proibido: ofensas, racismo, xenofobia e qualquer tipo de preconceito.
🔹 Evite spam no chat global — use com moderação.
🔹 Denúncias? Use o ticket no Discord.
🔹 Proibido dar call de posição após morrer.
🔹 É proibido passar localização de outros players. Você só pode passar a sua própria localização, por sua conta e risco.

📌 ***Regras garantem uma experiência justa e imersiva para todos.*** 
`,
  },
};

module.exports = {
  customId: /^evrima_page_\d$/,
  match: id => /^evrima_page_\d$/.test(id), // <- ESSENCIAL para funcionar!
  type: 'button',
  run: async (client, interaction) => {
    const pageId = interaction.customId;
    const page = pages[pageId];
    if (!page) return;

    const pageNum = parseInt(pageId.split('_')[2]);

    const embed = new EmbedBuilder()
      .setTitle(page.title)
      .setColor(page.color)
      .setDescription(page.description);

    const row = new ActionRowBuilder().addComponents(
      ...(pageNum > 1
        ? [
            new ButtonBuilder()
              .setCustomId(`evrima_page_${pageNum - 1}`)
              .setLabel('⬅️ Página Anterior')
              .setStyle(ButtonStyle.Secondary),
          ]
        : []),
      ...(pageNum < 4
        ? [
            new ButtonBuilder()
              .setCustomId(`evrima_page_${pageNum + 1}`)
              .setLabel('➡️ Próxima Página')
              .setStyle(ButtonStyle.Primary),
          ]
        : []),
      new ButtonBuilder()
        .setCustomId('evrima_back_to_menu')
        .setLabel('📚 Voltar ao Menu')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.update({ embeds: [embed], components: [row] });
  },
};
