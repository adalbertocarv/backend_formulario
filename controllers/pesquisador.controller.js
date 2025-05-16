const pool = require('../utils/db');

exports.getPesquisadores = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT pe.*, u.nome, u.email
      FROM pesquisadores pe
      JOIN usuarios u ON pe.usuario_id = u.id
      ORDER BY u.nome
    `);

    const pesquisadores = result.rows.map(row => ({
      ...row,
      usuario: {
        nome: row.nome,
        email: row.email
      }
    }));

    res.json(pesquisadores);
  } catch (err) {
    console.error('Erro ao buscar pesquisadores:', err);
    res.status(500).json({ erro: 'Erro ao buscar pesquisadores' });
  }
};
