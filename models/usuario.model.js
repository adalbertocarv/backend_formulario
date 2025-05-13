const pool = require('../utils/db');

async function encontrarUsuarioPorEmail(email) {
  const res = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
  return res.rows[0];
}

async function criarUsuario({ nome, email, senhaHash }) {
  const res = await pool.query(
    `INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING *`,
    [nome, email, senhaHash]
  );
  return res.rows[0];
}

module.exports = { encontrarUsuarioPorEmail, criarUsuario };
