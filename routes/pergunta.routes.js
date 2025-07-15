const express = require('express');
const router = express.Router();

const { autenticar } = require('../middlewares/auth.middleware');
const { listarPerguntas } = require('../controllers/pergunta.controller');

router.get('/perguntas', autenticar, listarPerguntas);

module.exports = router;
