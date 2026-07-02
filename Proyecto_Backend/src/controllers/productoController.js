const Producto = require('../models/Producto');

/*
    Crear producto
*/
const crearProducto = async (req, res) => {

    try {

        const producto = new Producto(req.body);

        const productoGuardado = await producto.save();

        res.status(201).json({
            ok: true,
            producto: productoGuardado
        });

    } catch (error) {

        res.status(400).json({
            ok: false,
            mensaje: 'Error creando producto',
            error: error.message
        });

    }

};

/*
    Obtener todos
*/
const getProductos = async (req, res) => {

    try {

        const productos = await Producto.find();

        res.status(200).json({
            ok: true,
            productos
        });

    } catch (error) {

        res.status(500).json({
            ok: false,
            mensaje: error.message
        });

    }

};

/*
    Obtener por ID
*/
const getProductoById = async (req, res) => {

    try {

        const producto = await Producto.findById(req.params.id);

        if (!producto) {

            return res.status(404).json({
                ok: false,
                mensaje: 'Producto no encontrado'
            });

        }

        res.status(200).json({
            ok: true,
            producto
        });

    } catch (error) {

        res.status(500).json({
            ok: false,
            mensaje: error.message
        });

    }

};

/*
    Actualizar producto
*/
const actualizarProducto = async (req, res) => {

    try {
        
        const producto = await Producto.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!producto) {

            return res.status(404).json({
                ok: false,
                mensaje: 'Producto no encontrado'
            });

        }

        res.status(200).json({
            ok: true,
            producto
        });

    } catch (error) {

        res.status(400).json({
            ok: false,
            mensaje: 'Error actualizando producto',
            error: error.message
        });

    }

};

/*
    Eliminar producto
*/
const eliminarProducto = async (req, res) => {

    try {

        const producto = await Producto.findByIdAndDelete(req.params.id);

        if (!producto) {

            return res.status(404).json({
                ok: false,
                mensaje: 'Producto no encontrado'
            });

        }

        res.status(200).json({
            ok: true,
            mensaje: 'Producto eliminado'
        });

    } catch (error) {

        res.status(500).json({
            ok: false,
            mensaje: error.message
        });

    }

};

module.exports = {
    crearProducto,
    getProductos,
    getProductoById,
    actualizarProducto,
    eliminarProducto
};