const fs = require('fs');
const path = require('path');

const commandsDir = path.join(__dirname, '..', 'Comandos');
const outJson = path.join(__dirname, '..', 'COMMANDS.json');
const outMd = path.join(__dirname, '..', 'COMMANDS.md');

function walk(dir) {
  const res = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) res.push(...walk(full));
    else if (f.endsWith('.js')) res.push(full);
  }
  return res;
}

function extract(content, regex) {
  const m = regex.exec(content);
  return m ? m[1].trim() : null;
}

const files = walk(commandsDir);
const items = [];

for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8');
  // try various patterns
  let name =
    extract(raw, /\.setName\(\s*['"`](.*?)['"`]\s*\)/i) ||
    extract(raw, /name\s*:\s*['"`](.*?)['"`]/i) ||
    extract(raw, /\.name\s*=\s*['"`](.*?)['"`]/i) ||
    path.basename(file, '.js');

  let description =
    extract(raw, /\.setDescription\(\s*['"`](.*?)['"`]\s*\)/i) ||
    extract(raw, /description\s*:\s*['"`](.*?)['"`]/i) ||
    '';

  const rel = path.relative(path.join(__dirname, '..'), file);
  items.push({ name, description, path: rel });
}

fs.writeFileSync(outJson, JSON.stringify(items, null, 2), 'utf8');

// Generate simple MD table
const lines = ['# Inventário de Comandos', '', '| Nome | Descrição | Caminho |', '|---|---|---|'];
for (const it of items) {
  lines.push(`| ${it.name || '-'} | ${it.description || '-'} | ${it.path} |`);
}

fs.writeFileSync(outMd, lines.join('\n'), 'utf8');
console.log('Gerado', outJson, 'e', outMd);
