/**
 * Punto de entrada del frontend (lo carga index.html como módulo ES).
 *
 * Vite empaqueta y versiona todo lo que se importe desde acá. Cada módulo
 * de la landing se ejecuta por su efecto secundario (se auto-inicializan
 * cuando el DOM ya está parseado, porque los módulos ES son `defer`).
 */

// Demos y comportamiento de la landing (código original, preservado tal cual).
import './landing/chatbot.js'; // chatbot interactivo de WhatsApp (datos simulados)
import './landing/reveal.js'; // animación de aparición al hacer scroll
import './landing/sky.js'; // estrella brillosa + destellos decorativos (puramente estético)

// Formulario de contacto original (leads internos del CRM).
import './landing/contact.js';
// Formulario de prospectos del sitio web → POST /api/prospects.
import './landing/prospects.js';

// Registro de conversaciones del chatbot: OPCIONAL y apagado por defecto.
// Import dinámico para no sumar peso ni requests si no está activado.
// Se enciende poniendo VITE_CHATBOT_LOGGING=true (recién con el backend arriba).
if (import.meta.env.VITE_CHATBOT_LOGGING === 'true') {
  import('./landing/chatbot-logging.js');
}
