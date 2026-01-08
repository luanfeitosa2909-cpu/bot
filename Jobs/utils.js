function parseLines(lines) {
  const out = {
    raw: [],
    events: [],
  };

  let killBuffer = [];

  for (const line of lines) {
    if (!line || typeof line !== 'string') continue;

    // início de kill (multiline)
    if (line.includes('LogTheIsleKillData')) {
      killBuffer = [line];
      continue;
    }

    // continuação de kill
    if (killBuffer.length) {
      killBuffer.push(line);

      if (line.includes('at: X=')) {
        out.events.push(killBuffer.join(' '));
        killBuffer = [];
      }
      continue;
    }

    // eventos normais (1 linha)
    out.events.push(line);
  }

  return out;
}

module.exports = { parseLines };
