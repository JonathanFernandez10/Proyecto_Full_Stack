const express = require('express');

const router = express.Router();

const verificarToken = require('../middleware/middleware');

const {
    crearProducto,
    getProductos,
    getProductoById,
    actualizarProducto,
    eliminarProducto
} = require('../controllers/productoController');

router.post('/', verificarToken, crearProducto);

router.get('/', verificarToken, getProductos);

router.get('/:id', verificarToken, getProductoById);

router.put('/:id', verificarToken, actualizarProducto);

router.delete('/:id', verificarToken, eliminarProducto);

module.exports = router;