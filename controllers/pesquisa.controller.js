const pool = require('../utils/db');
const { criarPesquisa } = require('../models/pesquisa.model'); 

async function enviarPesquisa(req, res) {
  try {
    const resultado = await pool.query(
      'SELECT id FROM pesquisadores WHERE usuario_id = $1',
      [req.usuario.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(403).json({ erro: 'Usuário não autorizado (sem pesquisador vinculado)' });
    }

    const pesquisador_id = resultado.rows[0].id;
    const dados = { ...req.body, pesquisador_id };
    const nova = await criarPesquisa(dados);

    res.status(201).json(nova);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao salvar a pesquisa' });
  }
}

module.exports = { enviarPesquisa };
