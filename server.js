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

// --- Cloudinary
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configurar Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer: memoria + límite mayor para videos
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 200 * 1024 * 1024
    }
});

// 2. Inicializar
const app = express();
const PORT = process.env.PORT || 3000;

// EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Endpoint de EmailJS
app.get("/api/emailjs-config", (req, res) => {
    res.json({
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        serviceId: process.env.EMAILJS_SERVICE_ID,
        templateId: process.env.EMAILJS_TEMPLATE_ID,
    });
});

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Conectado a MongoDB Atlas'))
    .catch(err => console.error('❌ Error MongoDB:', err));

// Middleware JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = req.cookies.token || (authHeader && authHeader.split(' ')[1]);
    if (!token) return res.status(401).json({ message: 'Token no proporcionado.' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token inválido.' });
        req.user = user;
        next();
    });
}

// --- RUTAS API ---

// Obtener posts
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener posts' });
    }
});

// Crear un post (imágenes + videos)
app.post('/api/posts', authenticateToken, upload.array('images', 5), async (req, res) => {
    try {
        const { title, content, date } = req.body;

        // URLs enviadas desde dashboard.js
        let existingUrls = [];
        if (req.body.existingUrls) {
            try {
                existingUrls = JSON.parse(req.body.existingUrls);
                if (!Array.isArray(existingUrls)) existingUrls = [];
            } catch {
                existingUrls = [];
            }
        }

        // Subir blobs/imágenes
        const uploadedUrls = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const result = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        {
                            folder: 'portafolio_uploads',
                            resource_type: 'auto'
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    streamifier.createReadStream(file.buffer).pipe(uploadStream);
                });
                uploadedUrls.push(result.secure_url);
            }
        }

        const imageUrls = [...existingUrls, ...uploadedUrls];

        const newPost = new Post({
            title, content, date,
            images: imageUrls,
            type: "normal"
        });

        await newPost.save();
        res.status(201).json(newPost);

    } catch (error) {
        res.status(500).json({ message: 'Error al crear post', details: error.message });
    }
});

// Editar post
app.put('/api/posts/:id', authenticateToken, async (req, res) => {
    try {
        const { title, content } = req.body;
        const updated = await Post.findByIdAndUpdate(req.params.id, { title, content }, { new: true });
        if (!updated) return res.status(404).json({ message: 'Post no encontrado' });
        res.json(updated);
    } catch {
        res.status(500).json({ message: 'Error al actualizar' });
    }
});

// Eliminar post
app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
    try {
        const deleted = await Post.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Post no encontrado' });
        res.json({ message: 'Eliminado correctamente' });
    } catch {
        res.status(500).json({ message: 'Error al eliminar' });
    }
});

// Obtener por ID
app.get('/api/posts/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post no encontrado' });
        res.json(post);
    } catch {
        res.status(500).json({ message: 'Error al obtener post' });
    }
});

// Crear artículos
app.post('/api/articles', authenticateToken, async (req, res) => {
    try {
        const newArticle = new Post(req.body);
        await newArticle.save();
        res.status(201).json(newArticle);
    } catch {
        res.status(500).json({ message: 'Error creando artículo' });
    }
});

// Subir 1 archivo (imagen o video)
app.post('/api/upload', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No se subió archivo.' });

        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'portafolio_uploads',
                    resource_type: 'auto'
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
        });

        res.status(201).json({
            url: result.secure_url,
            type: result.resource_type
        });

    } catch (error) {
        res.status(500).json({ message: 'Error al subir archivo.' });
    }
});

// --- VISTAS EJS ---
app.get('/', (req, res) => res.render('index', { title: 'Inicio', username: 'Jorge' }));
app.get('/blog', async (req, res) => {
    const posts = await Post.find().sort({ date: -1 });
    res.render('blog', { title: 'Blog', posts });
});
app.get('/contacto', async (req, res) => {
    const posts = await Post.find().sort({ date: -1 });
    res.render('contacto', { title: 'Contacto', posts });
});
app.get('/login', (req, res) => res.render('login', { title: 'Iniciar sesión' }));
app.get('/dashboard', (req, res) => res.render('dashboard', { title: 'Dashboard' }));
app.get('/editPost', async (req, res) => {
    const post = await Post.findById(req.query.id);
    if (!post) return res.status(404).send('Post no encontrado');
    res.render('editPost', { title: 'Editar publicación', post });
});

// LOGIN
app.post('/api/auth/register', async (req, res) => {
    try {
        const count = await User.countDocuments();
        if (count > 0) return res.status(403).json({ message: 'El registro está deshabilitado.' });

        const { username, password } = req.body;
        const hashed = await bcrypt.hash(password, 10);

        await new User({ username, password: hashed }).save();
        res.status(201).json({ message: 'Usuario creado' });
    } catch {
        res.status(500).json({ message: 'Error al registrar' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) return res.status(400).json({ message: 'Credenciales incorrectas' });
        if (!(await bcrypt.compare(password, user.password)))
            return res.status(400).json({ message: 'Credenciales incorrectas' });

        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7200000
        });

        res.json({ message: "Inicio exitoso" });
    } catch {
        res.status(500).json({ message: 'Error al iniciar sesión' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Sesión cerrada" });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor activo en http://localhost:${PORT}`);
});
