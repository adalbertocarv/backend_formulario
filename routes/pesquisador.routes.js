const express = require('express');
const router = express.Router();
const { getPesquisadores } = require('../controllers/pesquisador.controller');
const { autenticar } = require('../middlewares/auth.middleware');

// Lista de pesquisadores com dados do usuário vinculado
router.get('/', autenticar, getPesquisadores);

module.exports = router;
