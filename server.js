// Node server.js
// 1. Importar librerías
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('./models/Post');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const cookieParser = require('cookie-parser'); 

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
app.use(cors({
    origin: true,
    credentials: true // necesario para enviar cookies al frontend
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser()); // habilitar lectura de cookies

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

// Middleware de autenticación con JWT desde cookie
function authenticateToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Token no proporcionado.' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token inválido o expirado.' });
        req.user = user;
        next();
    });
}

// --- RUTAS DE CRUD PROTEGIDAS ---
app.post('/api/posts', authenticateToken, upload.array('images', 5), async (req, res) => {
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

app.put('/api/posts/:id', authenticateToken, async (req, res) => {
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

app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
    try {
        const deletedPost = await Post.findByIdAndDelete(req.params.id);
        if (!deletedPost) return res.status(404).json({ message: 'Publicación no encontrada' });
        res.json({ message: 'Publicación eliminada con éxito' });
    } catch (error) {
        console.error('Error al eliminar el post:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

app.post('/api/articles', authenticateToken, async (req, res) => {
    try {
        const newArticle = new Post(req.body);
        await newArticle.save();
        res.status(201).json(newArticle);
    } catch (error) {
        console.error('Error al crear el artículo:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No se subió ningún archivo.' });
        res.status(201).json({ imageUrl: `/uploads/${req.file.filename}` });
    } catch (error) {
        res.status(500).json({ message: 'Error al subir la imagen.' });
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

app.get('/dashboard', (req, res) => {
    res.render('dashboard', { title: 'Dashboard' });
});

// --- AUTENTICACIÓN (Login / Registro) ---

// Registrar usuario (solo si aún no hay ninguno)
app.post('/api/auth/register', async (req, res) => {
    try {
        const count = await User.countDocuments();
        if (count > 0) {
            return res.status(403).json({ message: 'El registro está deshabilitado.' });
        }

        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({ username, password: hashedPassword });
        await user.save();

        res.status(201).json({ message: 'Usuario creado exitosamente.' });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// Login con cookie segura
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) return res.status(400).json({ message: 'Usuario o contraseña incorrectos.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Usuario o contraseña incorrectos.' });

        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        // Guardar token en cookie segura
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
            sameSite: 'strict',
            maxAge: 2 * 60 * 60 * 1000 // 2 horas
        });

        res.json({ message: 'Inicio de sesión exitoso' });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// Cerrar sesión (limpia la cookie)
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Sesión cerrada correctamente.' });
});

// --- INICIAR SERVIDOR ---
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
