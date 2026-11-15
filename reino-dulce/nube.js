/* El Reino de Dulce · perfiles guardados en la nube
   Cada perfil se guarda como mensaje retenido en dos servidores MQTT públicos,
   y además en el teléfono como respaldo. Siempre gana la copia más reciente. */
'use strict';
window.NUBE = (() => {
  const SALA = 'reino-dulce/brittybee-lalito-9q4x7k2m';
  const BROKERS = window.__BROKERS || ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt'];
  const PERFILES = ['brittani', 'lalito'];
  const tema = (p) => `${SALA}/perfil/${p}`;
  const nube = {};            // perfil -> {t, data}
  const escuchas = [];
  let clientes = [];
  let pendiente = null, timer = null;
  const extras = {};          // tema -> función (mensajes en tiempo real)

  const claveLocal = (p) => 'reinoDulce-v2-' + p;
  function local(p) { try { return JSON.parse(localStorage.getItem(claveLocal(p)) || 'null'); } catch (e) { return null; } }
  function guardarLocal(p, o) { try { localStorage.setItem(claveLocal(p), JSON.stringify(o)); } catch (e) { } }

  function cargarLib() {
    if (window.mqtt) return Promise.resolve();
    return new Promise((ok, mal) => { const s = document.createElement('script'); s.src = 'https://unpkg.com/mqtt@5.10.4/dist/mqtt.min.js'; s.onload = ok; s.onerror = mal; document.head.append(s); });
  }
  const avisar = () => escuchas.forEach(f => { try { f(); } catch (e) { } });
  async function conectar() {
    try { await cargarLib(); } catch (e) { return false; }
    clientes = BROKERS.map(url => {
      let c;
      try { c = mqtt.connect(url, { clientId: 'rd_' + Math.random().toString(16).slice(2, 12), clean: true, connectTimeout: 8000, reconnectPeriod: 5000, keepalive: 30 }); } catch (e) { return null; }
      c.on('connect', () => { c.subscribe(PERFILES.map(tema), { qos: 1 }); const ex = Object.keys(extras); if (ex.length) c.subscribe(ex, { qos: 0 }); avisar(); if (pendiente) enviar(); });
      c.on('message', (t, msg) => {
        if (extras[t]) { try { extras[t](JSON.parse(typeof msg === 'string' ? msg : new TextDecoder().decode(msg))); } catch (e) { } return; }
        try {
          const o = JSON.parse(typeof msg === 'string' ? msg : new TextDecoder().decode(msg));
          const p = t.split('/').pop();
          if (o && o.t && (!nube[p] || o.t > nube[p].t)) { nube[p] = o; avisar(); }
        } catch (e) { }
      });
      c.on('close', avisar); c.on('error', () => { });
      return c;
    }).filter(Boolean);
    return true;
  }
  const conectados = () => clientes.filter(c => c.connected).length;
  // Espera a tener conexión y que lleguen los perfiles guardados
  function esperar(ms = 5000) {
    return new Promise(ok => {
      const ini = Date.now();
      const iv = setInterval(() => {
        const listo = conectados() > 0 && (PERFILES.every(p => nube[p]) || Date.now() - ini > 2500);
        if (listo || Date.now() - ini > ms) { clearInterval(iv); ok(); }
      }, 150);
    });
  }
  // La copia más reciente entre el teléfono y la nube
  function mejor(p) {
    const a = nube[p], b = local(p);
    if (a && b) return a.t >= b.t ? a : b;
    return a || b || null;
  }
  function enviar() {
    if (!pendiente) return;
    const { p, o } = pendiente; const msg = JSON.stringify(o);
    let n = 0;
    for (const c of clientes) if (c.connected) { try { c.publish(tema(p), msg, { qos: 1, retain: true }); n++; } catch (e) { } }
    if (n) { pendiente = null; nube[p] = o; }
    avisar();
    return n;
  }
  // Guarda: en el teléfono al instante; en la nube cada pocos segundos (o ya, si es urgente)
  function guardar(p, data, urgente) {
    const o = { t: Date.now(), data };
    guardarLocal(p, o);
    pendiente = { p, o };
    clearTimeout(timer);
    if (urgente) enviar(); else timer = setTimeout(enviar, 4000);
  }
  // Tiempo real: se manda por todos los servidores conectados (el que recibe ignora repetidos)
  function suscribir(t, fn) { extras[t] = fn; for (const c of clientes) if (c.connected) c.subscribe(t, { qos: 0 }); }
  function publicarRetenido(t, obj) { const m = JSON.stringify(obj); let n = 0; for (const c of clientes) if (c.connected) { try { c.publish(t, m, { qos: 1, retain: true }); n++; } catch (e) { } } return n; }
  function publicar(t, obj) { const m = JSON.stringify(obj); let n = 0; for (const c of clientes) if (c.connected) { try { c.publish(t, m, { qos: 0 }); n++; } catch (e) { } } return n; }
  function estado() { return { conectados: conectados(), pendiente: !!pendiente }; }
  return { SALA, suscribir, publicar, publicarRetenido, PERFILES, conectar, esperar, mejor, guardar, enviar, estado, local, guardarLocal, nube, escuchar: (f) => escuchas.push(f) };
})();
