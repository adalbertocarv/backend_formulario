const express = require('express');
const router = express.Router();
const autenticar = require('../middlewares/auth.middleware');
const {
  getDashboardSummary,
  getMapPoints,
  getHeatmapData
} = require('../controllers/dashboard.controller');

// 📊 Resumo do painel
router.get('/resumo', autenticar, getDashboardSummary);

// 📍 Pontos no mapa (lat/lng com metadados)
router.get('/mapa/pontos', autenticar, getMapPoints);

// 🔥 Dados para o heatmap
router.get('/mapa/heatmap', autenticar, getHeatmapData);

module.exports = router;
