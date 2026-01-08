/\*\*

- PERMISSION_AUDIT.md — Auditoria de Permissões
-
- Este documento lista todos os comandos e suas configurações de permissão.
- Objetivo: Garantir que comandos restritos tenham setDefaultMemberPermissions
- e setDMPermission(false) quando apropriado.
  \*/

# Auditoria de Permissões — Bot Discord

## Categorias de Comandos

### 1. Comandos/Owner/ — Apenas Dono

Estes comandos devem ter **máxima restrição**:

```javascript
.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
.setDMPermission(false) // Não funciona em DM
```

**Comandos:**

- `vercacada.js` — Visualizar caçada (owner-only)
- `limpardb.js` — Limpar banco de dados (owner-only)
- `verdb.js` — Visualizar banco de dados (owner-only)

**Status:** ✅ IMPLEMENTAR

---

### 2. Comandos/Administracao/ — Requerem Moderação

Estes comandos requerem **permissões administrativas**:

```javascript
.setDefaultMemberPermissions(
  PermissionFlagsBits.BanMembers |
  PermissionFlagsBits.KickMembers |
  PermissionFlagsBits.ModerateMembers |
  PermissionFlagsBits.ManageMessages |
  PermissionFlagsBits.ManageRoles
)
.setDMPermission(false)
```

**Listagem:**

| Comando               | Permissão       | DM? | Status |
| --------------------- | --------------- | --- | ------ |
| addcoins.js           | MANAGE_MESSAGES | Não | ❌     |
| adicionarDino.js      | MANAGE_MESSAGES | Não | ❌     |
| antilink.js           | MANAGE_MESSAGES | Não | ❌     |
| anunciar.js           | MANAGE_MESSAGES | Não | ❌     |
| aposta.js             | MANAGE_MESSAGES | Não | ❌     |
| avaliacaostaff.js     | MANAGE_MESSAGES | Não | ❌     |
| ban.js                | BAN_MEMBERS     | Não | ❌     |
| bug.js                | MANAGE_MESSAGES | Não | ❌     |
| caçada.js             | MANAGE_MESSAGES | Não | ❌     |
| cargo_botao.js        | MANAGE_ROLES    | Não | ❌     |
| clear.js              | MANAGE_MESSAGES | Não | ❌     |
| coinsrank.js          | MANAGE_MESSAGES | Não | ❌     |
| consultar.js          | MANAGE_MESSAGES | Não | ❌     |
| conteudo.js           | MANAGE_MESSAGES | Não | ❌     |
| cupom.js              | MANAGE_MESSAGES | Não | ❌     |
| dm.js                 | MANAGE_MESSAGES | Não | ❌     |
| enquete.js            | MANAGE_MESSAGES | Não | ❌     |
| evento.js             | MANAGE_MESSAGES | Não | ❌     |
| finalizaraposta_id.js | MANAGE_MESSAGES | Não | ❌     |
| finalizaraposta.js    | MANAGE_MESSAGES | Não | ❌     |
| formulario.js         | MANAGE_MESSAGES | Não | ❌     |
| infouser.js           | MANAGE_MESSAGES | Não | ❌     |
| inviteslog.js         | MANAGE_MESSAGES | Não | ❌     |
| lock.js               | MANAGE_CHANNELS | Não | ❌     |
| loja.js               | MANAGE_MESSAGES | Não | ❌     |
| ocorrencia.js         | MANAGE_MESSAGES | Não | ❌     |
| painelfixar.js        | MANAGE_MESSAGES | Não | ❌     |
| patrocinio.js         | MANAGE_MESSAGES | Não | ❌     |
| regras.js             | MANAGE_MESSAGES | Não | ❌     |
| relatorio.js          | MANAGE_MESSAGES | Não | ❌     |
| removecoins.js        | MANAGE_MESSAGES | Não | ❌     |
| removerDino.js        | MANAGE_MESSAGES | Não | ❌     |
| removersteamid.js     | MANAGE_MESSAGES | Não | ❌     |
| resetcoins.js         | MANAGE_MESSAGES | Não | ❌     |
| say.js                | MANAGE_MESSAGES | Não | ❌     |
| slot.js               | MANAGE_MESSAGES | Não | ❌     |
| solicitargrow.js      | MANAGE_MESSAGES | Não | ❌     |
| solicitarslay.js      | MANAGE_MESSAGES | Não | ❌     |
| sorteio.js            | MANAGE_MESSAGES | Não | ❌     |
| ticket.js             | MANAGE_MESSAGES | Não | ❌     |
| transcript.js         | MANAGE_MESSAGES | Não | ❌     |
| unban.js              | BAN_MEMBERS     | Não | ❌     |
| unlock.js             | MANAGE_CHANNELS | Não | ❌     |
| updateid.js           | MANAGE_MESSAGES | Não | ❌     |
| valor.js              | MANAGE_MESSAGES | Não | ❌     |
| verificacao.js        | MANAGE_MESSAGES | Não | ❌     |
| verlogs.js            | MANAGE_MESSAGES | Não | ❌     |
| verocorrencia.js      | MANAGE_MESSAGES | Não | ❌     |
| verpasta.js           | MANAGE_MESSAGES | Não | ❌     |

**Status:** ✅ IMPLEMENTAR

---

### 3. Comandos/Utilidade/ — Públicos (Qualquer Usuário)

Estes comandos **NÃO** requerem permissões especiais:

```javascript
.setDMPermission(true) // Funciona em DM
// Sem setDefaultMemberPermissions (padrão = todos)
```

**Comandos:**

- botinfo.js ✅
- callrank.js ✅
- combate.js ✅
- dino.js ✅
- help.js ✅
- ninho.js ✅
- painel.js ✅
- perfil.js ✅
- ping.js ✅
- serverinfo.js — Pode ser público ou restritos a servidor
- sugestao.js ✅
- traduzir.js ✅
- userinfo.js ✅

**Status:** ✅ OK (Públicos)

---

### 4. Comandos/Diversao/ — Públicos

- social.js ✅

---

## Implementação

### Passo 1: Owner Commands (3 arquivos)

```javascript
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vercacada')
    .setDescription('Ver status da caçada')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  async run(client, interaction, clientMongo) {
    // Lógica
  },
};
```

### Passo 2: Admin Commands (41 arquivos)

Para cada comando em `Comandos/Administracao/`:

```javascript
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bane um usuário')
    .setDefaultMemberPermissions(PermissionFlagsBits.BAN_MEMBERS)
    .setDMPermission(false),
  // ... opções do comando
  async run(client, interaction, clientMongo) {
    // Lógica
  },
};
```

### Passo 3: Public Commands (13+ arquivos)

Para cada comando em `Comandos/Utilidade/`:

```javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Verifica latência')
    .setDMPermission(true), // Opcional, mas recomendado para público

  async run(client, interaction, clientMongo) {
    // Lógica
  },
};
```

---

## Permissões Recomendadas por Tipo de Comando

| Tipo          | Permissão       | DM? | Exemplo          |
| ------------- | --------------- | --- | ---------------- |
| Owner         | ADMINISTRATOR   | Não | verdb, limpardb  |
| Moderação     | MANAGE_MESSAGES | Não | ban, kick, clear |
| Gerenciamento | MANAGE_ROLES    | Não | cargo_botao      |
| Canal         | MANAGE_CHANNELS | Não | lock, unlock     |
| Público       | Nenhuma         | Sim | ping, help, dino |
| Sugestão      | Nenhuma         | Sim | sugestao         |

---

## Checklist de Implementação

### Owner Commands (3)

- [ ] vercacada.js
- [ ] limpardb.js
- [ ] verdb.js

### Administracao Commands (41)

**Grupo 1: MANAGE_MESSAGES (35)**

- [ ] addcoins.js
- [ ] adicionarDino.js
- [ ] antilink.js
- [ ] anunciar.js
- [ ] aposta.js
- [ ] avaliacaostaff.js
- [ ] bug.js
- [ ] caçada.js
- [ ] clear.js
- [ ] coinsrank.js
- [ ] consultar.js
- [ ] conteudo.js
- [ ] cupom.js
- [ ] dm.js
- [ ] enquete.js
- [ ] evento.js
- [ ] finalizaraposta_id.js
- [ ] finalizaraposta.js
- [ ] formulario.js
- [ ] infouser.js
- [ ] inviteslog.js
- [ ] loja.js
- [ ] ocorrencia.js
- [ ] painelfixar.js
- [ ] patrocinio.js
- [ ] regras.js
- [ ] relatorio.js
- [ ] removecoins.js
- [ ] removerDino.js
- [ ] removersteamid.js
- [ ] resetcoins.js
- [ ] say.js
- [ ] slot.js
- [ ] solicitargrow.js
- [ ] solicitarslay.js
- [ ] sorteio.js
- [ ] ticket.js
- [ ] transcript.js
- [ ] updateid.js
- [ ] valor.js
- [ ] verificacao.js
- [ ] verlogs.js
- [ ] verocorrencia.js
- [ ] verpasta.js

**Grupo 2: BAN_MEMBERS (2)**

- [ ] ban.js
- [ ] unban.js

**Grupo 3: MANAGE_ROLES (1)**

- [ ] cargo_botao.js

**Grupo 4: MANAGE_CHANNELS (2)**

- [ ] lock.js
- [ ] unlock.js

---

## Resultado Esperado

Após implementação:

- ✅ Todos os comandos admin requerem MANAGE_MESSAGES ou específica
- ✅ Todos os comandos admin têm setDMPermission(false)
- ✅ Owner commands têm máxima restrição (ADMINISTRATOR)
- ✅ Comandos públicos permitem DM
- ✅ Usuários não conseguem invocar comandos restritos sem permissão

---

## Verificação Final

```bash
# Após implementar:
grep -r "setDefaultMemberPermissions" Comandos/Administracao/ | wc -l
# Deve retornar: 41 (ou próximo)

grep -r "setDMPermission(false)" Comandos/Administracao/ | wc -l
# Deve retornar: 41 (ou próximo)

npm run lint
# Deve retornar: 0 errors
```

---

**Última atualização:** 2026-01-08  
**Responsável:** Auditoria de Permissões (Task #5)
