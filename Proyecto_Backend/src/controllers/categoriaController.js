const Categoria = require('../models/Categoria');
const Producto = require('../models/Producto');

const crearCategoria = async (req, res) => {
    try {
        const categoria = new Categoria(req.body);
        const categoriaGuardada = await categoria.save();

        res.status(201).json({
            ok: true,
            categoria: categoriaGuardada
        });
    } catch (error) {
        res.status(400).json({
            ok: false,
            mensaje: 'Error creando categoría',
            error: error.message
        });
    }
};

const getCategorias = async (req, res) => {
    try {
        const categorias = await Categoria.find().sort({ nombre: 1 });
        res.status(200).json({
            ok: true,
            categorias
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: error.message
        });
    }
};

const getCategoriaById = async (req, res) => {
    try {
        const categoria = await Categoria.findById(req.params.id);
        if (!categoria) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Categoría no encontrada'
            });
        }
        res.status(200).json({
            ok: true,
            categoria
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: error.message
        });
    }
};

const actualizarCategoria = async (req, res) => {
    try {
        const categoria = await Categoria.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!categoria) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Categoría no encontrada'
            });
        }

        res.status(200).json({
            ok: true,
            categoria
        });
    } catch (error) {
        res.status(400).json({
            ok: false,
            mensaje: 'Error actualizando categoría',
            error: error.message
        });
    }
};

const eliminarCategoria = async (req, res) => {
    try {
        const enUso = await Producto.exists({ categoria: req.params.id });
        if (enUso) {
            return res.status(409).json({
                ok: false,
                mensaje: 'No se puede eliminar: hay productos asociados a esta categoría'
            });
        }

        const categoria = await Categoria.findByIdAndDelete(req.params.id);

        if (!categoria) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Categoría no encontrada'
            });
        }

        res.status(200).json({
            ok: true,
            mensaje: 'Categoría eliminada'
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: error.message
        });
    }
};

module.exports = {
    crearCategoria,
    getCategorias,
    getCategoriaById,
    actualizarCategoria,
    eliminarCategoria
};
