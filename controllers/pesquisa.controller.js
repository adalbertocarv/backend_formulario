/**
 * Estrutura esperada no body para POST /pesquisas
 * {
 *   versao      : 3,                       // (int)  versão do questionário
 *   localizacao : { lat: -15.8, lng: -47 },// (opcional)
 *   respostas   : [                        // (array) uma entrada por pergunta respondida
 *     { perguntaId: 1, opcaoId: 2 },       //   escolha única
 *     { perguntaId: 2, resposta: 43 },     //   inteiro / texto
 *     ...
 *   ]
 * }
 */

const pool = require('../utils/db');

// ─────────────────────────────────────────────────────────────────────────────
// POST /pesquisas  →  grava entrevista + respostas
// ─────────────────────────────────────────────────────────────────────────────
async function enviarPesquisa(req, res) {
  const client = await pool.connect();
  try {
    // 🔐 1. verifica se o usuário é um pesquisador válido
    const { rows } = await client.query(
      'SELECT id FROM pesquisadores WHERE usuario_id = $1',
      [req.usuario.id]
    );
    if (!rows.length) {
      return res
        .status(403)
        .json({ erro: 'Usuário não autorizado (sem pesquisador vinculado)' });
    }
    const pesquisadorId = rows[0].id;

    // Extrai dados do body
    const {
      versao = 1,
      localizacao,
      respostas = [],
    } = req.body;

    // 2. inicia transação
    await client.query('BEGIN');

    // 3. cria entrevista
    const inserirEntrevistaSQL = `
      INSERT INTO entrevistas
        (pesquisador_id, inicio_em, fim_em, localizacao, versao)
      VALUES
        ($1, NOW(), NOW(), 
         CASE WHEN $2 IS NULL THEN NULL
              ELSE ST_SetSRID(ST_MakePoint($2::json->>'lng', $2::json->>'lat')::float8[],4326)
         END,
         $3)
      RETURNING id, inicio_em AS dataHora;
    `;
    const {
      rows: [entrevista],
    } = await client.query(inserirEntrevistaSQL, [
      pesquisadorId,
      localizacao ? JSON.stringify(localizacao) : null,
      versao,
    ]);
    const entrevistaId = entrevista.id;

    // 4. insere respostas
    const inserirRespostaSQL = `
      INSERT INTO respostas
        (entrevista_id, pergunta_id, opcao_id, resposta, criado_em)
      VALUES
        ($1, $2, $3, $4, NOW());
    `;
    for (const r of respostas) {
      await client.query(inserirRespostaSQL, [
        entrevistaId,
        r.perguntaId,
        r.opcaoId || null,
        r.resposta || null,
      ]);
    }

    // 5. commit
    await client.query('COMMIT');

    res.status(201).json({
      entrevistaId,
      dataHora: entrevista.datahora,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao salvar a pesquisa:', err);
    res.status(500).json({ erro: 'Erro ao salvar a pesquisa' });
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /pesquisas  →  filtros por query‑string
// ─────────────────────────────────────────────────────────────────────────────
async function getPesquisasComFiltros(req, res) {
  try {
    const {
      startDate,           // YYYY‑MM‑DD
      endDate,             // YYYY‑MM‑DD
      researcherId,        // uuid
      gender,              // M / F / O / …
      ageMin,              // int
      ageMax,              // int
      lat, lng, radius     // filtro espacial (km)
    } = req.query;

    const params = [];
    const where  = [];

    // ── período ────────────────────────────────────────────────────────────
    if (startDate) { params.push(startDate); where.push(`e.inicio_em >= $${params.length}`); }
    if (endDate)   { params.push(endDate);   where.push(`e.inicio_em <= $${params.length}`); }

    // ── pesquisador ────────────────────────────────────────────────────────
    if (researcherId) {
      params.push(researcherId);
      where.push(`e.pesquisador_id = $${params.length}`);
    }

    // ── sexo (pergunta 1) ──────────────────────────────────────────────────
    if (gender) {
      params.push(gender.toUpperCase());
      where.push(`
        EXISTS (
          SELECT 1
          FROM respostas r
          JOIN opcoes o ON o.id = r.opcao_id
          WHERE r.entrevista_id = e.id
            AND r.pergunta_id = 1
            AND o.valor = $${params.length}
        )`);
    }

    // ── idade (pergunta 2) ────────────────────────────────────────────────
    const idadeExpr = `(SELECT r.resposta::int
                          FROM respostas r
                         WHERE r.entrevista_id = e.id
                           AND r.pergunta_id = 2
                         LIMIT 1)`;
    if (ageMin) { params.push(+ageMin); where.push(`${idadeExpr} >= $${params.length}`); }
    if (ageMax) { params.push(+ageMax); where.push(`${idadeExpr} <= $${params.length}`); }

    // ── filtro geo por raio (metros) ───────────────────────────────────────
    if (lat && lng && radius) {
      params.push(+lng, +lat, +radius * 1000);          // km → metros
      where.push(`
        ST_DWithin(
          e.localizacao::geography,
          ST_SetSRID(ST_MakePoint($${params.length-2}, $${params.length-1}),4326)::geography,
          $${params.length}
        )`);
    }

    // ── consulta final ─────────────────────────────────────────────────────
    const sql = `
      SELECT e.id,
             e.inicio_em,
             ST_Y(e.localizacao)::float AS latitude,
             ST_X(e.localizacao)::float AS longitude,
             u.nome AS pesquisador
      FROM entrevistas e
      JOIN pesquisadores pe ON e.pesquisador_id = pe.id
      JOIN usuarios      u  ON pe.usuario_id    = u.id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY e.inicio_em DESC
      LIMIT 100;
    `;

    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar pesquisas com filtros:', err);
    res.status(500).json({ erro: 'Erro ao buscar pesquisas com filtros' });
  }
}

module.exports = {
  enviarPesquisa,
  getPesquisasComFiltros,
};
