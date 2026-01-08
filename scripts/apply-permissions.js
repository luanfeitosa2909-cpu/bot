#!/usr/bin/env node

/**
 * apply-permissions.js
 * Script para aplicar setDefaultMemberPermissions e setDMPermission(false)
 * a todos os comandos de administração.
 *
 * Uso: node scripts/apply-permissions.js
 */

const fs = require('fs');
const path = require('path');

const ADMIN_FOLDER = path.join(__dirname, '../Comandos/Administracao');

// Mapeamento de comandos para permissões
const permissionMap = {
  // BAN_MEMBERS
  'ban.js': 'BanMembers',
  'unban.js': 'BanMembers',

  // MANAGE_CHANNELS
  'lock.js': 'ManageChannels',
  'unlock.js': 'ManageChannels',

  // MANAGE_ROLES
  'cargo_botao.js': 'ManageRoles',

  // MANAGE_MESSAGES (padrão para resto)
};

const DEFAULT_PERMISSION = 'ManageMessages';

function getPermissionForFile(filename) {
  return permissionMap[filename] || DEFAULT_PERMISSION;
}

function addPermissionsToFile(filePath) {
  const filename = path.basename(filePath);
  const content = fs.readFileSync(filePath, 'utf8');

  // Skip se já tem setDMPermission
  if (content.includes('.setDMPermission')) {
    console.log(`✅ ${filename} — já tem permissões`);
    return false;
  }

  // Procura por SlashCommandBuilder
  if (!content.includes('new SlashCommandBuilder()')) {
    console.log(`⚠️  ${filename} — não é SlashCommandBuilder`);
    return false;
  }

  const permission = getPermissionForFile(filename);
  const permBit = `PermissionFlagsBits.${permission}`;

  // Importar PermissionFlagsBits se não tiver
  let newContent = content;

  if (!content.includes('PermissionFlagsBits')) {
    // Adicionar à primeira linha com require('discord.js')
    newContent = newContent.replace(
      /const { (.*) } = require\('discord\.js'\);/,
      (match, imports) => {
        if (!imports.includes('PermissionFlagsBits')) {
          return `const { ${imports}, PermissionFlagsBits } = require('discord.js');`;
        }
        return match;
      }
    );
  }

  // Adicionar .setDefaultMemberPermissions e .setDMPermission antes do fechamento do data
  // Procura por padrões: .setDescription(...) seguido de .setDefaultMemberPermissions ou fim do .data
  newContent = newContent.replace(
    /\.setDescription\((.*?)\)([\s\S]*?)(?=,\s*async\s+run|,\s*run|,\s*\/\/ )/,
    (match, desc, rest) => {
      // Se já tem setDefaultMemberPermissions, retorna sem modificar
      if (rest.includes('.setDefaultMemberPermissions')) {
        return match;
      }
      // Adiciona no final de rest, antes da vírgula do module.exports
      return (
        `.setDescription(${desc})` +
        rest +
        `\n    .setDefaultMemberPermissions(${permBit})\n    .setDMPermission(false)`
      );
    }
  );

  // Salva o arquivo
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`✅ ${filename} — adicionado ${permission}`);
  return true;
}

function main() {
  const files = fs.readdirSync(ADMIN_FOLDER).filter(f => f.endsWith('.js'));

  let updated = 0;
  let skipped = 0;

  files.forEach(file => {
    const filePath = path.join(ADMIN_FOLDER, file);
    if (addPermissionsToFile(filePath)) {
      updated++;
    } else {
      skipped++;
    }
  });

  console.log(`\n📊 Resultado: ${updated} atualizados, ${skipped} ignorados`);
}

main();
