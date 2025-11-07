// contact.js

document.addEventListener('DOMContentLoaded', async function () {
    const form = document.getElementById('contactForm');
    if (!form) return;

    try {
        // Obtener configuración desde el servidor
        const res = await fetch('/api/emailjs-config');
        const { publicKey, serviceId, templateId } = await res.json();

        // Inicializar EmailJS con tu Public Key
        emailjs.init(publicKey);

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const message = document.getElementById('message').value.trim();

            emailjs
                .send(serviceId, templateId, {
                    from_name: name,
                    from_email: email,
                    message: message,
                })
                .then(
                    function (response) {
                        console.log('✅ SUCCESS!', response.status, response.text);
                        alert('¡Gracias por tu mensaje! Te contactaré pronto.');
                        form.reset();
                    },
                    function (error) {
                        console.error('❌ FAILED...', error);
                        alert('Hubo un error al enviar el mensaje. Inténtalo nuevamente más tarde.');
                    }
                );
        });

    } catch (error) {
        console.error('Error al cargar configuración de EmailJS:', error);
        alert('Error interno al inicializar el formulario de contacto.');
    }
});

// Funcionalidad para copiar el correo electrónico al portapapeles
document.getElementById("copyBtn").addEventListener("click", function () {
    const email = document.getElementById("emailText").textContent;
    navigator.clipboard.writeText(email)
        .then(() => {
            const msg = document.getElementById("copiedMsg");
            msg.classList.remove("hidden");
            setTimeout(() => msg.classList.add("hidden"), 2000);
        });
});
