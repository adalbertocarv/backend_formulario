const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../utils/db');
const { encontrarUsuarioPorEmail, criarUsuario } = require('../models/usuario.model');
require('dotenv').config();

async function login(req, res) {
  const { email, senha } = req.body;
  const usuario = await encontrarUsuarioPorEmail(email);

  if (!usuario || !(await bcrypt.compare(senha, usuario.senha_hash))) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  const token = jwt.sign({ id: usuario.id, tipo: usuario.tipo }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });

  res.json({ token });
  res.json({ token, nome: usuario.nome });
}

async function register(req, res) {
  try {
    const { nome, email, senha } = req.body;
    const senhaHash = await bcrypt.hash(senha, 10);

    // Cria o usuário na tabela `usuarios`
    const usuario = await criarUsuario({ nome, email, senhaHash });

    // Cria o vínculo na tabela `pesquisadores`
    await pool.query(
      `INSERT INTO pesquisadores (usuario_id, dispositivo_id, ultimo_acesso)
       VALUES ($1, $2, $3)`,
      [usuario.id, 'app_default_device', new Date()]
    );

    res.status(201).json(usuario);
  } catch (err) {
    console.error('Erro ao registrar:', err);
    res.status(500).json({ erro: 'Erro ao registrar usuário' });
  }
}

module.exports = { login, register };
