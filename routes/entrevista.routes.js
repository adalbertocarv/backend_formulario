const express   = require('express');
const router    = express.Router();

const { salvarEntrevista }  = require('../controllers/entrevista.controller');
const { autenticar }        = require('../middlewares/auth.middleware');

/**
 * POST /entrevistas
 * Cabeçalho Authorization: Bearer <token>
 * Corpo JSON conforme especificado no controller.
 */
router.post('/entrevistas', autenticar, salvarEntrevista);

module.exports = router;
