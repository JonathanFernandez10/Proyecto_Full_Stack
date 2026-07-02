const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// LOGIN 
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // 1.  Buscar usuario    
        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Usuario no existe'     // más adelante por seguridad  un mensaje genérico por seguridad
            });
        }
        // 2.  Validar contraseña     
        const passwordValido = bcrypt.compareSync(
            password,
            usuario.password
        );
        if (!passwordValido) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Password incorrecto'
            });
        }
        // 3.  Generar TOKEN     
        const token = jwt.sign(
            { 
                uid: usuario._id, 
                nombre: usuario.nombre 
            },
            process.env.JWT_SECRET,
            { 
                expiresIn: '15m' 
            }
        );

        const refreshToken = jwt.sign(
    {
        uid: usuario._id
    },
    process.env.REFRESH_SECRET,
    {
        expiresIn: '7d'
    }
    ); 
    usuario.Token = token;
    usuario.refreshToken = refreshToken;
    await usuario.save();

        // 4.  Respuesta     
        res.json({
            ok: true,
            usuario,
            token,
            refreshToken
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error en login'
        });
    }
};

// REFRESH TOKEN
const refreshToken = async (req, res) => {

    try {

        // Obtener refresh token enviado por el cliente
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                ok: false,
                mensaje: 'Refresh Token requerido'
            });
        }

        // PASO 1: Verificar firma
        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_SECRET
        );

        // PASO 2: Buscar usuario
        const usuario = await Usuario.findById(decoded.uid);

        if (!usuario) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        // PASO 3: Verificar que el refresh token sea el mismo
        if (usuario.refreshToken !== refreshToken) {
            return res.status(401).json({
                ok: false,
                mensaje: 'Refresh Token inválido'
            });
        }

        // PASO 4: Generar nuevo Access Token
        const nuevoAccessToken = jwt.sign(
            {
                uid: usuario._id,
                nombre: usuario.nombre,
                rol: usuario.rol
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '15m'
            }
        );
        usuario.Token = nuevoAccessToken;
        await usuario.save();


        // PASO 5: Responder
        res.json({
            ok: true,
            accessToken: nuevoAccessToken
        });

    } catch (error) {

        res.status(401).json({
            ok: false,
            mensaje: 'Refresh Token inválido o expirado'
        });

    };
};
const logout = async (req, res) => {

    try {

        const usuario = await Usuario.findById(
            req.usuario.uid
        );

        if (!usuario) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        usuario.refreshToken = null;

        await usuario.save();

        res.json({
            ok: true,
            mensaje: 'Sesión cerrada correctamente'
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error al cerrar sesión'
        });

    }

};


module.exports = {
    login,
    refreshToken,
    logout
};  