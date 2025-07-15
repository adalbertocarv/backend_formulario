const pool = require('../utils/db');

async function listarPerguntas(req, res) {
  const versao = parseInt(req.query.versao) || 3;

  const { rows } = await pool.query(
    `SELECT p.id, p.ordem, p.texto, p.tipo, p.obrigatoria,
            json_agg(json_build_object('id', o.id, 'rotulo', o.rotulo, 'valor', o.valor)) AS opcoes
     FROM perguntas p
     LEFT JOIN opcoes o ON o.pergunta = p.id
     WHERE p.versao = $1
     GROUP BY p.id
     ORDER BY p.ordem`,
    [versao]
  );

  const perguntas = rows.map(p => ({
    id: p.id,
    ordem: p.ordem,
    texto: p.texto,
    tipo: p.tipo,
    obrigatoria: p.obrigatoria,
    opcoes: p.opcoes.filter(o => o.id !== null) // remove nulls se não houver opções
  }));

  res.json(perguntas);
}

module.exports = { listarPerguntas };
