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

// Funcionalidad nueva: el formulario de contacto que habla con el backend.
import './landing/contact.js';
