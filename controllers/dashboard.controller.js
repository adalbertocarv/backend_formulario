const pool = require("../utils/db");

/* =========================================================================
 * 1 ─ Resumo do painel
 *    GET /dashboard/summary
 * ========================================================================= */
exports.getDashboardSummary = async (_req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0); // 00:00:00 de hoje

    // um SELECT com quatro sub‑queries evita round‑trips extras
    const {
      rows: [tot],
    } = await pool.query(
      `
      SELECT
        (SELECT COUNT(*) FROM entrevistas)                                                AS total_surveys,
        (SELECT COUNT(*) FROM pesquisadores)                                              AS total_researchers,
        (SELECT COUNT(*) FROM pesquisadores
           WHERE ultimo_acesso >= NOW() - INTERVAL '24 HOURS')                            AS active_researchers,
        (SELECT COUNT(*) FROM entrevistas
           WHERE inicio_em >= $1)                                                         AS surveys_today
      `,
      [todayStart]
    );

    // 5 entrevistas mais recentes
    const { rows: recent } = await pool.query(
      `
      SELECT e.id,
             e.inicio_em,
             e.fim_em,
             u.nome AS pesquisador_nome
      FROM entrevistas  e
      JOIN pesquisadores pe ON e.pesquisador_id = pe.id
      JOIN usuarios      u  ON pe.usuario_id    = u.id
      ORDER BY e.inicio_em DESC
      LIMIT 5;
      `
    );

    res.json({
      totalSurveys: Number(tot.total_surveys),
      totalResearchers: Number(tot.total_researchers),
      activeResearchers: Number(tot.active_researchers),
      surveysToday: Number(tot.surveys_today),
      recentSurveys: recent.map((r) => ({
        id: r.id,
        inicioEm: r.inicio_em,
        fimEm: r.fim_em,
        pesquisador: { usuario: { nome: r.pesquisador_nome } },
      })),
    });
  } catch (err) {
    console.error("Erro no resumo do dashboard:", err);
    res.status(500).json({ erro: "Erro ao gerar resumo do dashboard" });
  }
};

/* =========================================================================
 * 2 ─ Pontos para o mapa
 *    GET /dashboard/map-points
 * ========================================================================= */
exports.getMapPoints = async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT
        e.id,
        ST_Y(e.localizacao)::float  AS lat,
        ST_X(e.localizacao)::float  AS lng,
        e.inicio_em,
        u.nome                      AS pesquisador_nome,

        /* idade  – pergunta 2 (inteiro) */
        (SELECT r.resposta::int
           FROM respostas r
          WHERE r.entrevista_id = e.id
            AND r.pergunta_id   = 2
          LIMIT 1)              AS idade,

        /* sexo  – pergunta 1 (unica_escolha) */
        COALESCE(
          (SELECT o.valor            -- se quiser a sigla (M/F/O)
             FROM respostas r
             JOIN opcoes o ON o.id = r.opcao_id
            WHERE r.entrevista_id = e.id
              AND r.pergunta_id   = 1
            LIMIT 1),
          (SELECT r.resposta
             FROM respostas r
            WHERE r.entrevista_id = e.id
              AND r.pergunta_id   = 1
            LIMIT 1)
        )                       AS sexo
      FROM entrevistas e
      JOIN pesquisadores pe ON e.pesquisador_id = pe.id
      JOIN usuarios      u  ON pe.usuario_id    = u.id
      WHERE e.localizacao IS NOT NULL;
      `
    );

    const points = rows.map((r) => ({
      id: r.id,
      lat: r.lat,
      lng: r.lng,
      info: {
        pesquisador: r.pesquisador_nome || "Desconhecido",
        dataHora: r.inicio_em,
        idade: r.idade,
        sexo: r.sexo,
      },
    }));

    res.json(points);
  } catch (err) {
    console.error("Erro ao obter pontos do mapa:", err);
    res.status(500).json({ erro: "Erro ao obter dados de pontos do mapa" });
  }
};

/* =========================================================================
 * 3 ─ Dados para Heatmap
 *    GET /dashboard/heatmap
 * ========================================================================= */
exports.getHeatmapData = async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT
        ST_Y(localizacao)::float AS lat,
        ST_X(localizacao)::float AS lng
      FROM entrevistas
      WHERE localizacao IS NOT NULL;
      `
    );

    res.json({
      radius: 25, // mesmo valor usado no frontend
      points: rows.map((r) => [r.lat, r.lng, 1]), // [lat, lng, peso]
    });
  } catch (err) {
    console.error("Erro ao obter heatmap:", err);
    res.status(500).json({ erro: "Erro ao obter dados do heatmap" });
  }
};
