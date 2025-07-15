const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require("./routes/auth.routes");
const pesquisaRoutes = require("./routes/pesquisa.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const pesquisadorRoutes = require("./routes/pesquisador.routes");
const usuarioRoutes = require("./routes/usuario.routes");

app.use("/auth", authRoutes);
app.use("/pesquisas", pesquisaRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/pesquisadores", pesquisadorRoutes);
app.use("/usuarios", usuarioRoutes);
app.use("/api", require("./routes/pergunta.routes"));
app.use("/api", require("./routes/entrevista.routes"));

module.exports = app;
