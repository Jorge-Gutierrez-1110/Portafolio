document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    // Si no hay token, redirigir al login.
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // Obtenemos los elementos del formulario
    const editForm = document.getElementById('edit-post-form');
    const titleInput = document.getElementById('post-title');
    const contentInput = document.getElementById('post-content');

    // --- 1. OBTENER EL ID DEL POST DESDE LA URL ---
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    // Si no hay ID, regresar al dashboard
    if (!postId) {
        window.location.href = '/dashboard';
        return;
    }

    // --- 2. FUNCIÓN PARA CARGAR LOS DATOS DEL POST ---
    async function loadPostData() {
        try {
            const response = await fetch(`/api/posts/${postId}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('No se pudo cargar la información del post.');
            }

            const post = await response.json();

            // Rellenamos el formulario
            titleInput.value = post.title || '';
            contentInput.value = post.content || '';

        } catch (error) {
            console.error('Error al cargar los datos:', error);
            alert('Error al cargar los datos. Volviendo al dashboard.');
            window.location.href = '/dashboard';
        }
    }

    // --- 3. MANEJAR EL ENVÍO DEL FORMULARIO DE EDICIÓN ---
    editForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const updatedData = {
            title: titleInput.value,
            content: contentInput.value
        };

        try {
            const response = await fetch(`/api/posts/${postId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedData)
            });

            if (!response.ok) {
                throw new Error('Error al actualizar la publicación.');
            }

            alert('¡Publicación actualizada con éxito!');
            window.location.href = '/dashboard';

        } catch (error) {
            console.error('Error al actualizar la publicación:', error);
            alert('No se pudo actualizar la publicación.');
        }
    });

    // --- 4. EJECUCIÓN INICIAL ---
    loadPostData();
});
