const express = require('express');
const router = express.Router();
const verificarToken = require('../middleware/middleware');

const{
  crearUsuario,
  getUsers,
  getUserById
} = require('../controllers/usuarioController');

// POST
router.post('/', crearUsuario);

// GET TODOS
router.get('/', verificarToken, getUsers);

// GET POR ID
router.get('/:id', verificarToken, getUserById);

module.exports = router;
