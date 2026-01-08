const { Client } = require('ssh2');

const conn = new Client();
let ready = false;
let connecting = false;

conn.on('ready', () => {
  ready = true;
  connecting = false;
  console.log('[SSH] 🟢 Conectado com sucesso');
});

conn.on('error', err => {
  ready = false;
  connecting = false;
  console.error('[SSH] ❌ Erro de conexão:', err.message);
});

conn.on('close', () => {
  ready = false;
  connecting = false;
  console.log('[SSH] 🔴 Conexão encerrada');
});

function connect() {
  if (ready || connecting) return;

  connecting = true;

  conn.connect({
    host: '69.62.92.99',
    port: 22,
    username: 'root',
    password: '9955244123Gold#',
  });
}

/* =======================
   EXEC SIMPLES (snapshot)
======================= */
function execCommand(command) {
  return new Promise((resolve, reject) => {
    if (!ready) return reject(new Error('Conexão SSH não está pronta'));

    conn.exec(command, (err, stream) => {
      if (err) return reject(err);

      let output = '';
      let error = '';

      stream.on('data', data => (output += data.toString()));
      stream.stderr.on('data', data => (error += data.toString()));

      stream.on('close', () => {
        if (error) reject(new Error(error));
        else resolve(output);
      });
    });
  });
}

/* =======================
   EXEC STREAM (REALTIME)
======================= */
function execStream(command) {
  return new Promise((resolve, reject) => {
    if (!ready) return reject(new Error('Conexão SSH não está pronta'));

    conn.exec(command, (err, stream) => {
      if (err) return reject(err);
      resolve(stream); // NÃO espera close
    });
  });
}

/* =======================
   AUTO CONNECT
======================= */
connect();

module.exports = {
  execCommand,
  execStream,
};
