document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    // Si no hay token, no debería estar aquí, lo regresamos al login.
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Obtenemos los elementos del formulario
    const editForm = document.getElementById('edit-post-form');
    const titleInput = document.getElementById('post-title');
    const contentInput = document.getElementById('post-content');

    // --- 1. OBTENER EL ID DEL POST DESDE LA URL ---
    // URLSearchParams es una herramienta moderna del navegador para trabajar con los parámetros de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id'); // Extraemos el valor del parámetro 'id'

    // Si por alguna razón no hay ID, lo mejor es volver al dashboard.
    if (!postId) {
        window.location.href = 'dashboard.html';
        return;
    }

    // --- 2. FUNCIÓN PARA CARGAR LOS DATOS DEL POST EN EL FORMULARIO ---
    async function loadPostData() {
        try {
            const response = await fetch(`http://localhost:3000/api/posts/${postId}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('No se pudo cargar la información del post.');
            }

            const post = await response.json();

            // Rellenamos el formulario con los datos obtenidos
            titleInput.value = post.title;
            contentInput.value = post.content;

        } catch (error) {
            console.error('Error:', error);
            alert('Error al cargar los datos. Volviendo al dashboard.');
            window.location.href = 'dashboard.html';
        }
    }

    // --- 3. MANEJAR EL ENVÍO DEL FORMULARIO DE EDICIÓN ---
    editForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevenimos la recarga de la página

        // Creamos un objeto con los datos actualizados del formulario
        const updatedData = {
            title: titleInput.value,
            content: contentInput.value
        };

        try {
            const response = await fetch(`http://localhost:3000/api/posts/${postId}`, {
                method: 'PUT',
                headers: {
                    // Como enviamos datos en formato JSON, debemos especificarlo en las cabeceras
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                // Convertimos nuestro objeto de JavaScript a una cadena de texto JSON
                body: JSON.stringify(updatedData)
            });

            if (!response.ok) {
                throw new Error('Error al actualizar la publicación.');
            }

            alert('¡Publicación actualizada con éxito!');
            // Redirigimos al usuario de vuelta al dashboard para que vea los cambios
            window.location.href = 'dashboard.html';

        } catch (error) {
            console.error('Error:', error);
            alert('No se pudo actualizar la publicación.');
        }
    });

    // --- EJECUCIÓN INICIAL ---
    loadPostData();
});