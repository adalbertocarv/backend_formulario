/**
 * Controller responsável por criar uma entrevista e persistir as respostas.
 * Requer middleware de autenticação que injeta req.usuario (com id do USUÁRIO).
 */
const pool = require("../utils/db");

/**
 * Espera corpo JSON no formato:
 * {
 *   "versao": 3,
 *   "latitude":  -15.793889,
 *   "longitude": -47.882778,
 *   "respostas": [
 *      { "pergunta_id": 1, "opcao_id": 2 },
 *      { "pergunta_id": 2, "resposta": "35" }
 *   ]
 * }
 */
async function salvarEntrevista(req, res) {
  const { versao, latitude, longitude, respostas } = req.body || {};

  /* --------- validações rápidas --------- */
  if (!versao || !Array.isArray(respostas) || respostas.length === 0)
    return res.status(400).json({ erro: "Dados insuficientes." });

  if (typeof latitude !== "number" || typeof longitude !== "number")
    return res.status(400).json({ erro: "Latitude/longitude inválidos." });

  // id do USUÁRIO (vem do JWT)
  const usuarioId = req.usuario?.id;
  if (!usuarioId)
    return res.status(401).json({ erro: "Usuário não autenticado." });

  /* ───────── busca o pesquisador vinculado ───────── */
  let pesquisadorId;
  try {
    const r = await pool.query(
      "SELECT id FROM pesquisadores WHERE usuario_id = $1 LIMIT 1",
      [usuarioId]
    );
    if (r.rowCount === 0)
      return res
        .status(403)
        .json({ erro: "Usuário não autorizado a registrar entrevistas." });

    pesquisadorId = r.rows[0].id;
  } catch (e) {
    console.error("[ERRO buscarPesquisador]", e.message);
    return res.status(500).json({ erro: "Falha ao validar pesquisador." });
  }

  /* ---------------- transação principal ---------------- */
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    /* 1️⃣  grava cabeçalho da entrevista ------------------------------------ */
    const insertEntrevistaSQL = `
  INSERT INTO entrevistas
    (id, pesquisador_id, inicio_em, fim_em, localizacao, versao)
  VALUES
    (gen_random_uuid(), $1, now(), now(),
     ST_SetSRID(ST_MakePoint($3, $2), 4326),  -- lon, lat
     $4)
  RETURNING id
`;
    const { rows } = await client.query(insertEntrevistaSQL, [
      pesquisadorId,
      latitude,
      longitude,
      versao,
    ]);
    const entrevistaId = rows[0].id; //  <-- mantenha este nome

    /* 2️⃣  lote de respostas ---------------------------------------- */
    const insertRespostaSQL = `
  INSERT INTO respostas
    (entrevista_id, pergunta_id, opcao_id, resposta)
  VALUES
    ($1, $2, $3, $4)
`;

    for (const r of respostas) {
      const perguntaId = r.pergunta_id ?? r.perguntaId;
      if (!perguntaId)
        throw new Error("pergunta_id ausente em uma das respostas");

      const opcaoId = r.opcao_id ?? r.opcaoId ?? null;

      let respostaBruta = r.resposta ?? r.valor ?? null;
      if (Array.isArray(respostaBruta) || typeof respostaBruta === "object") {
        respostaBruta = JSON.stringify(respostaBruta);
      } else if (
        typeof respostaBruta === "number" ||
        typeof respostaBruta === "boolean"
      ) {
        respostaBruta = String(respostaBruta);
      }

      await client.query(insertRespostaSQL, [
        entrevistaId, //  <-- o mesmo identificador aqui
        perguntaId,
        opcaoId,
        respostaBruta,
      ]);
    }

    await client.query("COMMIT");
    return res.status(201).json({ status: "ok", entrevista_id: entrevistaId });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("[ERRO salvarEntrevista]", e.message);
    return res.status(500).json({ erro: "Erro ao salvar entrevista." });
  } finally {
    client.release();
  }
}

module.exports = { salvarEntrevista };
