/* ===== Interactive WhatsApp demo ===== */
(function(){
  var body = document.getElementById('wa-body');
  var opts = document.getElementById('wa-options');
  var statusEl = document.getElementById('wa-status');
  if(!body || !opts) return;

  function now(){
    var d = new Date();
    return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
  }

  // Conversation tree. Each node: bot messages + options leading to next nodes.
  var tree = {
    start: {
      bot: ["¡Hola! 👋 Soy el asistente de Parrilla El Fogón. ¿En qué te puedo ayudar?"],
      options: [
        { label: "Quiero reservar una mesa", next: "reserva_personas" },
        { label: "Quiero pedir delivery", next: "delivery_zona" },
        { label: "¿Hasta qué hora abren?", next: "consulta_horario" },
        { label: "¿Tienen opciones sin TACC / veggie?", next: "consulta_dieta" }
      ]
    },

    /* ---- RESERVA ---- */
    reserva_personas: {
      user: "Quiero reservar una mesa",
      bot: ["¡Buenísimo! ¿Para cuántas personas sería?"],
      options: [
        { label: "2 personas", next: "reserva_dia", set: {personas: "2 personas"} },
        { label: "4 personas", next: "reserva_dia", set: {personas: "4 personas"} },
        { label: "6 o más", next: "reserva_grupo", set: {personas: "6+ personas"} }
      ]
    },
    reserva_grupo: {
      user: "Somos 6 o más",
      bot: ["Para grupos grandes reservamos con un poco más de anticipación, pero no hay problema 💪 ¿Para qué día lo necesitás?"],
      options: [
        { label: "Este viernes", next: "reserva_hora", set: {dia: "viernes"} },
        { label: "Este sábado", next: "reserva_hora", set: {dia: "sábado"} },
        { label: "Otro día", next: "reserva_dia_libre", set: {} }
      ]
    },
    reserva_dia: {
      user: "Listo",
      bot: ["Perfecto. ¿Qué día te queda cómodo?"],
      options: [
        { label: "Hoy", next: "reserva_hora", set: {dia: "hoy"} },
        { label: "Mañana", next: "reserva_hora", set: {dia: "mañana"} },
        { label: "Este viernes", next: "reserva_hora", set: {dia: "viernes"} },
        { label: "Este sábado", next: "reserva_hora", set: {dia: "sábado"} }
      ]
    },
    reserva_dia_libre: {
      user: "Otro día",
      bot: ["Decime qué día y lo vemos 👇"],
      input: { placeholder: "Ej: jueves que viene", key: "dia", next: "reserva_hora" }
    },
    reserva_hora: {
      user: "Ese día",
      bot: ["¡Anotado! ¿A qué horario?"],
      options: [
        { label: "20:30", next: "reserva_nombre", set: {hora: "20:30"} },
        { label: "21:00", next: "reserva_nombre", set: {hora: "21:00"} },
        { label: "21:30", next: "reserva_nombre", set: {hora: "21:30"} },
        { label: "22:00", next: "reserva_nombre", set: {hora: "22:00"} }
      ]
    },
    reserva_nombre: {
      user: "Ese horario",
      bot: ["¡Genial! ¿A nombre de quién hago la reserva?"],
      input: { placeholder: "Tu nombre", key: "nombre", next: "reserva_confirma", clean: capitalizar }
    },
    reserva_confirma: {
      bot: function(s){ return ["Listo " + (s.nombre || "") + ", dejame confirmar con vos 👇"]; },
      confirm: function(s){
        return {
          type: "Reserva confirmada",
          rows: [
            ["A nombre de", s.nombre || "—"],
            ["Personas", s.personas || "—"],
            ["Día", s.dia || "—"],
            ["Horario", s.hora || "—"]
          ]
        };
      },
      after: function(s){ return ["Tu mesa quedó reservada, " + (s.nombre || "") + ". Te llega un recordatorio por acá una hora antes. ¡Te esperamos! 🔥"]; },
      end: true
    },

    /* ---- DELIVERY ---- */
    delivery_zona: {
      user: "Quiero pedir delivery",
      bot: ["¡Dale! Hacemos envío propio en zona Centro y alrededores, y también llegamos por PedidosYa y Rappi. ¿A qué zona sería?"],
      options: [
        { label: "Centro", next: "delivery_plato", set: {zona: "Centro (envío propio)"} },
        { label: "Pichincha", next: "delivery_plato", set: {zona: "Pichincha (envío propio)"} },
        { label: "Otra zona", next: "delivery_zona_libre", set: {} }
      ]
    },
    delivery_zona_libre: {
      user: "Otra zona",
      bot: ["Decime tu barrio y te confirmo si llegamos con envío propio o te conviene por PedidosYa 👇"],
      input: { placeholder: "Ej: Fisherton, Echesortu...", key: "zona", next: "delivery_zona_check" }
    },
    delivery_zona_check: {
      bot: function(s){ return ["¡Sí, llegamos a " + (s.zona || "tu zona") + "! 🛵 Para esa distancia el envío sale $1.200. ¿Qué te gustaría pedir?"]; },
      options: [
        { label: "Bife de chorizo + guarnición", next: "delivery_bebida", set: {plato: "Bife de chorizo"} },
        { label: "Provoleta + empanadas", next: "delivery_bebida", set: {plato: "Provoleta + empanadas"} },
        { label: "Milanesa napolitana", next: "delivery_bebida", set: {plato: "Milanesa napolitana"} },
        { label: "Parrillada para 2", next: "delivery_bebida", set: {plato: "Parrillada para 2"} }
      ]
    },
    delivery_plato: {
      user: "Esa zona",
      bot: ["¿Qué te gustaría pedir? Estos son los más elegidos hoy:"],
      options: [
        { label: "Bife de chorizo + guarnición", next: "delivery_bebida", set: {plato: "Bife de chorizo"} },
        { label: "Provoleta + empanadas", next: "delivery_bebida", set: {plato: "Provoleta + empanadas"} },
        { label: "Milanesa napolitana", next: "delivery_bebida", set: {plato: "Milanesa napolitana"} },
        { label: "Parrillada para 2", next: "delivery_bebida", set: {plato: "Parrillada para 2"} }
      ]
    },
    delivery_bebida: {
      user: "Eso quiero",
      bot: ["Buena elección 😋 ¿Sumás algo para tomar?"],
      options: [
        { label: "Gaseosa 1,5L", next: "delivery_nombre", set: {bebida: "Gaseosa 1,5L"} },
        { label: "Una cerveza artesanal", next: "delivery_nombre", set: {bebida: "Cerveza artesanal"} },
        { label: "Solo la comida, gracias", next: "delivery_nombre", set: {bebida: "—"} }
      ]
    },
    delivery_nombre: {
      bot: ["¿A nombre de quién preparo el pedido?"],
      input: { placeholder: "Tu nombre", key: "nombre", next: "delivery_confirma", clean: capitalizar }
    },
    delivery_confirma: {
      bot: function(s){ return ["¡Gracias " + (s.nombre || "") + "! Confirmamos el pedido 👇"]; },
      confirm: function(s){
        return {
          type: "Pedido confirmado",
          rows: [
            ["A nombre de", s.nombre || "—"],
            ["Pedido", s.plato || "—"],
            ["Para tomar", s.bebida || "—"],
            ["Entrega", s.zona || "—"],
            ["Tiempo estimado", "35–45 min"],
            ["Pago", "al recibir"]
          ]
        };
      },
      after: function(s){ return ["¡Listo " + (s.nombre || "") + "! Tu pedido entró a la cocina. Te avisamos por acá cuando salga para tu dirección. 🛵"]; },
      end: true
    },

    /* ---- CONSULTAS -> derivan a acción ---- */
    consulta_horario: {
      user: "¿Hasta qué hora abren?",
      bot: ["Hoy atendemos de 20:00 a 00:00 🕗 (y al mediodía de 12 a 15). Estamos en San Martín 1234, Rosario.", "¿Querés que te reserve una mesa así no esperás?"],
      options: [
        { label: "Sí, reservame una mesa", next: "reserva_personas" },
        { label: "Mejor pido delivery", next: "delivery_zona" },
        { label: "No, solo era la consulta", next: "consulta_cierre" }
      ]
    },
    consulta_dieta: {
      user: "¿Tienen opciones sin TACC / veggie?",
      bot: ["¡Sí! 🌱 Tenemos provoleta, ensaladas, papas y guarniciones sin TACC, y opciones veggie a la parrilla. Avisanos al pedir y la cocina lo prepara aparte.", "¿Querés reservar o pedir delivery?"],
      options: [
        { label: "Reservar una mesa", next: "reserva_personas" },
        { label: "Pedir delivery", next: "delivery_zona" },
        { label: "Solo era la consulta", next: "consulta_cierre" }
      ]
    },
    consulta_cierre: {
      user: "Solo era eso, gracias",
      bot: ["¡De nada! Cualquier cosa escribinos por acá cuando quieras. ¡Que tengas buen día! ☀️"],
      after: [],
      end: true,
      softend: true
    }
  };

  var state = {};

  function scrollDown(){ body.scrollTop = body.scrollHeight; }

  function addMsg(text, who){
    var m = document.createElement('div');
    m.className = 'wa-msg ' + who;
    m.textContent = text;
    var t = document.createElement('span');
    t.className = 'wa-time';
    t.textContent = now();
    m.appendChild(t);
    body.appendChild(m);
    scrollDown();
  }

  function showTyping(){
    var t = document.createElement('div');
    t.className = 'wa-typing';
    t.id = 'wa-typing';
    t.innerHTML = '<span></span><span></span><span></span>';
    body.appendChild(t);
    scrollDown();
  }
  function hideTyping(){
    var t = document.getElementById('wa-typing');
    if(t) t.remove();
  }

  function clearOptions(){ opts.innerHTML = ''; }

  function renderOptions(node){
    clearOptions();
    node.options.forEach(function(opt){
      var b = document.createElement('button');
      b.className = 'wa-opt';
      b.textContent = opt.label;
      b.onclick = function(){
        // echo user choice
        addMsg(opt.userEcho || opt.label, 'user');
        if(opt.set){ for(var k in opt.set){ state[k] = opt.set[k]; } }
        clearOptions();
        goTo(opt.next);
      };
      opts.appendChild(b);
    });
  }

  function renderConfirm(node){
    var data = node.confirm(state);
    var box = document.createElement('div');
    box.className = 'wa-confirm';
    var head = '<div class="wa-confirm-head"><svg width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#3D5A45" stroke-width="1.6"/><path d="M6 10.5 L9 13.5 L14 7" stroke="#3D5A45" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' + data.type + '</div>';
    var rows = data.rows.map(function(r){
      return '<div class="wa-confirm-row"><span>' + r[0] + '</span><span>' + r[1] + '</span></div>';
    }).join('');
    box.innerHTML = head + rows;
    body.appendChild(box);
    scrollDown();
  }

  function renderRestart(soft){
    clearOptions();
    var b = document.createElement('button');
    b.className = 'wa-restart';
    b.textContent = soft ? '↺ Probar de nuevo' : '↺ Empezar otra conversación';
    b.onclick = function(){ state = {}; body.innerHTML = ''; start(); };
    opts.appendChild(b);
  }

  // resolve bot/after that may be an array or a function returning an array
  function resolveMsgs(field){
    if(!field) return [];
    if(typeof field === 'function') return field(state).slice();
    return field.slice();
  }

  // Capitalize each word (for names)
  function capitalizar(v){
    return v.split(' ').map(function(w){
      return w.length ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w;
    }).join(' ');
  }

  // Input validators: return null if OK, or an error string the bot will reply.
  var validators = {
    nombre: function(v){
      if(v.length < 2) return "Necesito un nombre para anotar la reserva 🙂 ¿Cómo te llamás?";
      if(/[0-9]/.test(v)) return "Mmm, eso no parece un nombre. ¿Me decís tu nombre así anoto la reserva?";
      if(v.length > 30) return "Con tu nombre o apodo alcanza 🙂";
      return null;
    },
    dia: function(v){
      var t = v.toLowerCase();
      var dias = ['lunes','martes','miércoles','miercoles','jueves','viernes','sábado','sabado','domingo'];
      var palabras = ['hoy','mañana','manana','pasado','finde','fin de semana','semana','viene','próximo','proximo'];
      var tieneDia = dias.some(function(d){ return t.indexOf(d) !== -1; });
      var tienePalabra = palabras.some(function(p){ return t.indexOf(p) !== -1; });
      var tieneFecha = /\d{1,2}([\/\-]\d{1,2})?/.test(t); // 15, 15/3, 15-3
      if(!tieneDia && !tienePalabra && !tieneFecha){
        return "No me quedó claro el día 🤔 Decime un día de la semana o una fecha (ej: \"sábado\", \"el 20\", \"mañana\").";
      }
      return null;
    },
    zona: function(v){
      if(v.length < 3) return "¿Me decís el nombre de tu barrio o zona? Así te confirmo el envío.";
      if(/^\d+$/.test(v)) return "Necesito el nombre de la zona o barrio, no un número 🙂";
      return null;
    }
  };

  function renderInput(node){
    clearOptions();
    var cfg = node.input;
    var row = document.createElement('div');
    row.className = 'wa-input-row';
    var inp = document.createElement('input');
    inp.type = 'text';
    inp.placeholder = cfg.placeholder || 'Escribí acá...';
    inp.maxLength = 40;
    var send = document.createElement('button');
    send.className = 'wa-send';
    send.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 12 L20 4 L13 20 L11 13 Z" fill="#fff"/></svg>';
    send.disabled = true;
    inp.addEventListener('input', function(){ send.disabled = inp.value.trim().length === 0; });
    function submit(){
      var val = inp.value.trim();
      if(!val) return;
      // echo the user's message first
      addMsg(val, 'user');
      // validate
      var validate = validators[cfg.validate || cfg.key];
      var err = validate ? validate(val) : null;
      if(err){
        // bot replies with the correction request, then re-shows the same input
        clearOptions();
        statusEl.textContent = 'escribiendo...';
        showTyping();
        setTimeout(function(){
          hideTyping();
          statusEl.textContent = 'en línea';
          addMsg(err, 'bot');
          setTimeout(function(){ renderInput(node); }, 250);
        }, 600);
        return;
      }
      // valid: clean up the value for display, store, advance
      state[cfg.key] = cfg.clean ? cfg.clean(val) : val;
      clearOptions();
      goTo(cfg.next);
    }
    send.onclick = submit;
    inp.addEventListener('keydown', function(e){ if(e.key === 'Enter') submit(); });
    row.appendChild(inp);
    row.appendChild(send);
    opts.appendChild(row);
    inp.focus();
  }

  function goTo(key){
    var node = tree[key];
    if(!node) return;
    statusEl.textContent = 'escribiendo...';
    showTyping();
    var delay = 650;
    setTimeout(function(){
      hideTyping();
      statusEl.textContent = 'en línea';
      var msgs = resolveMsgs(node.bot);
      function emit(){
        if(msgs.length){
          addMsg(msgs.shift(), 'bot');
          if(msgs.length){ setTimeout(emit, 560); return; }
        }
        // confirm card
        if(node.confirm){
          setTimeout(function(){
            renderConfirm(node);
            var afterMsgs = resolveMsgs(node.after);
            if(afterMsgs.length){
              setTimeout(function(){ addMsg(afterMsgs[0], 'bot'); }, 650);
              setTimeout(function(){ renderRestart(false); }, 1100);
            } else {
              setTimeout(function(){ renderRestart(false); }, 700);
            }
          }, 450);
          return;
        }
        if(node.input){ setTimeout(function(){ renderInput(node); }, 200); return; }
        if(node.options){ renderOptions(node); return; }
        if(node.end){ renderRestart(node.softend); return; }
      }
      emit();
    }, delay);
  }

  function start(){
    var node = tree.start;
    addMsg(node.bot[0], 'bot');
    setTimeout(function(){ renderOptions(node); }, 350);
  }

  // Start when the chat scrolls into view (once)
  var started = false;
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting && !started){
          started = true;
          start();
          io.disconnect();
        }
      });
    }, { threshold: 0.4 });
    io.observe(document.getElementById('wa-demo'));
  } else {
    start();
  }
})();
