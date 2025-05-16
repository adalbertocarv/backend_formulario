const pool = require('../utils/db');

// 📊 Resumo do painel (dashboard)
exports.getDashboardSummary = async (req, res) => {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const [totalPesquisas, totalPesquisadores, pesquisadoresAtivos, pesquisasHoje, pesquisasRecentes] =
      await Promise.all([
        pool.query('SELECT COUNT(*) FROM pesquisas'),
        pool.query('SELECT COUNT(*) FROM pesquisadores'),
        pool.query(
          `SELECT COUNT(*) FROM pesquisadores WHERE ultimo_acesso >= NOW() - INTERVAL '24 hours'`
        ),
        pool.query(
          `SELECT COUNT(*) FROM pesquisas WHERE data_hora >= $1`,
          [hoje]
        ),
        pool.query(
          `SELECT p.*, u.nome AS nome_pesquisador
           FROM pesquisas p
           JOIN pesquisadores pe ON p.pesquisador_id = pe.id
           JOIN usuarios u ON pe.usuario_id = u.id
           ORDER BY data_hora DESC LIMIT 5`
        ),
      ]);

    res.json({
      totalSurveys: parseInt(totalPesquisas.rows[0].count, 10),
      totalResearchers: parseInt(totalPesquisadores.rows[0].count, 10),
      activeResearchers: parseInt(pesquisadoresAtivos.rows[0].count, 10),
      surveysToday: parseInt(pesquisasHoje.rows[0].count, 10),
      recentSurveys: pesquisasRecentes.rows.map(row => ({
        ...row,
        pesquisador: {
          usuario: {
            nome: row.nome_pesquisador
          }
        }
      }))
    });
  } catch (err) {
    console.error('Erro no resumo do dashboard:', err);
    res.status(500).json({ erro: 'Erro ao gerar resumo do dashboard' });
  }
};

// 📍 Pontos para o mapa
exports.getMapPoints = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.latitude, p.longitude, p.data_hora, p.idade, p.sexo, u.nome
      FROM pesquisas p
      JOIN pesquisadores pe ON p.pesquisador_id = pe.id
      JOIN usuarios u ON pe.usuario_id = u.id
    `);

    const points = result.rows.map(row => ({
      id: row.id,
      lat: row.latitude,
      lng: row.longitude,
      info: {
        pesquisador: row.nome || 'Desconhecido',
        dataHora: row.data_hora,
        idade: row.idade,
        sexo: row.sexo,
      },
    }));

    res.json(points);
  } catch (err) {
    console.error('Erro ao obter pontos do mapa:', err);
    res.status(500).json({ erro: 'Erro ao obter dados de pontos do mapa' });
  }
};

// 🔥 Dados para heatmap
exports.getHeatmapData = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT latitude, longitude
      FROM pesquisas
    `);

    const heatmap = {
      points: result.rows.map(row => [row.latitude, row.longitude, 1]),
      radius: 25,
    };

    res.json(heatmap);
  } catch (err) {
    console.error('Erro ao obter heatmap:', err);
    res.status(500).json({ erro: 'Erro ao obter dados do heatmap' });
  }
};
