// Función reutilizable para el carrusel
function handleCarousel(event) {
    const isNext = event.target.classList.contains('next-btn');
    const isPrev = event.target.classList.contains('prev-btn');
    if (!isNext && !isPrev) return;

    const carousel = event.target.closest('.carousel');
    const img = carousel.querySelector('.carousel-img');
    const images = JSON.parse(carousel.dataset.images);
    let currentIndex = parseInt(img.dataset.index, 10);

    if (isNext) { currentIndex = (currentIndex + 1) % images.length; }
    else if (isPrev) { currentIndex = (currentIndex - 1 + images.length) % images.length; }

    img.src = images[currentIndex];
    img.dataset.index = currentIndex;
}

document.addEventListener('DOMContentLoaded', () => {
    const blogContainer = document.getElementById('blog-container');
    const singlePostContainer = document.getElementById('single-post-container');
    const bannerContainer = document.getElementById('bannerContainer');
    let allPosts = []; // Guardaremos todos los posts aquí para no pedirlos de nuevo

    // --- 1. FUNCIÓN PRINCIPAL PARA OBTENER Y MOSTRAR LA LISTA DE POSTS ---
    async function loadPosts() {
        try {
            const response = await fetch('/api/posts');
            if (!response.ok) throw new Error('No se pudieron cargar las publicaciones.');

            allPosts = await response.json();
            allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
            renderPostList(allPosts);
        } catch (error) {
            console.error(error);
            blogContainer.innerHTML = '<p>Error al cargar el contenido. Inténtalo de nuevo más tarde.</p>';
        }
    }

    // --- 2. FUNCIÓN PARA "DIBUJAR" LA LISTA DE PREVISUALIZACIONES ---
    function renderPostList(posts) {
    blogContainer.innerHTML = ''; // Limpiamos el contenedor

    posts.forEach(post => {
        const postPreview = document.createElement('article');
        postPreview.className = 'post-preview';

        // Buscar la primera imagen disponible
        let previewImage = '/images/placeholder.jpg'; // Imagen por defecto
        if (post.type === 'article' && post.sections?.length > 0) {
            const firstImage = post.sections.find(sec => sec.image)?.image;
            if (firstImage) previewImage = firstImage;
        } else if (post.images?.length > 0) {
            previewImage = post.images[0];
        }

        // Tomar un fragmento del texto
        let previewContent = '';
        if (post.type === 'article') {
            const firstSectionContent = post.sections[0]?.content || '';
            previewContent = `<p>${firstSectionContent}</p>`;
        } else {
            previewContent = `<p>${post.content || ''}</p>`;
        }

        postPreview.innerHTML = `
            <img src="${previewImage}" alt="Miniatura de ${post.title}" class="preview-img">
            <div class="preview-content">
                <h2>${post.title}</h2>
                <small>Publicado el: ${post.date.split('T')[0].split('-').reverse().join('/')}</small>
                ${previewContent}
            </div>
            <button class="read-more-btn" data-id="${post._id}">Ver artículo completo</button>
        `;

        blogContainer.appendChild(postPreview);
    });
}

    // --- 3. FUNCIÓN PARA MOSTRAR UN ÚNICO POST EN DETALLE ---
    function renderSinglePost(postId) {
        const post = allPosts.find(p => p._id === postId);
        if (!post) return;

        singlePostContainer.innerHTML = ''; // Limpiamos antes de dibujar
        let fullContentHTML = '';

        if (post.type === 'article') {
            post.sections.forEach(section => {
                fullContentHTML += `
                    ${section.subtitle ? `<h3>${section.subtitle}</h3>` : ''}
                    <p>${section.content.replace(/\n/g, '<br>')}</p>
                    ${section.image ? `<img src="${section.image}" alt="Imagen de la sección" style="max-width: 100%; height: auto; margin-bottom: 1rem;">` : ''}
                `;
            });
        } else {
            const carouselImages = post.images;

            // Asegúrate de que carouselImages sea un array, incluso si post.images es null o undefined
            const images = Array.isArray(carouselImages) ? carouselImages : [];
            const hasMultipleImages = images.length > 1;

            fullContentHTML = `
    
    <div class="carousel" data-images='${JSON.stringify(images)}' style="margin-top: 1rem;">
        
        <img src="${images[0] || '/images/placeholder.jpg'}" alt="${post.title}" class="carousel-img" data-index="0">
        
        ${hasMultipleImages ? `
          <button class="prev-btn">&lt;</button>
          <button class="next-btn">&gt;</button>
        ` : ''}
        
    </div>

    <p>${post.content.replace(/\n/g, '<br>')}</p>
`;
        }

        singlePostContainer.innerHTML = `
            <article class="full-post">
                <h1>${post.title}</h1>
                <p>Posted by Jorge Gtz | ${post.date.split('T')[0].split('-').reverse().join('/')}</p>
                <div class="full-post-content" style="margin-top: 1rem;">
                    ${fullContentHTML}
                </div>
                <button id="back-btn" class="back-btn-blog">← Volver a la lista</button>
            </article>
        `;

        blogContainer.classList.add('hidden');
        blogContainer.classList.remove('card-blog')
        singlePostContainer.classList.remove('hidden');
        singlePostContainer.classList.add('show-post');
        bannerContainer.classList.add('hidden');
    }

    // --- 4. MANEJO DE CLICS (DELEGACIÓN DE EVENTOS) ---
    document.body.addEventListener('click', (event) => {
        if (event.target.classList.contains('read-more-btn')) {
            const postId = event.target.dataset.id;
            renderSinglePost(postId);
        }

        if (event.target.id === 'back-btn') {
            singlePostContainer.classList.add('hidden');
            singlePostContainer.classList.remove('show-post');
            blogContainer.classList.remove('hidden');
            blogContainer.classList.add('card-blog')
            bannerContainer.classList.remove('hidden');
        }

        handleCarousel(event);
    });

    // --- EJECUCIÓN INICIAL ---
    loadPosts();
});