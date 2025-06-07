const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
const indexRoutes = require('./routes/index');
app.use('/', indexRoutes);

const PORT = process.env.PORT || 5751;

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
