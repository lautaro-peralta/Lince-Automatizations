/**
 * Conecta el formulario de prospectos de la landing con el backend.
 *
 * Flujo:
 *   1. Intercepta el submit del <form id="prospect-form">.
 *   2. Valida en el cliente (HTML5 + chequeos propios).
 *   3. Si el honeypot viene lleno, simula éxito y descarta (anti-spam).
 *   4. POST /api/prospects al backend; muestra feedback de éxito o error.
 */
import { apiFetch } from '../lib/api.js';

const form = document.getElementById('prospect-form');
if (form) {
  const feedback = document.getElementById('prospect-feedback');
  const submitBtn = document.getElementById('prospect-submit');
  const honeypot = form.querySelector('.lead-hp');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    form.classList.add('was-validated');

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
      nombre:   form.nombre.value.trim(),
      email:    form.email.value.trim(),
      telefono: form.telefono?.value.trim() || '',
      rubro:    form.rubro?.value.trim()    || '',
      mensaje:  form.mensaje?.value.trim()  || '',
      website:  honeypot ? honeypot.value : '',
    };

    setLoading(true);
    setFeedback('Enviando…', '');

    try {
      await apiFetch('/api/prospects', { method: 'POST', body: payload });
      form.reset();
      form.classList.remove('was-validated');
      setFeedback('¡Listo! Recibimos tu mensaje. Te respondemos dentro de 24 hs.', 'ok');
    } catch (err) {
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
