require('dotenv').config();

const express = require('express');
const conectarDB = require('./src/config/db.js');
const cors = require('cors');
const usuarioRoutes = require('./src/routes/usuarioRoutes');
const productoRoutes = require('./src/routes/productoRoutes');
const authRoutes = require('./src/routes/authRoutes');

const app = express();

// Conectar base de datos
conectarDB();

app.use(cors());
// Middleware para leer JSON
app.use(express.json());

// Registrar rutas
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/auth', authRoutes);
// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor Express funcionando 🚀');
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
