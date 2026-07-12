const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');

// Crear nuevo usuario
const crearUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol, estado, proveedor } = req.body;

    if (rol === 'proveedor' && !proveedor) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Un usuario con rol proveedor debe estar vinculado a un proveedor'
      });
    }

    // Encriptar contraseña
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const nuevoUsuario = new Usuario({
      nombre,
      email,
      password: passwordHash,
      rol,
      estado,
      proveedor: rol === 'proveedor' ? proveedor : null
    });

    const usuarioGuardado = await nuevoUsuario.save();
    const usuarioSeguro = usuarioGuardado.toObject();
    delete usuarioSeguro.password;

    res.status(201).json({
      ok: true,
      usuario: usuarioSeguro
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,
      mensaje: 'Error al crear usuario',
      error: error.message
    });
  }
};

/*
    Obtener todos los usuarios
*/
const getUsers = async (req, res) => {
    try {
        const users = await Usuario.find()
            .select('-password')
            .populate('proveedor', 'nombre');
        res.status(200).json({
            ok: true,
            usuarios: users
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: 'Error obteniendo usuarios',
            error: error.message
        });
    }
};

/*
    Obtener usuario por ID
*/
const getUserById = async (req, res) => {
    try {
        const user = await Usuario.findById(req.params.id)
            .select('-password')
            .populate('proveedor', 'nombre');
        if (!user) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Usuario no encontrado'
            });
        }
        res.status(200).json({
            ok: true,
            usuario: user
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: 'Error obteniendo usuario',
            error: error.message
        });
    }
};

/*
    Actualizar usuario
*/
const actualizarUsuario = async (req, res) => {
    try {
        const { nombre, email, password, rol, estado, proveedor } = req.body;

        const cambios = { nombre, email, rol, estado, proveedor: rol === 'proveedor' ? proveedor : null };

        if (password) {
            const salt = bcrypt.genSaltSync(10);
            cambios.password = bcrypt.hashSync(password, salt);
        }

        const usuario = await Usuario.findByIdAndUpdate(
            req.params.id,
            cambios,
            { new: true, runValidators: true }
        ).select('-password');

        if (!usuario) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        res.status(200).json({
            ok: true,
            usuario
        });
    } catch (error) {
        res.status(400).json({
            ok: false,
            mensaje: 'Error actualizando usuario',
            error: error.message
        });
    }
};

/*
    Eliminar usuario
*/
const eliminarUsuario = async (req, res) => {
    try {
        const usuario = await Usuario.findByIdAndDelete(req.params.id);

        if (!usuario) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        res.status(200).json({
            ok: true,
            mensaje: 'Usuario eliminado'
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: 'Error eliminando usuario',
            error: error.message
        });
    }
};


module.exports = {
  crearUsuario,
  getUsers,
  getUserById,
  actualizarUsuario,
  eliminarUsuario
};
