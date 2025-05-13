const express = require('express');
const router = express.Router();
const { enviarPesquisa } = require('../controllers/pesquisa.controller');
const autenticar = require('../middlewares/auth.middleware');

router.post('/', autenticar, enviarPesquisa);

module.exports = router;
