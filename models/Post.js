const mongoose = require('mongoose');

// --- NUEVO: Definimos la estructura de una sección ---
// Este es un "subdocumento". No será un modelo propio, sino parte del modelo Post.
const sectionSchema = new mongoose.Schema({
    subtitle: {
        type: String,
        required: false // El subtítulo es opcional
    },
    content: {
        type: String,
        required: false // El contenido de una sección sí es obligatorio
    },
    image: {
        type: String, // Guardaremos la URL de la imagen
        required: false
    }
});
// ----------------------------------------------------

// Actualizamos el Schema principal del Post
const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    // CAMBIO: El contenido principal ahora es opcional.
    // Solo los posts "normales" lo usarán. Los artículos usarán las secciones.
    content: {
        type: String,
        required: false
    },
    date: {
        type: Date,
        required: true
    },
    images: {
        type: [String] // Para el carrusel del post "normal"
    },
    // --- NUEVO: Campo para diferenciar el tipo de publicación ---
    type: {
        type: String,
        enum: ['normal', 'article'], // Solo permite estos dos valores
        default: 'normal'
    },
    // --- NUEVO: Campo para guardar las secciones del artículo ---
    // Será un array de objetos, y cada objeto seguirá la estructura de 'sectionSchema'.
    sections: [sectionSchema]
});

module.exports = mongoose.model('Post', postSchema);