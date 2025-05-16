const pool = require('../utils/db');

exports.getUsuarios = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, nome, email, tipo, ativo, criado_em
      FROM usuarios
      ORDER BY nome
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar usuários:', err);
    res.status(500).json({ erro: 'Erro ao buscar usuários' });
  }
};
