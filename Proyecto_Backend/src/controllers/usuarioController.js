const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');

// Crear nuevo usuario
const crearUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    // Encriptar contraseña 
    const salt = bcrypt.genSaltSync(10); 
    const passwordHash = bcrypt.hashSync(password, salt);

    const nuevoUsuario = new Usuario({
      nombre,
      email,
      password: passwordHash,
      rol
    });

    const usuarioGuardado = await nuevoUsuario.save();
    usuarioGuardado.password = undefined;

    res.status(201).json({
      ok: true,
      usuario: usuarioGuardado
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
        const users = await Usuario.find();
        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error obteniendo usuarios',
            error: error.message
        });
    }
};

/*
    Obtener usuario por ID
*/
const getUserById = async (req, res) => {
    try {
        const user = await Usuario.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error obteniendo usuario',
            error: error.message
        });
    }
};
 

module.exports = {
  crearUsuario,
  getUsers,
  getUserById
};
