const projects = [
    {
        title: "Gestión de Sesiones",
        description: "En esta práctica, se implementó la funcionalidad de almacenar datos temporales utilizando sesiones en Laravel. Los datos de los alumnos se almacenan, editan y eliminan a través de la sesión, permitiendo mantener la información durante la navegación sin el uso de bases de datos.",
        image: "/img/Laravel-0.jpeg",
        repoUrl: "https://github.com/Jorge-Gutierrez-1110/laravel-sesiones"
    },
    {
        title: "Manejo de Cookies",
        description: "En esta práctica, se aprendió a gestionar datos mediante cookies. Se almacenaron datos de alumnos encriptados en cookies, y se creó una interfaz para agregar, listar, editar y eliminar esos datos, todo manteniéndose en el navegador del usuario.",
        image: "/img/Laravel-1.jpeg",
        repoUrl: "https://github.com/Jorge-Gutierrez-1110/laravel-cookies"
    },
    {
        title: "Encriptación de Datos en Sesiones y Cookies",
        description: "Descripción: En la tercera práctica, se aplicó encriptación de datos sensibles (como correos y contraseñas) en las prácticas anteriores de sesiones y cookies. Se protegieron los datos tanto al almacenarlos como al recuperarlos, garantizando su seguridad en ambos contextos.",
        image: "/img/Laravel-2.jpeg",
        repoUrl: "https://github.com/Jorge-Gutierrez-1110/laravel-cifrado"
    }
];

function createProjectCards() {
    const container = document.getElementById('projectsContainer');
    container.innerHTML = '<p class="loading">Cargando proyectos...</p>';

    setTimeout(() => {
        container.innerHTML = '';
        projects.forEach((project, index) => {
            const card = document.createElement('div');
            card.className = 'project-card fade-in-up';
            card.style.animationDelay = `${index * 0.2}s`;
            card.innerHTML = `
                <img src="${project.image}" alt="${project.title}" class="project-image">
                <div class="project-info">
                    <h3 class="project-title">${project.title}</h3>
                    <p class="project-description">${project.description}</p>
                    <a href="${project.repoUrl}" target="_blank" class="project-link">Ver en GitHub</a>
                </div>
            `;
            container.appendChild(card);
        });
    }, 1000); // Simula un tiempo de carga
}

window.onload = createProjectCards;