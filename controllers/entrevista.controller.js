const pool = require('../utils/db');

async function salvarEntrevista(req, res) {
  const { versao, latitude, longitude, respostas } = req.body;
  const pesquisador_id = req.usuario.id;

  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    const { rows } = await cliente.query(
      `INSERT INTO entrevistas (id, pesquisador_id, inicio_em, fim_em, localizacao, versao)
       VALUES (gen_random_uuid(), $1, now(), now(),
               ST_SetSRID(ST_MakePoint($2, $3), 4326), $4)
       RETURNING id`,
      [pesquisador_id, longitude, latitude, versao]
    );

    const entrevista_id = rows[0].id;

    for (const r of respostas) {
      await cliente.query(
        `INSERT INTO respostas (entrevista_id, pergunta_id, opcao_id, resposta)
         VALUES ($1, $2, $3, $4)`,
        [entrevista_id, r.pergunta_id, r.opcao_id || null, r.resposta || null]
      );
    }

    await cliente.query('COMMIT');
    res.status(201).json({ status: 'ok', id: entrevista_id });

  } catch (e) {
    await cliente.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ erro: 'Erro ao salvar' });
  } finally {
    cliente.release();
  }
}

module.exports = { salvarEntrevista };
