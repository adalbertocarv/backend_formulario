const pool = require('../utils/db');

async function criarPesquisa(pesquisa) {
  // Sanitize arrays para evitar erros
  const problemas = Array.isArray(pesquisa.problemas) ? pesquisa.problemas : [];
  const politicosConhecidos = Array.isArray(pesquisa.politicos_conhecidos) ? pesquisa.politicos_conhecidos : [];

  const res = await pool.query(
    `INSERT INTO pesquisas (
      pesquisador_id, data_hora, latitude, longitude, sexo, idade, renda,
      escolaridade, religiao, satisfacao_servicos, problemas,
      conhece_politicos, confianca, politicos_conhecidos,
      vai_votar, influencia_voto, interesse, opiniao
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11,
      $12, $13, $14,
      $15, $16, $17, $18
    ) RETURNING *`,
    [
      pesquisa.pesquisador_id,
      pesquisa.data_hora,
      pesquisa.latitude,
      pesquisa.longitude,
      pesquisa.sexo,
      pesquisa.idade,
      pesquisa.renda,
      pesquisa.escolaridade,
      pesquisa.religiao,
      pesquisa.satisfacao_servicos,
      problemas,
      pesquisa.conhece_politicos,
      pesquisa.confianca,
      politicosConhecidos,
      pesquisa.vai_votar,
      pesquisa.influencia_voto,
      pesquisa.interesse,
      pesquisa.opiniao
    ]
  );

  return res.rows[0];
}

module.exports = { criarPesquisa };
