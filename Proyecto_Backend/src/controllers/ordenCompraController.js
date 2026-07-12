const mongoose = require('mongoose');
const OrdenCompra = require('../models/OrdenCompra');
const Movimiento = require('../models/Movimiento');
const { aplicarMovimiento } = require('../services/inventarioService');

const POPULATE = [
    { path: 'proveedor', select: 'nombre correo telefono' },
    { path: 'producto', select: 'nombre codigo' }
];

const crearOrdenCompra = async (req, res) => {
    try {
        const orden = new OrdenCompra(req.body);
        const ordenGuardada = await orden.save();
        await ordenGuardada.populate(POPULATE);

        res.status(201).json({
            ok: true,
            orden: ordenGuardada
        });
    } catch (error) {
        res.status(400).json({
            ok: false,
            mensaje: 'Error creando orden de compra',
            error: error.message
        });
    }
};

const getOrdenesCompra = async (req, res) => {
    try {
        const filtro = req.usuario.rol === 'proveedor'
            ? { proveedor: req.usuario.proveedorId }
            : {};

        const ordenes = await OrdenCompra.find(filtro).populate(POPULATE).sort({ fecha: -1 });

        res.status(200).json({
            ok: true,
            ordenes
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: error.message
        });
    }
};

const getOrdenCompraById = async (req, res) => {
    try {
        const orden = await OrdenCompra.findById(req.params.id).populate(POPULATE);

        if (!orden) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Orden de compra no encontrada'
            });
        }

        if (req.usuario.rol === 'proveedor' && String(orden.proveedor._id) !== String(req.usuario.proveedorId)) {
            return res.status(403).json({
                ok: false,
                mensaje: 'No tienes acceso a esta orden de compra'
            });
        }

        res.status(200).json({
            ok: true,
            orden
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: error.message
        });
    }
};

/*
    Actualizar una orden de compra. Si el estado cambia a 'recibida', se genera automáticamente
    un Movimiento de tipo 'entrada' por la cantidad de la orden, que a su vez actualiza el
    Inventario del producto. Es idempotente: no se puede volver a "recibir" una orden ya recibida.
*/
const actualizarOrdenCompra = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const ordenActual = await OrdenCompra.findById(req.params.id);

        if (!ordenActual) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Orden de compra no encontrada'
            });
        }

        const pasaARecibida = req.body.estado === 'recibida' && ordenActual.estado !== 'recibida';

        if (req.body.estado === 'recibida' && ordenActual.estado === 'recibida') {
            return res.status(400).json({
                ok: false,
                mensaje: 'Esta orden ya fue marcada como recibida'
            });
        }

        let ordenActualizada;

        await session.withTransaction(async () => {
            if (pasaARecibida) {
                await aplicarMovimiento({
                    producto: ordenActual.producto,
                    tipoMovimiento: 'entrada',
                    cantidad: ordenActual.cantidad
                }, session);

                await Movimiento.create([{
                    producto: ordenActual.producto,
                    tipoMovimiento: 'entrada',
                    cantidad: ordenActual.cantidad,
                    usuario: req.usuario.uid,
                    notas: `Generado automáticamente al recibir la orden de compra ${ordenActual._id}`
                }], { session });
            }

            ordenActual.set(req.body);
            ordenActualizada = await ordenActual.save({ session });
        });

        await ordenActualizada.populate(POPULATE);

        res.status(200).json({
            ok: true,
            orden: ordenActualizada
        });
    } catch (error) {
        res.status(error.status || 400).json({
            ok: false,
            mensaje: 'Error actualizando orden de compra',
            error: error.message
        });
    } finally {
        session.endSession();
    }
};

const eliminarOrdenCompra = async (req, res) => {
    try {
        const orden = await OrdenCompra.findById(req.params.id);

        if (!orden) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Orden de compra no encontrada'
            });
        }

        if (orden.estado === 'recibida') {
            return res.status(409).json({
                ok: false,
                mensaje: 'No se puede eliminar una orden de compra ya recibida'
            });
        }

        await orden.deleteOne();

        res.status(200).json({
            ok: true,
            mensaje: 'Orden de compra eliminada'
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: error.message
        });
    }
};

module.exports = {
    crearOrdenCompra,
    getOrdenesCompra,
    getOrdenCompraById,
    actualizarOrdenCompra,
    eliminarOrdenCompra
};
