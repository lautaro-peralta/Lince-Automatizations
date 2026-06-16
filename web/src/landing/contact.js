/**
 * Conecta el formulario de contacto de la landing con el backend.
 *
 * Flujo:
 *   1. Intercepta el submit del <form id="lead-form">.
 *   2. Valida en el cliente (HTML5 + chequeos propios).
 *   3. Si el honeypot viene lleno, simula éxito y descarta (anti-spam).
 *   4. POST /api/leads al backend; muestra feedback de éxito o error.
 *
 * Es tolerante a fallos: si el backend está dormido o caído, el usuario ve
 * un mensaje claro y el botón se rehabilita para reintentar.
 */
import { apiFetch } from '../lib/api.js';

const form = document.getElementById('lead-form');
// Si por alguna razón el form no está en la página, no hacemos nada.
if (form) {
  const feedback = document.getElementById('lead-feedback');
  const submitBtn = document.getElementById('lead-submit');
  const honeypot = form.querySelector('.lead-hp');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    form.classList.add('was-validated'); // habilita los estilos de campo inválido

    // Validación nativa del navegador (campos required, maxlength, etc.).
    if (!form.checkValidity()) {
      setFeedback('Revisá los campos marcados, por favor.', 'err');
      return;
    }

    // Trampa anti-bots: un humano nunca completa este campo oculto.
    if (honeypot && honeypot.value.trim() !== '') {
      setFeedback('¡Gracias! Te vamos a contactar.', 'ok');
      form.reset();
      return;
    }

    const payload = {
      name: form.name.value.trim(),
      business: form.business.value.trim(),
      contact: form.contact.value.trim(),
      message: form.message.value.trim(),
      // El backend usa este campo para descartar spam silenciosamente.
      website: honeypot ? honeypot.value : '',
    };

    setLoading(true);
    setFeedback('Enviando…', '');

    try {
      await apiFetch('/api/leads', { method: 'POST', body: payload });
      form.reset();
      form.classList.remove('was-validated');
      setFeedback('¡Listo! Recibimos tu mensaje. Te respondemos dentro de 24 hs.', 'ok');
    } catch (err) {
      // Mensaje del backend si lo hay; si no, uno genérico.
      const msg =
        err.status === 0
          ? 'No pudimos conectar con el servidor. Probá de nuevo en un minuto.'
          : err.message || 'Algo salió mal. Intentá otra vez.';
      setFeedback(msg, 'err');
    } finally {
      setLoading(false);
    }
  });

  function setLoading(isLoading) {
    if (!submitBtn) return;
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? 'Enviando…' : 'Contar mi caso';
  }

  function setFeedback(text, kind) {
    if (!feedback) return;
    feedback.textContent = text;
    feedback.className = 'lead-feedback' + (kind ? ' ' + kind : '');
  }
}
