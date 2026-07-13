/* Lince App Shell — solo corre dentro de la app móvil (WebView de Capacitor
   con UA "LinceApp"). Aporta la barra inferior para saltar entre las tres
   apps del origen (Panel /admin, Startup OS y Teams), el botón atrás de
   Android, el status bar acorde al tema y la vuelta a la última app usada.
   Vanilla JS sin build; fuera de la app este archivo ni se solicita.
   Si el puente de Capacitor no está disponible, todo degrada en silencio. */
(function () {
  "use strict";

  var inApp = /LinceApp/.test(navigator.userAgent) || !!window.Capacitor;
  if (!inApp || window.__linceShell) return;
  window.__linceShell = true;

  var html = document.documentElement;
  html.classList.add("lince-app");

  var link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/app-shell.css";
  document.head.appendChild(link);

  /* ---------- sesión ---------- */
  /* supabase-js v2 guarda la sesión por origen como "sb-<ref>-auth-token".
     Las tres apps comparten origen, así que una sola sesión sirve a todas. */
  function hasSession() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i) || "";
        if (/^sb-.+-auth-token$/.test(k) && localStorage.getItem(k)) return true;
      }
    } catch (e) { /* almacenamiento bloqueado */ }
    return false;
  }

  /* ---------- apps del origen ---------- */
  /* Barras finales obligatorias en /teams/ y /startup-os/: el WebView de
     Android no sigue el redirect 308 de /teams → /teams/ al re-pedir HTML. */
  var APPS = [
    {
      id: "admin", href: "/admin", match: /^\/admin(\/|$)/, label: "Panel",
      icon: '<path d="M3 13h8V3H3zm10 8h8V11h-8zM3 21h8v-6H3zm10-18v6h8V3z"/>'
    },
    {
      id: "os", href: "/startup-os/", match: /^\/startup-os(\/|$)/, label: "Startup OS",
      icon: '<path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>'
    },
    {
      id: "teams", href: "/teams/", match: /^\/teams(\/|$)/, label: "Teams",
      icon: '<circle cx="9" cy="7" r="4"/><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/>'
    }
  ];
  var current = null;
  for (var i = 0; i < APPS.length; i++) {
    if (APPS[i].match.test(location.pathname)) { current = APPS[i]; break; }
  }

  /* ---------- volver a la última app usada (solo al arrancar en frío) ---------- */
  /* La app abre siempre /admin (el hub de login). Si ya hay sesión y la última
     app usada fue otra, se vuelve ahí una única vez por arranque. Nunca si hay
     ?next= (ese flujo manda) ni desde subrutas del admin. */
  try {
    var isAdminRoot = current && current.id === "admin" &&
      location.pathname.replace(/\/+$/, "") === "/admin" && !location.search;
    var booted = sessionStorage.getItem("lince-shell-boot");
    sessionStorage.setItem("lince-shell-boot", "1");
    var last = localStorage.getItem("lince-last-app");
    if (!booted && isAdminRoot && hasSession() && last && last !== "/admin") {
      location.replace(last);
      return;
    }
    if (current) localStorage.setItem("lince-last-app", current.href);
  } catch (e) { /* sin almacenamiento no hay restauración */ }

  /* ---------- barra inferior ---------- */
  var nav = null;

  function renderNav() {
    if (nav || !document.body) return;
    nav = document.createElement("nav");
    nav.className = "lince-shell-nav";
    nav.setAttribute("aria-label", "Apps de Lince");
    nav.innerHTML = APPS.map(function (a) {
      var active = current && current.id === a.id;
      return '<a class="lince-shell-item' + (active ? " active" : "") + '" href="' + a.href + '"' +
        (active ? ' aria-current="page"' : "") + ">" +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + a.icon + "</svg>" +
        "<span>" + a.label + "</span></a>";
    }).join("");
    document.body.appendChild(nav);
    html.classList.add("lince-shell-has-nav");
  }

  function removeNav() {
    if (!nav) return;
    nav.remove();
    nav = null;
    html.classList.remove("lince-shell-has-nav");
  }

  /* La barra solo aparece con sesión (en el login no estorba). El evento
     storage no dispara en el propio documento: el intervalo cubre el login. */
  function syncNav() { if (hasSession()) renderNav(); else removeNav(); }

  if (document.body) syncNav();
  else document.addEventListener("DOMContentLoaded", syncNav);
  window.addEventListener("storage", syncNav);
  document.addEventListener("visibilitychange", syncNav);
  setInterval(syncNav, 2000);

  /* ---------- puente Capacitor (best-effort, todo con try/catch) ---------- */
  var Plugins = window.Capacitor && window.Capacitor.Plugins;

  try { Plugins && Plugins.SplashScreen && Plugins.SplashScreen.hide(); } catch (e) {}

  /* Status bar acorde al tema: admin y Startup OS ponen data-theme en <html>;
     Teams no lo usa (es claro fijo) y cae al estilo claro por defecto. */
  function syncStatusBar() {
    try {
      if (!Plugins || !Plugins.StatusBar) return;
      var dark = html.getAttribute("data-theme") === "dark";
      Plugins.StatusBar.setStyle({ style: dark ? "DARK" : "LIGHT" });
      if (Plugins.StatusBar.setBackgroundColor) {
        Plugins.StatusBar.setBackgroundColor({ color: dark ? "#11140E" : "#F7F5F0" });
      }
    } catch (e) {}
  }
  syncStatusBar();
  try {
    new MutationObserver(syncStatusBar)
      .observe(html, { attributes: true, attributeFilter: ["data-theme"] });
  } catch (e) {}

  /* Botón atrás de Android: primero un evento cancelable (un modal abierto
     puede consumirlo con preventDefault), después el historial del WebView,
     y en la raíz se minimiza la app en lugar de cerrarla. */
  try {
    if (Plugins && Plugins.App && Plugins.App.addListener) {
      Plugins.App.addListener("backButton", function (info) {
        var ev = new CustomEvent("lince:backbutton", { cancelable: true });
        document.dispatchEvent(ev);
        if (ev.defaultPrevented) return;
        if ((info && info.canGoBack) || history.length > 1) history.back();
        else if (Plugins.App.minimizeApp) Plugins.App.minimizeApp();
      });
    }
  } catch (e) {}
})();
