const express = require('express');
const router = express.Router();

const { enviarPesquisa, getPesquisasComFiltros } = require('../controllers/pesquisa.controller');
const { autenticar } = require('../middlewares/auth.middleware');  

// Envio de nova pesquisa
router.post('/', autenticar, enviarPesquisa);

// Listagem de pesquisas com filtros (query params)
router.get('/', autenticar, getPesquisasComFiltros);

module.exports = router;
