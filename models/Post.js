const mongoose = require('mongoose');

// Modelo Post
const sectionSchema = new mongoose.Schema({
    subtitle: {
        type: String,
        required: false
    },
    content: {
        type: String,
        required: false 
    },
    image: {
        type: String,
        required: false
    }
});

// Schema principal del Post
const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: false
    },
    date: {
        type: String,
        required: true
    },
    images: {
        type: [String]
    },
    // Campo para diferenciar entre post normal y artículo
    type: {
        type: String,
        enum: ['normal', 'article'],
        default: 'normal'
    },
    // Campo para guardar las secciones del artículo
    sections: [sectionSchema]
});

module.exports = mongoose.model('Post', postSchema);