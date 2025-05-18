const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("../utils/db");
const { randomUUID } = require('crypto');

const {
  encontrarUsuarioPorEmail,
  criarUsuario,
} = require("../models/usuario.model");
require("dotenv").config();

async function login(req, res) {
  const { email, senha } = req.body;
  const usuario = await encontrarUsuarioPorEmail(email);

  if (!usuario || !(await bcrypt.compare(senha, usuario.senha_hash))) {
    return res.status(401).json({ erro: "Credenciais inválidas" });
  }

  const token = jwt.sign(
    { id: usuario.id, tipo: usuario.tipo },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );

  res.json({ token, nome: usuario.nome });
}

async function register(req, res) {
  try {
    const { nome, email, senha } = req.body;

    const existente = await encontrarUsuarioPorEmail(email);
    if (existente) {
      return res.status(409).json({ erro: 'Email já registrado' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const usuario = await criarUsuario({ nome, email, senhaHash });

    // Gera ID único para o dispositivo
    const dispositivoId = `device_${randomUUID()}`;

    await pool.query(
      `INSERT INTO pesquisadores (usuario_id, dispositivo_id, ultimo_acesso)
       VALUES ($1, $2, $3)`,
      [usuario.id, dispositivoId, new Date()]
    );

    const token = jwt.sign(
      { id: usuario.id, tipo: usuario.tipo },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({ token, nome: usuario.nome });
  } catch (err) {
    console.error('Erro ao registrar:', err);
    res.status(500).json({ erro: err.message });
  }
}

module.exports = { login, register };
