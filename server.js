// Node server.js
// 1. Importar librerías
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('./models/Post');
const multer = require('multer');
const path = require('path');

// 2. Inicializar la aplicación
const app = express();
const PORT = process.env.PORT || 3000;

// 3. Configurar EJS como motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Endpoint seguro que devuelve las claves necesarias para EmailJS
app.get("/api/emailjs-config", (req, res) => {
    res.json({
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        serviceId: process.env.EMAILJS_SERVICE_ID,
        templateId: process.env.EMAILJS_TEMPLATE_ID,
    });
});

// 4. Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- CONEXIÓN A MONGODB ---
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Conectado a MongoDB Atlas'))
    .catch((err) => console.error('❌ Error al conectar a MongoDB:', err));

// --- CONFIGURACIÓN DE MULTER ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- RUTAS DE API ---
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
        res.json(posts);
    } catch (error) {
        console.error('Error al obtener posts:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

app.post('/api/posts', upload.array('images', 5), async (req, res) => {
    try {
        const { title, content, date } = req.body;
        const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
        const newPost = new Post({ title, content, date, images: imageUrls, type: 'normal' });
        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        console.error('Error al crear el post:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

app.delete('/api/posts/:id', async (req, res) => {
    try {
        const deletedPost = await Post.findByIdAndDelete(req.params.id);
        if (!deletedPost) return res.status(404).json({ message: 'Publicación no encontrada' });
        res.json({ message: 'Publicación eliminada con éxito' });
    } catch (error) {
        console.error('Error al eliminar el post:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

app.get('/api/posts/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Publicación no encontrada' });
        res.json(post);
    } catch (error) {
        console.error('Error al obtener el post:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

app.put('/api/posts/:id', async (req, res) => {
    try {
        const { title, content } = req.body;
        const updatedPost = await Post.findByIdAndUpdate(req.params.id, { title, content }, { new: true });
        if (!updatedPost) return res.status(404).json({ message: 'Publicación no encontrada' });
        res.json(updatedPost);
    } catch (error) {
        console.error('Error al actualizar el post:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

app.post('/api/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No se subió ningún archivo.' });
        res.status(201).json({ imageUrl: `/uploads/${req.file.filename}` });
    } catch (error) {
        res.status(500).json({ message: 'Error al subir la imagen.' });
    }
});

app.post('/api/articles', async (req, res) => {
    try {
        const newArticle = new Post(req.body);
        await newArticle.save();
        res.status(201).json(newArticle);
    } catch (error) {
        console.error('Error al crear el artículo:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// --- NUEVAS RUTAS PARA PLANTILLAS (EJS) ---
app.get('/', (req, res) => {
    res.render('index', { title: 'Inicio', username: 'Jorge' });
});

app.get('/blog', async (req, res) => {
    const posts = await Post.find().sort({ date: -1 });
    res.render('blog', { title: 'Blog', posts });
});

app.get('/contacto', async (req, res) => {
    const posts = await Post.find().sort({ date: -1 });
    res.render('contacto', { title: 'Contacto', posts });
});

app.get('/login', (req, res) => {
    res.render('login', { title: 'Iniciar sesión' });
});

// --- INICIAR SERVIDOR ---
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
