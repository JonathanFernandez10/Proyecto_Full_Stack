const mongoose = require('mongoose');

const ProductoSchema = new mongoose.Schema({

    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true
    },

    codigo_sku: {
        type: String,
        required: [true, 'El SKU es obligatorio'],
        unique: true,

        validate: {
            validator: function(valor) {
                return /^[A-Z]{3}-\d{4}$/.test(valor);
            },

            message: props =>
                `${props.value} no cumple el formato AAA-1234`
        }
    },

    categoria: {
        type: String,

        enum: {
            values: ['Electrónica', 'Hogar', 'Oficina'],
            message: '{VALUE} no es una categoría válida'
        },

        required: true
    },

    precio: {
        type: Number,
        required: true,
        min: [0, 'El precio no puede ser negativo']
    },

    stock: {
        type: Number,
        default: 0,
        min: [0, 'El stock no puede ser negativo']
    }

},
{
    timestamps: true
});

module.exports = mongoose.model('Producto', ProductoSchema);