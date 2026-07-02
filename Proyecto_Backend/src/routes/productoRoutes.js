const express = require('express');

const router = express.Router();

const {
    crearProducto,
    getProductos,
    getProductoById,
    actualizarProducto,
    eliminarProducto
} = require('../controllers/productoController');

router.post('/', crearProducto);

router.get('/', getProductos);

router.get('/:id', getProductoById);

router.put('/:id', actualizarProducto);

router.delete('/:id', eliminarProducto);

module.exports = router;