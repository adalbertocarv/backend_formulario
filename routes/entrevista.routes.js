const express = require('express');
const router = express.Router();

const { salvarEntrevista } = require('../controllers/entrevista.controller');
const { autenticar } = require('../middlewares/auth.middleware'); 

// Salvar entrevista
router.post('/entrevistas', autenticar, salvarEntrevista);

module.exports = router;
