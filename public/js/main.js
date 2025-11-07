document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navLinksContainer = document.querySelector('.nav-links');

    // Inicializar iconos de Lucide
    lucide.createIcons();

    // Función para manejar el scroll
    function handleScroll() {
        if (window.scrollY > 20) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Actualizar enlace activo
        let currentSection = '';
        document.querySelectorAll('section').forEach(section => {
            const sectionTop = section.offsetTop - 100;
            if (window.scrollY >= sectionTop) {
                currentSection = section.id;
            }
        });

        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href').slice(1) === currentSection);
        });
    }

    // Evento de scroll
    window.addEventListener('scroll', handleScroll);

    // Alternar menú móvil
    mobileMenuToggle.addEventListener('click', () => {
        navLinksContainer.classList.toggle('show');
        mobileMenuToggle.classList.toggle('mobile-menu-open');
    });

    // Cerrar menú móvil al hacer clic en un enlace
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinksContainer.classList.remove('show');
            mobileMenuToggle.classList.remove('mobile-menu-open');
        });
    });

    // Scroll suave para los enlaces de navegación
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetElement = document.querySelector(this.getAttribute('href'));
            const offsetPosition = targetElement.offsetTop - 70; // Ajusta este valor a la altura de tu navbar

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        });
    });
});

const progressBar = document.getElementById('progress-bar');

function updateProgressBar() {
    const scrollPosition = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const progress = (scrollPosition / (documentHeight - windowHeight)) * 100;
    progressBar.style.width = `${progress}%`;
}

window.addEventListener('scroll', updateProgressBar);