const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth.routes');
const pesquisaRoutes = require('./routes/pesquisa.routes');

app.use('/auth', authRoutes);
app.use('/pesquisas', pesquisaRoutes);

module.exports = app;
