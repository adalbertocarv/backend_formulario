const express = require("express");
const router = express.Router();
const { getUsuarios } = require("../controllers/usuarios.controller");
const autenticar = require("../middlewares/auth.middleware");

// Lista de todos os usuários
router.get("/", autenticar, getUsuarios);

module.exports = router;
