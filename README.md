# 🦖 Projeto Genoma — Bot Discord

Um bot Discord profissional, modular e escalável para gerenciamento de servidores, economia de coins, gamificação com dinossauros e muito mais.

## 📋 Características Principais

- **Sistema de Economia**: Coins, transações seguras, rankings
- **Gamificação**: Dinossauros (combate, ninho, caçada), achievements
- **Administração**: Tickets, banimentos, logs, avisos, moderação
- **Painel Web**: Gerenciamento de configurações por servidor (planejamento)
- **Banco de Dados**: MongoDB com Winston logging
- **Qualidade de Código**: ESLint + Prettier, testes, error handling central

---

## 🚀 Setup e Execução

### Pré-requisitos

- **Node.js** >= 16.x
- **npm** >= 8.x
- **MongoDB** (local ou cloud, ex: MongoDB Atlas)
- **Discord Bot Token** (criar em [Discord Developer Portal](https://discord.com/developers/applications))

### 1. Instalação

```bash
# Clone o repositório
git clone <seu-repositorio>
cd bot

# Instale as dependências
npm install
```

### 2. Configuração de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite .env com suas credenciais
nano .env
```

**Variáveis de Ambiente Obrigatórias:**

```env
DISCORD_TOKEN=seu_token_aqui
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/dbname
PREFIX=!
OWNER_ID=seu_id_discord
```

**Variáveis Opcionais:**

```env
LOG_LEVEL=info
LOG_CHANNEL_TRANSCRIPT=channel_id
LOG_CHANNEL_LIMPARDATABASE=channel_id
CANAL_VERIFICACAO=channel_id
STAFF_ROLE_ID=role_id
```

### 3. Executar o Bot

```bash
# Desenvolvimento (com reload automático via nodemon)
npm run dev

# Produção
npm start
```

O bot aparecerá como online no seu servidor Discord.

---

## 📁 Estrutura do Projeto

```
bot/
├── Comandos/                 # Todos os comandos slash
│   ├── Administracao/       # Moderação, tickets, logs
│   ├── Diversao/            # Sociais, entretenimento
│   ├── Owner/               # Apenas dono do bot
│   └── Utilidade/           # Info, perfil, help
├── Interactions/             # Buttons, Modals, SelectMenus
├── Events/                   # Event listeners (ready, messageCreate, etc)
├── database/                 # MongoDB collections, schemas
├── Jobs/                     # Tarefas agendadas, utilitários
├── Loja/                     # Sistema de loja
├── Utils/                    # Utilitários compartilhados
│   ├── logger.js            # Winston logging
│   ├── config.js            # Configuração centralizada
│   ├── errorHandler.js      # Error handling
│   └── ...
├── handler/                  # Carregadores de comandos/eventos
├── index.js                  # Entrada principal
├── COMMANDS.json            # Inventário gerado de comandos
└── COMMANDS.md              # Documentação de comandos
```

---

## 📖 Documentação de Comandos

Uma lista completa de todos os comandos está em [COMMANDS.md](./COMMANDS.md).

**Exemplos:**

- `/help` — Central de ajuda com categorias
- `/perfil` — Ver perfil de um usuário
- `/combate` — Simular combate entre dinossauros
- `/ticket` — Abrir ticket de suporte

---

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia com nodemon (reload automático)
npm start               # Inicia normalmente
npm run format          # Formata código com Prettier
npm run lint            # Verifica ESLint
npm run lint:fix        # Corrige ESLint automaticamente

# Geração
npm run commands        # Regenera COMMANDS.json e COMMANDS.md
```

---

## 🏗️ Arquitetura

### Padrão de Comando

Todos os comandos seguem este padrão:

```javascript
const { SlashCommandBuilder } = require('discord.js');
const { logError } = require('../../Utils/logger');

module.exports = {
  data: new SlashCommandBuilder().setName('exemplo').setDescription('Descrição do comando'),

  async run(client, interaction, clientMongo) {
    try {
      // Lógica aqui
      await interaction.reply('Sucesso!');
    } catch (err) {
      logError('Erro no comando exemplo:', err);
      await interaction.reply({ content: '❌ Erro interno', ephemeral: true });
    }
  },
};
```

### Logger Winston

```javascript
const { logError, logWarn, logInfo, logger } = require('../Utils/logger');

logError('Erro crítico', error); // ❌ Red
logWarn('Aviso', message); // ⚠️  Yellow
logInfo('Info', message); // ℹ️  Blue
```

Logs são salvos em:

- `logs/error.log` — Apenas erros
- `logs/combined.log` — Todos os níveis

---

## 🗄️ MongoDB Modelos

### Collections Principais

- **userData** — Dados de usuários (coins, tempo em call, steam ID)
- **DataBase** — Dados globais (server config, settings)
- **Dinossauros** — Catálogo de dinossauros (stats, descrição)
- **Apostas** — Registro de apostas ativas
- **Tickets** — Sistema de tickets

---

## 🤝 Contribuindo

1. **Fork** o repositório
2. **Crie uma branch** para sua feature (`git checkout -b feature/MinhaFeature`)
3. **Commit** suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. **Push** para a branch (`git push origin feature/MinhaFeature`)
5. **Abra um Pull Request**

### Padrão de Código

- Use ESLint + Prettier (rodar `npm run format`)
- Prefixe variáveis não usadas com `_` (ex: `_clientMongo`)
- Sempre lide com erros com try/catch e use `logError`
- Sempre retorne `ephemeral: true` para mensagens de erro sensíveis

---

## 📝 Licença

MIT License — Veja [LICENSE](./LICENSE) para detalhes.

---

## 🆘 Suporte

- **Issues**: [GitHub Issues](https://github.com/seu-user/bot/issues)
- **Discord**: Entre em contato com o dono do bot

---

## 📊 Status

| Tarefa                  | Status       | Nota                                      |
| ----------------------- | ------------ | ----------------------------------------- |
| Refatoração de Comandos | ✅ Concluído | Todos os 4 grupos refatorados             |
| Logger Winston          | ✅ Concluído | Integrado em comandos                     |
| ESLint + Prettier       | ✅ Concluído | 54 problemas restantes (maioria warnings) |
| Error Handler           | ✅ Concluído | Integrado em loadInteractions             |
| README.md               | ✅ Concluído | Este arquivo                              |
| MongoDB Docs            | ⏳ Planejado | Próximo passo                             |
| Sentry Integration      | ⏳ Planejado | Observabilidade                           |

---

**Última atualização:** 2026-01-08  
**Versão:** 1.0.0 (Beta)
