const pool = require('../utils/db');
const { criarPesquisa } = require('../models/pesquisa.model');

// POST /pesquisas — envio de nova pesquisa
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

// GET /pesquisas — com filtros via query params
async function getPesquisasComFiltros(req, res) {
  try {
    const {
      startDate,
      endDate,
      researcherId,
      gender,
      ageMin,
      ageMax,
      lat,
      lng,
      radius
    } = req.query;

    const values = [];
    let where = [];

    if (startDate) {
      values.push(startDate);
      where.push(`data_hora >= $${values.length}`);
    }

    if (endDate) {
      values.push(endDate);
      where.push(`data_hora <= $${values.length}`);
    }

    if (researcherId) {
      values.push(researcherId);
      where.push(`pesquisador_id = $${values.length}`);
    }

    if (gender) {
      values.push(gender);
      where.push(`sexo = $${values.length}`);
    }

    if (ageMin) {
      values.push(ageMin);
      where.push(`idade >= $${values.length}`);
    }

    if (ageMax) {
      values.push(ageMax);
      where.push(`idade <= $${values.length}`);
    }

    if (lat && lng && radius) {
      const r = parseFloat(radius) / 111;
      values.push(parseFloat(lat) - r, parseFloat(lat) + r, parseFloat(lng) - r, parseFloat(lng) + r);
      where.push(`latitude BETWEEN $${values.length - 3} AND $${values.length - 2}`);
      where.push(`longitude BETWEEN $${values.length - 1} AND $${values.length}`);
    }

    const query = `
      SELECT p.*, u.nome AS nome_pesquisador
      FROM pesquisas p
      JOIN pesquisadores pe ON p.pesquisador_id = pe.id
      JOIN usuarios u ON pe.usuario_id = u.id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY p.data_hora DESC
    `;

    const result = await pool.query(query, values);

    const pesquisas = result.rows.map(row => ({
      ...row,
      pesquisador: {
        usuario: {
          nome: row.nome_pesquisador
        }
      }
    }));

    res.json(pesquisas);
  } catch (err) {
    console.error('Erro ao buscar pesquisas com filtros:', err);
    res.status(500).json({ erro: 'Erro ao buscar pesquisas com filtros' });
  }
}

module.exports = {
  enviarPesquisa,
  getPesquisasComFiltros
};
