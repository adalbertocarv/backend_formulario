const jwt = require('jsonwebtoken');
require('dotenv').config();

function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ erro: 'Token não fornecido' });

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload;
    next();
  } catch (e) {
    res.status(403).json({ erro: 'Token inválido' });
  }
}

module.exports = autenticar;
