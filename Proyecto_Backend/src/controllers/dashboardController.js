const Producto = require('../models/Producto');
const Proveedor = require('../models/Proveedor');
const Inventario = require('../models/Inventario');
const OrdenCompra = require('../models/OrdenCompra');

const getResumen = async (req, res) => {
    try {
        const [totalProductos, totalProveedores, ordenesPendientes, inventario] = await Promise.all([
            Producto.countDocuments(),
            Proveedor.countDocuments(),
            OrdenCompra.countDocuments({ estado: { $in: ['pendiente', 'aprobada'] } }),
            Inventario.find().populate('producto', 'nombre codigo stock')
        ]);

        const alertasStockBajo = inventario
            .filter(item => item.producto && item.cantidadDisponible <= item.producto.stock)
            .map(item => ({
                producto: item.producto.nombre,
                codigo: item.producto.codigo,
                cantidadDisponible: item.cantidadDisponible,
                stockMinimo: item.producto.stock
            }));

        res.status(200).json({
            ok: true,
            resumen: {
                totalProductos,
                totalProveedores,
                ordenesPendientes,
                alertasStockBajo
            }
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: error.message
        });
    }
};

module.exports = {
    getResumen
};
