document.addEventListener('DOMContentLoaded', () => {
    // --- VARIABLES GLOBALES Y SELECTORES DE ELEMENTOS ---
    const token = localStorage.getItem('token');
    const logoutButton = document.getElementById('logoutButton');
    const postsListContainer = document.getElementById('posts-list');
    
    // Formularios
    const createPostForm = document.getElementById('create-post-form');
    const createArticleForm = document.getElementById('create-article-form');

    // Elementos del Modal Cropper
    const cropperModal = document.getElementById('cropper-modal');
    const imageToCrop = document.getElementById('image-to-crop');
    const cropAndSaveBtn = document.getElementById('crop-and-save-btn');
    const cancelCropBtn = document.getElementById('cancel-crop-btn');
    const postImagesInput = document.getElementById('post-images');
    const previewsContainer = document.getElementById('cropped-previews-container');

    // Variables de estado para el Cropper
    let cropper;
    let filesToCrop = [];
    let currentFileIndex = 0;
    let croppedFiles = [];

    // 🔥 YA NO USAMOS VIDEOS NI URLs DE VIDEOS
    let uploadedUrls = []; // ← queda, pero no se llenará nunca

    // --- 1. AUTENTICACIÓN Y SESIÓN ---
    function checkAuth() {
        if (!token) { window.location.href = 'login'; }
    }
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'login';
    });

    // --- 2. OBTENER Y RENDERIZAR POSTS ---
    async function fetchPosts() {
        try {
            const response = await fetch('/api/posts', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('No se pudieron cargar los posts.');
            const posts = await response.json();
            renderPosts(posts);
        } catch (error) { console.error('Error al obtener posts:', error); }
    }

    function renderPosts(posts) {
        postsListContainer.innerHTML = '';
        if (posts.length === 0) {
            postsListContainer.innerHTML = '<p>No hay publicaciones. ¡Crea una!</p>';
            return;
        }
        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.className = 'post-item';
            postElement.dataset.id = post._id;
            if (post.type === 'article') {
                const firstImage = post.sections.find(s => s.image)?.image || '/images/placeholder.jpg';
                postElement.innerHTML = `<h3>${post.title} (Artículo)</h3><p>${post.date}</p><div class="preview-image"><img src="${firstImage}" alt="${post.title}" width="200"></div><div class="post-actions"><button class="edit-btn">Editar</button><button class="delete-btn">Eliminar</button></div>`;
            } else {
                postElement.innerHTML = `<h3>${post.title}</h3><p>${post.date}</p><div class="carousel" data-images='${JSON.stringify(post.images)}'><div class="carousel-image-container"><img src="${post.images[0] || '/images/placeholder.jpg'}" alt="${post.title}" class="carousel-img" data-index="0"></div><button class="prev-btn" ${post.images.length <= 1 ? 'disabled' : ''}>Anterior</button><button class="next-btn" ${post.images.length <= 1 ? 'disabled' : ''}>Siguiente</button></div><div class="post-actions"><button class="edit-btn">Editar</button><button class="delete-btn">Eliminar</button></div>`;
            }
            postsListContainer.appendChild(postElement);
        });
    }

    // --- 3. LÓGICA DEL RECORTADOR DE IMÁGENES (CROPPER.JS) ---
    function openCropper(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imageToCrop.src = e.target.result;
            cropperModal.classList.remove('hidden');
            if (cropper) cropper.destroy();
            cropper = new Cropper(imageToCrop, { aspectRatio: 1 / 1, viewMode: 1, background: false, autoCropArea: 0.8 });
        };
        reader.readAsDataURL(file);
    }

    // 🔥 SOLO ACEPTAR IMÁGENES
    postImagesInput.addEventListener('change', (event) => {
        const selectedFiles = Array.from(event.target.files);

        filesToCrop = [];
        croppedFiles = [];
        previewsContainer.innerHTML = '';
        currentFileIndex = 0;

        selectedFiles.forEach(file => {
            if (!file.type.startsWith("image/")) {
                alert("Solo se permiten imágenes.");
                return;
            }
            filesToCrop.push(file);
        });

        if (filesToCrop.length > 0) {
            openCropper(filesToCrop[currentFileIndex]);
        }
    });

    cancelCropBtn.addEventListener('click', () => {
        cropperModal.classList.add('hidden');
        if (cropper) cropper.destroy();
        postImagesInput.value = '';
        croppedFiles = [];
        previewsContainer.innerHTML = '';
        uploadedUrls = [];
    });

    cropAndSaveBtn.addEventListener('click', () => {
        if (!cropper) return;
        cropper.getCroppedCanvas({ width: 800, height: 800 }).toBlob((blob) => {
            croppedFiles.push(blob);
            const previewUrl = URL.createObjectURL(blob);
            const imgPreview = document.createElement('img');
            imgPreview.src = previewUrl;
            imgPreview.style.cssText = 'width: 80px; height: 80px; object-fit: cover; margin: 5px;';
            previewsContainer.appendChild(imgPreview);
            currentFileIndex++;
            if (currentFileIndex < filesToCrop.length) {
                openCropper(filesToCrop[currentFileIndex]);
            } else {
                cropperModal.classList.add('hidden');
            }
        }, 'image/jpeg');
    });

    // --- 4. CREAR POSTS ---
    createPostForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData();
        formData.append('title', createPostForm.querySelector('#post-title').value);
        formData.append('date', createPostForm.querySelector('#post-date').value);
        formData.append('content', createPostForm.querySelector('#post-content').value);

        croppedFiles.forEach((file, index) => {
            formData.append('images', file, `image-${index}.jpg`);
        });

        // 🔥 YA NO SE ENVIAN VIDEOS
        // uploadedUrls vacío → no afecta nada

        try {
            const response = await fetch('/api/posts', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Error al crear la publicación. Server said: ${text}`);
            }
            createPostForm.reset();
            previewsContainer.innerHTML = '';
            croppedFiles = [];
            uploadedUrls = [];
            fetchPosts();
        } catch (error) { console.error(error); alert('Error al crear la publicación. Revisa la consola.'); }
    });

    // --- 5. ARTÍCULOS DINÁMICOS (SE QUEDA IGUAL) ---
    // No lo toco porque ya funciona perfecto.

    const addSectionBtn = document.getElementById('add-section-btn');
    const sectionsContainer = document.getElementById('dynamic-sections-container');
    addSectionBtn.addEventListener('click', () => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'dynamic-section';
        sectionDiv.innerHTML = `<h4>Nueva Sección</h4><div class="form-group"><label>Subtítulo:</label><input type="text" class="section-subtitle"></div><div class="form-group"><label>Contenido:</label><textarea rows="4" class="section-content"></textarea></div><div class="form-group"><label>Imagen:</label><input type="file" class="section-image" accept="image/*"></div><button type="button" class="remove-section-btn">Eliminar</button><hr>`;
        sectionsContainer.appendChild(sectionDiv);
    });

    createArticleForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
            const sectionsData = [];
            const sectionElements = document.querySelectorAll('.dynamic-section');
            for (const sectionEl of sectionElements) {
                const imageFile = sectionEl.querySelector('.section-image').files[0];
                let imageUrl = null;
                if (imageFile) {
                    const formData = new FormData();
                    formData.append('images', imageFile);
                    const response = await fetch('/api/upload', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
                    if (!response.ok) throw new Error('Falló la subida de una de las imágenes.');
                    const result = await response.json();
                    imageUrl = result.imageUrl;
                }
                sectionsData.push({
                    subtitle: sectionEl.querySelector('.section-subtitle').value,
                    content: sectionEl.querySelector('.section-content').value,
                    image: imageUrl
                });
            }
            const articlePayload = {
                title: document.getElementById('article-title').value,
                date: document.getElementById('article-date').value,
                type: 'article',
                sections: sectionsData
            };
            const finalResponse = await fetch('/api/articles', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(articlePayload) });
            if (!finalResponse.ok) throw new Error('Error al guardar el artículo final.');
            alert('¡Artículo creado con éxito!');
            createArticleForm.reset();
            sectionsContainer.innerHTML = '';
            fetchPosts();
        } catch (error) {
            console.error('Error en el proceso de creación del artículo:', error);
            alert('Hubo un error al crear el artículo.');
        }
    });

    // --- 6. EVENTOS (ELIMINAR, EDITAR, CARRUSEL) ---
    document.body.addEventListener('click', async (event) => {
        const target = event.target;

        if (target.classList.contains('remove-section-btn')) {
            target.closest('.dynamic-section').remove();
        }

        const postElement = target.closest('.post-item');
        if (postElement) {
            const postId = postElement.dataset.id;

            if (target.classList.contains('delete-btn')) {
                if (confirm('¿Estás seguro?')) {
                    try {
                        await fetch(`/api/posts/${postId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                        fetchPosts();
                    } catch (error) { console.error(error); }
                }
            }

            if (target.classList.contains('edit-btn')) {
                window.location.href = `editPost?id=${postId}`;
            }

            const isNext = target.classList.contains('next-btn');
            const isPrev = target.classList.contains('prev-btn');

            if (isNext || isPrev) {
                const carousel = target.closest('.carousel');
                const img = carousel.querySelector('.carousel-img');
                const images = JSON.parse(carousel.dataset.images);
                let currentIndex = parseInt(img.dataset.index, 10);

                if (isNext) { currentIndex = (currentIndex + 1) % images.length; }
                else { currentIndex = (currentIndex - 1 + images.length) % images.length; }

                img.src = images[currentIndex];
                img.dataset.index = currentIndex;
            }
        }
    });

    // --- EJECUCIÓN INICIAL ---
    checkAuth();
    fetchPosts();
});
