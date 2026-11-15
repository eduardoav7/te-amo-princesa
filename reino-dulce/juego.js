/* El Reino de Dulce · el juego */
'use strict';
window.iniciarReino = function (opc = {}) {
  const PERFIL = opc.perfil || 'brittani', ES_EL = PERFIL === 'lalito';
  const T = (ella, el) => ES_EL ? el : ella;
  const $ = (id) => document.getElementById(id);
  const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const azar = (a, b) => a + Math.random() * (b - a);
  const ahoraMs = () => Date.now();

  /* =========================================================
     ESTADO Y GUARDADO
     ========================================================= */
  const CLAVE = 'reinoDulce-v1';
  const AGUA_MS = 2 * 3600e3, CRECE_BOTON = 90e3, CRECE_FLOR = 210e3;
  function estadoNuevo() {
    return {
      v: 1, monedas: 40, inv: {}, casas: [null, null, null],
      ropa: { top: 'blusaRosa', abajo: 'jeans', zapatos: 'tenis', acc: 'nada', peinado: 'suelto' },
      ropaTengo: ['blusaRosa', 'jeans', 'tenis', 'nada', 'suelto'],
      vehTengo: [], veh: null, colocados: [], flores: [], metas: {}, stats: {},
      pos: { x: 0, z: 16, ry: Math.PI }, hora: .32, musica: true, efectos: true, nuevo: true,
    };
  }
  let E = Object.assign(estadoNuevo(), opc.data || {});
  if (ES_EL && E.nuevo && !opc.data) { E.ropa = { top: 'blusaRosa', abajo: 'jeans', zapatos: 'tenis', acc: 'nada', peinado: 'suelto' }; }
  function guardar(urgente) { if (window.NUBE) NUBE.guardar(PERFIL, E, urgente === true); pintarNube(); }
  function pintarNube() {
    const el = document.getElementById('nubeEstado'); if (!el || !window.NUBE) return;
    const st = NUBE.estado();
    const tx = st.conectados ? (st.pendiente ? '☁️ Guardando…' : '☁️ Guardado') : '📱 Sin nube';
    if (el.textContent !== tx) el.textContent = tx;
  }
  if (window.NUBE) { NUBE.escuchar(pintarNube); setInterval(pintarNube, 2000); }
  const cuenta = (id) => E.inv[id] || 0;
  const dar = (id, n = 1) => { E.inv[id] = cuenta(id) + n; };
  const alcanza = (pide) => Object.entries(pide).every(([k, n]) => cuenta(k) >= n);
  const gastar = (pide) => { for (const [k, n] of Object.entries(pide)) E.inv[k] = cuenta(k) - n; };
  const stat = (k, n = 1) => { E.stats[k] = (E.stats[k] || 0) + n; };
  const infoItem = (id) => ITEMS[id] || MUEBLES.find(m => m.id === id) || DECOR.find(m => m.id === id) || (FLORES.find(f => 'sem_' + f.id === id) && { n: 'Semilla de ' + FLORES.find(f => 'sem_' + f.id === id).n, e: '🌱' }) || RECETAS.find(r => r.id === id) || { n: id, e: '❔' };

  /* =========================================================
     THREE: escena, luces, cielo
     ========================================================= */
  const cont = $('lienzo');
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  cont.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, .1, 900);
  scene.fog = new THREE.Fog(0xffe6f2, 70, 230);

  const hemi = new THREE.HemisphereLight(0xfff0f7, 0xc6f0cf, .55); scene.add(hemi);
  const sol = new THREE.DirectionalLight(0xfff3e0, .62);
  sol.castShadow = true; const movil = matchMedia('(pointer: coarse)').matches; sol.shadow.mapSize.set(movil ? 1024 : 2048, movil ? 1024 : 2048);
  const sc = sol.shadow.camera; sc.left = -38; sc.right = 38; sc.top = 38; sc.bottom = -38; sc.near = 1; sc.far = 160;
  sol.shadow.bias = -.0006; sol.shadow.normalBias = .03;
  scene.add(sol, sol.target);
  const amb = new THREE.AmbientLight(0xffffff, .12); scene.add(amb);

  // Cielo degradado
  const cieloU = { arriba: { value: new THREE.Color('#8fd0ff') }, abajo: { value: new THREE.Color('#ffe6f2') } };
  const cielo = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), new THREE.ShaderMaterial({
    uniforms: cieloU, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 arriba; uniform vec3 abajo; varying vec3 vP; void main(){ float h = clamp(vP.y*1.6+.25,0.,1.); gl_FragColor = vec4(mix(abajo, arriba, pow(h,.8)),1.); }',
  }));
  scene.add(cielo);
  // Estrellas
  const estrellasGeo = new THREE.BufferGeometry(); const ep = [];
  for (let i = 0; i < 500; i++) { const a = Math.random() * Math.PI * 2, b = Math.random() * .9 + .08; ep.push(Math.cos(a) * Math.cos(b) * 450, Math.sin(b) * 450, Math.sin(a) * Math.cos(b) * 450); }
  estrellasGeo.setAttribute('position', new THREE.Float32BufferAttribute(ep, 3));
  const estrellasMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.4, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
  const estrellas = new THREE.Points(estrellasGeo, estrellasMat); scene.add(estrellas);
  const luna = new THREE.Mesh(new THREE.SphereGeometry(10, 20, 14), new THREE.MeshBasicMaterial({ color: 0xfff6d6, transparent: true, opacity: 0, fog: false }));
  scene.add(luna);

  const mundo = new THREE.Group(); scene.add(mundo);
  const interior = new THREE.Group(); interior.visible = false; scene.add(interior);
  const INT = V3(1000, 0, 0); // dónde está la habitación
  interior.position.copy(INT);

  /* =========================================================
     MUNDO
     ========================================================= */
  const colisiones = [];     // {x,z,r}
  const interactivos = [];   // {x,z,r, ic, txt(), fn, fn2, ic2, activo(), dentro}
  const nodos = [];          // recursos
  const animados = [];       // funciones (t, dt)
  const RADIO = 92;
  const riox = (z) => -36 + Math.sin(z * .045) * 5;
  const PUENTES = [0, -46, 44];

  // Isla con capas de pastel
  const texPiso = texCanvas(512, 512, (x, w) => {
    x.fillStyle = '#c9f0cf'; x.fillRect(0, 0, w, w);
    for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${170 + Math.random() * 40},${225 + Math.random() * 30},${180 + Math.random() * 30},.5)`; x.beginPath(); x.arc(Math.random() * w, Math.random() * w, 2 + Math.random() * 6, 0, 7); x.fill(); }
    const cs = ['#ff8fb8', '#ffd23f', '#9ad7ff', '#b89cf5', '#ffffff', '#7bd389'];
    for (let i = 0; i < 160; i++) { x.save(); x.translate(Math.random() * w, Math.random() * w); x.rotate(Math.random() * 6); x.fillStyle = cs[i % 6]; redondo(x, -7, -2, 14, 4.5, 2.2); x.fill(); x.restore(); }
  }, [26, 26]);
  const texCapas = texCanvas(64, 256, (x) => {
    const cs = ['#ffe9c7', '#ff9fc4', '#fff4e0', '#f6c48e', '#ffe9c7', '#ff8fb8', '#fff4e0', '#9b6b4a'];
    cs.forEach((c, i) => { x.fillStyle = c; x.fillRect(0, i * 32, 64, 32); });
  }, [40, 1]);
  const isla = new THREE.Mesh(new THREE.CylinderGeometry(RADIO + 3, RADIO + 1, 7, 96, 1), [
    new THREE.MeshLambertMaterial({ map: texCapas }), new THREE.MeshLambertMaterial({ map: texPiso }), mat('#9b6b4a')]);
  isla.position.y = -3.5; isla.receiveShadow = true; mundo.add(isla);
  const fondoIsla = new THREE.Mesh(new THREE.ConeGeometry(RADIO + 1, 46, 48, 1, true), new THREE.MeshLambertMaterial({ color: '#7a4a32', side: THREE.DoubleSide }));
  fondoIsla.rotation.x = Math.PI; fondoIsla.position.y = -7 - 23; mundo.add(fondoIsla);
  const betun = new THREE.Mesh(new THREE.TorusGeometry(RADIO + 2.6, 1, 8, 120), mat('#ffffff')); betun.rotation.x = Math.PI / 2; betun.position.y = .05; mundo.add(betun);
  { // goteo de betún por la orilla
    const n = 140, im = new THREE.InstancedMesh(geo('esf', 1, 10, 8), mat('#ffffff'), n); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, l = 1.2 + Math.random() * 2.6; m4.compose(V3(Math.cos(a) * (RADIO + 3.2), -l / 2, Math.sin(a) * (RADIO + 3.2)), q, V3(.9, l, .9)); im.setMatrixAt(i, m4); }
    mundo.add(im);
  }

  // Caminos de fondant
  const matCamino = mat('#ffd9e8');
  const puntosCamino = [];
  function camino(x1, z1, x2, z2, ancho = 4.2) {
    const dx = x2 - x1, dz = z2 - z1, L = Math.hypot(dx, dz);
    const m = malla(geo('caja', ancho, .08, L), matCamino, (x1 + x2) / 2, .04, (z1 + z2) / 2, mundo, false); m.receiveShadow = true;
    m.rotation.y = Math.atan2(dx, dz);
    for (let d = 1.5; d < L; d += 2.4) for (const s of [-1, 1]) { const nx = dz / L, nz = -dx / L; puntosCamino.push([x1 + dx * d / L + nx * s * ancho / 2, z1 + dz * d / L + nz * s * ancho / 2]); }
  }
  const disco = (x, z, r, c) => { const d = malla(geo('cil', r, r, .1, 48), c, x, .05, z, mundo, false); d.receiveShadow = true; return d; };
  disco(0, 0, 11, '#ffe9f2');
  malla(geo('toro', 11, .25, 6, 64), '#ffffff', 0, .1, 0, mundo, false).rotation.x = Math.PI / 2;
  camino(0, -10, 0, -36); camino(-24, -34, 24, -34); camino(-24, -34, -24, -37); camino(24, -34, 24, -37);
  camino(0, 10, 0, 36, 5); camino(-34, 34, 34, 34, 4); camino(-10, 0, -60, 0); camino(10, 0, 56, -4);
  camino(30, 0, 52, 16, 3.4); camino(-46, 0, -58, -24, 3.4); camino(-46, 0, -58, 28, 3.4); camino(42, -2, 54, -22, 3.4);
  { // bolitas en la orilla de los caminos
    const im = new THREE.InstancedMesh(geo('esf', .18, 8, 6), mat('#ffffff'), puntosCamino.length); const m4 = new THREE.Matrix4(); const cols = ['#ffffff', '#ff8fb8', '#ffd23f', '#9ad7ff', '#b89cf5'];
    puntosCamino.forEach(([x, z], i) => { m4.makeTranslation(x, .1, z); im.setMatrixAt(i, m4); im.setColorAt(i, new THREE.Color(cols[i % 5])); });
    mundo.add(im);
  }

  // Fuente central
  { const f = crearObjeto('fuente'); f.scale.setScalar(2.2); mundo.add(f); colisiones.push({ x: 0, z: 0, r: 3.8 }); }

  // Río de chocolate
  const texRio = texCanvas(128, 512, (x) => {
    x.fillStyle = '#6b3e26'; x.fillRect(0, 0, 128, 512);
    x.strokeStyle = 'rgba(160,100,70,.55)'; x.lineWidth = 5;
    for (let i = 0; i < 18; i++) { x.beginPath(); const y = Math.random() * 512; x.moveTo(Math.random() * 40, y); x.bezierCurveTo(40, y + 30, 90, y - 30, 128 - Math.random() * 30, y + 10); x.stroke(); }
  }, [1, 6]);
  {
    const pos = [], uv = [], idx = [];
    const zMax = Math.sqrt(RADIO * RADIO - 42 * 42) + 3;
    const pasos = 90;
    for (let i = 0; i <= pasos; i++) {
      const z = -zMax + i / pasos * zMax * 2, x = riox(z);
      pos.push(x - 3.6, .06, z, x + 3.6, .06, z); uv.push(0, i / pasos, 1, i / pasos);
      if (i < pasos) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const rio = new THREE.Mesh(g, new THREE.MeshPhongMaterial({ map: texRio, shininess: 90, specular: 0x664433 }));
    rio.receiveShadow = true; mundo.add(rio);
    animados.push((t, dt) => { texRio.offset.y -= dt * .05; });
    // orillas de crema
    for (const s of [-1, 1]) {
      const n = 80, im = new THREE.InstancedMesh(geo('esf', 1, 10, 8), mat('#fff4e0'), n); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
      for (let i = 0; i < n; i++) { const z = -zMax + 2 + i / n * (zMax * 2 - 4); m4.compose(V3(riox(z) + s * 3.7, 0, z), q, V3(.7, .35, 1.6)); im.setMatrixAt(i, m4); }
      mundo.add(im);
    }
    // puentes de oblea
    const obl = new THREE.MeshLambertMaterial({ map: texRayas('#f6d6a0', '#e8b870', 8, false) });
    PUENTES.forEach(z => {
      const p = grupo(mundo, riox(z), 0, z);
      malla(geo('caja', 10, .5, 5.2), obl, 0, .25, 0, p);
      for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const b = grupo(p, -4 + i * 2, .5, s * 2.5); malla(geo('cil', .1, .1, 1.1, 8), new THREE.MeshLambertMaterial({ map: texRayas('#ffffff', '#ff4d6d', 3) }), 0, .55, 0, b); }
      for (const s of [-1, 1]) malla(geo('caja', 9, .12, .12), '#ff8fb8', 0, 1.6, s * 2.5, p);
    });
  }
  const enRio = (x, z) => Math.abs(x - riox(z)) < 4.1 && !PUENTES.some(pz => Math.abs(z - pz) < 2.3);

  // Letreros
  function letrero(x, z, txt, sub, ry) {
    const g = grupo(mundo, x, 0, z);
    malla(geo('cil', .12, .12, 3, 8), new THREE.MeshLambertMaterial({ map: texRayas('#ffffff', '#ff8fb8', 4) }), 0, 1.5, 0, g);
    const t = texTexto([txt, sub || ''].filter(Boolean), { w: 512, h: 170, tam: 54, sub: 32 });
    for (const s of [0, Math.PI]) { const p = new THREE.Mesh(geo('plano', 3.2, 1.06), new THREE.MeshLambertMaterial({ map: t, transparent: true })); p.position.set(0, 3.2, s ? -.03 : .03); p.rotation.y = s; g.add(p); }
    g.rotation.y = ry ?? Math.atan2(-x, -z);
    colisiones.push({ x, z, r: .5 });
    return g;
  }
  letrero(-6, -30, 'Tus terrenos', 'aquí construyes 🏡');
  letrero(6, 30, 'El Pueblito', 'tiendas 🛍️');
  letrero(-48, 4, 'Bosque de Galleta', '🍪  y gomitas', Math.PI / 2);
  letrero(46, -6, 'Cantera de Caramelo', '🍬 y el huerto 🌽', -Math.PI / 2);
  letrero(-28, 12, 'Río de Chocolate', '🍫 junta chocolate', Math.PI / 2);

  // Faroles de paleta en los caminos
  [[3.5, -14], [-3.5, -24], [3.5, -34], [-3.5, 14], [3.5, 24], [-14, 3], [-26, -3], [14, 3], [26, -3], [-14, 31], [14, 31], [-28, 31], [28, 31], [40, 3], [-44, -3]].forEach(([x, z]) => {
    const f = crearObjeto('farol'); f.position.set(x, 0, z); mundo.add(f); colisiones.push({ x, z, r: .4 });
  });

  // Decoración: árboles de algodón, paletas, bastones, cupcakes, gomitas
  const libre = (x, z, m = 0) => {
    const r = Math.hypot(x, z); if (r > RADIO - 4 || r < 14) return false;
    if (Math.abs(x - riox(z)) < 7) return false;
    if (z < -26 && z > -64 && Math.abs(x) < 36) return false;        // terrenos
    if (z > 24 && Math.hypot(x, z) < 58 && Math.hypot(x, z) > 34 && Math.abs(x) < 42) return false; // pueblo
    if (x > 40 && x < 66 && z > 6 && z < 32) return false;           // huerto
    if (x < -44 && x > -74 && z > -40 && z < 40) return false;       // bosque y cristales
    if (x > 44 && x < 70 && z > -36 && z < -12) return false;        // cantera
    if (Math.abs(x) < 4 + m || Math.abs(z) < 4 + m) return false;    // caminos principales
    return !colisiones.some(c => Math.hypot(c.x - x, c.z - z) < c.r + 2.5 + m);
  };
  const coloresAlgodon = ['#ffb3d9', '#e0c8ff', '#bfe8ff', '#fff0a8', '#ffc9b8'];
  function sembrar(n, crear, r, m = 0) {
    let k = 0, int = 0;
    while (k < n && int++ < n * 40) {
      const a = Math.random() * Math.PI * 2, d = azar(14, RADIO - 5), x = Math.cos(a) * d, z = Math.sin(a) * d;
      if (!libre(x, z, m)) continue;
      const o = crear(); o.position.set(x, 0, z); o.rotation.y = Math.random() * 6; mundo.add(o); if (r) colisiones.push({ x, z, r });
      k++;
    }
  }
  sembrar(46, () => arbolAlgodon(coloresAlgodon[(Math.random() * 5) | 0], azar(2.2, 3.4)), .8, 1);
  sembrar(14, () => paletaGigante(['#ff6fa3', '#9b7bff', '#ffb347', '#5fd0a0', '#ff5c5c'][(Math.random() * 5) | 0], azar(2.6, 3.8)), .5, 1);
  sembrar(10, () => bastonGigante(azar(3, 4.6)), .5, 1);
  sembrar(12, () => cupcakeHongo(['#ffb3d9', '#e0c8ff', '#fff0a8'][(Math.random() * 3) | 0], azar(.8, 1.4)), 1, .5);
  sembrar(36, () => { const g = new THREE.Group(); const c = ['#ff6b9a', '#ffd23f', '#7bd389', '#9b7bff', '#ff9f43', '#7fd3ff'][(Math.random() * 6) | 0]; for (let i = 0; i < 3; i++) { const m = gomitaProp(c, azar(.25, .5)); m.position.set(azar(-.8, .8), 0, azar(-.8, .8)); g.add(m); } return g; }, 0);
  { // florecitas silvestres (instanciadas)
    const n = 420, im = new THREE.InstancedMesh(geo('esf', .14, 6, 5), mat('#ffffff'), n), m4 = new THREE.Matrix4(); const cols = ['#ffffff', '#ffd1e6', '#fff3a3', '#e6d1ff', '#ffc2d6'];
    let k = 0; while (k < n) { const a = Math.random() * 6.28, d = azar(12, RADIO - 3), x = Math.cos(a) * d, z = Math.sin(a) * d; if (Math.abs(x - riox(z)) < 5 || Math.abs(x) < 3 || Math.abs(z) < 3) continue; m4.makeTranslation(x, .08, z); im.setMatrixAt(k, m4); im.setColorAt(k, new THREE.Color(cols[k % 5])); k++; }
    mundo.add(im);
  }
  // Nubes alrededor y debajo
  const nubes = grupo(scene);
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2 + azar(0, .3), d = azar(118, 190); const n = nube(azar(1.4, 3)); n.position.set(Math.cos(a) * d, azar(-30, 22), Math.sin(a) * d); nubes.add(n); }
  for (let i = 0; i < 6; i++) { const a = azar(0, 6.28); const n = nube(azar(2, 3.5)); n.position.set(Math.cos(a) * azar(30, 80), azar(-45, -30), Math.sin(a) * azar(30, 80)); nubes.add(n); }
  animados.push((t, dt) => { nubes.rotation.y += dt * .004; });
  // Islitas flotando a lo lejos
  for (let i = 0; i < 4; i++) {
    const a = i * 1.6 + .5, d = 150 + i * 15, g = grupo(scene, Math.cos(a) * d, 10 + i * 6, Math.sin(a) * d);
    const ci = new THREE.Mesh(new THREE.CylinderGeometry(9, 8, 3, 24), [new THREE.MeshLambertMaterial({ map: texCapas }), mat('#c9f0cf'), mat('#9b6b4a')]); g.add(ci);
    const co = new THREE.Mesh(new THREE.ConeGeometry(8, 14, 20), mat('#7a4a32')); co.rotation.x = Math.PI; co.position.y = -8.5; g.add(co);
    const ar = arbolAlgodon(coloresAlgodon[i], 3); ar.position.y = 1.5; ar.scale.setScalar(1.6); g.add(ar);
    const fase = i * 2;
    animados.push((t) => { g.position.y = 10 + i * 6 + Math.sin(t * .4 + fase) * 1.2; });
  }

  /* ---------- Zona de recursos ---------- */
  function nodo(tipo, item, x, z, crear, rango = [2, 3], resp = 30e3, txt, r = 2.4, col = .9) {
    const o = crear(); o.position.set(x, 0, z); o.rotation.y = Math.random() * 6; mundo.add(o);
    const n = { tipo, item, o, x, z, rango, resp, listo: true, t: 0, esc: 1 };
    nodos.push(n); if (col) colisiones.push({ x, z, r: col });
    interactivos.push({ x, z, r, ic: ITEMS[item].e, txt: () => txt, activo: () => n.listo, fn: () => recoger(n) });
    return n;
  }
  // Bosque de Galleta (oeste)
  [[-56, -10], [-62, -20], [-52, -26], [-66, -6], [-60, -34], [-70, -18], [-54, 10], [-64, 4], [-72, -30], [-50, -38]].forEach(([x, z]) => nodo('arbol', 'galleta', x, z, arbolGalleta, [2, 3], 28e3, 'Recoger galletas', 2.6, 1));
  [[-58, 16], [-68, 12], [-50, 20], [-48, -14]].forEach(([x, z]) => nodo('gomitas', 'gomita', x, z, arbustoGomita, [2, 3], 30e3, 'Recoger gomitas', 2.4, 1));
  // Cristales de azúcar (suroeste)
  [[-56, 30], [-64, 26], [-60, 38], [-50, 34], [-68, 34], [-54, 44]].forEach(([x, z]) => nodo('cristal', 'azucar', x, z, cristalAzucar, [1, 2], 30e3, 'Recoger azúcar mágica', 2.3, .8));
  // Cantera de Caramelo (este)
  [[52, -18], [60, -24], [56, -30], [64, -16], [50, -28], [66, -30]].forEach(([x, z]) => nodo('roca', 'caramelo', x, z, rocaCaramelo, [2, 3], 30e3, 'Recoger caramelo', 2.5, 1.1));
  [[64, -4], [58, -38]].forEach(([x, z]) => nodo('gomitas', 'gomita', x, z, arbustoGomita, [2, 3], 30e3, 'Recoger gomitas', 2.4, 1));
  // Chocolate en la orilla del río
  [-62, -22, 22, 62].forEach(z => {
    const x = riox(z) + 5.2;
    const g = () => { const gg = new THREE.Group(); malla(geo('cil', 1.1, 1.3, .5, 20), '#fff4e0', 0, .25, 0, gg); malla(geo('cil', .95, .95, .1, 20), mat('#6b3e26', { brillo: 90 }), 0, .5, 0, gg); for (let i = 0; i < 3; i++) { const b = malla(geo('esf', .15, 8, 6), mat('#8b5a3c', { brillo: 90 }), azar(-.5, .5), .52, azar(-.5, .5), gg); b.userData.burbuja = i; } malla(geo('caja', .1, 1.4, .1), '#ffffff', .9, .7, .6, gg).rotation.z = -.4; return gg; };
    nodo('choco', 'chocolate', x, z, g, [2, 3], 26e3, 'Juntar chocolate', 2.6, .9);
  });
  // Huerto (este)
  const huerto = grupo(mundo, 52, 0, 18);
  malla(geo('caja', 22, .1, 14), '#f3dcc4', 0, .05, 0, huerto, false).receiveShadow = true;
  for (let i = 0; i < 3; i++) malla(geo('caja', 18, .25, 2.2), '#8a5a3c', 0, .15, -4 + i * 4, huerto, false).receiveShadow = true;
  { const c = grupo(huerto); for (let i = 0; i < 16; i++) { for (const z of [-7, 7]) { const b = grupo(c, -10.5 + i * 1.4, 0, z); malla(geo('cil', .07, .07, .9, 6), new THREE.MeshLambertMaterial({ map: texRayas('#ffffff', '#ff8fb8', 3) }), 0, .45, 0, b); } } }
  const PLANTAS = [['tomatillo', 'Cortar tomate verde'], ['tomate', 'Cortar jitomates'], ['chile', 'Cortar chiles'], ['trigo', 'Cosechar trigo'], ['maiz', 'Cosechar elotes'], ['fresa', 'Cortar fresas']];
  PLANTAS.forEach(([tipo, txt], i) => {
    for (let k = 0; k < 2; k++) {
      const x = 52 - 7 + (i % 3) * 7 + k * 2.6 - 1.3, z = 18 - 4 + Math.floor(i / 3) * 8;
      nodo('planta', tipo, x, z, () => planta(tipo), [2, 3], 35e3, txt, 1.6, 0);
    }
  });
  const gal = nodo('gallinero', 'huevo', 62, 30, gallinero, [1, 2], 30e3, 'Juntar huevitos', 2.8, 1.3);
  animados.push((t) => { const ga = gal.o.userData.gallina; if (ga) { ga.position.x = .9 + Math.sin(t * .7) * .5; ga.rotation.y = Math.cos(t * .7) > 0 ? .5 : -2.6; ga.children[1].position.y = .55 + Math.abs(Math.sin(t * 4)) * .05; } });

  /* ---------- Terrenos para construir ---------- */
  const TERRENOS = [{ x: -24, z: -46 }, { x: 0, z: -54 }, { x: 24, z: -46 }];
  const casasMesh = [null, null, null];
  TERRENOS.forEach((T, i) => {
    const g = grupo(mundo, T.x, 0, T.z); T.g = g;
    malla(geo('caja', 15, .12, 15), '#fff3df', 0, .06, 0, g, false).receiveShadow = true;
    malla(geo('toro', 1, 1, 4, 4), '#ffffff', 0, 0, 0, g, false).visible = false;
    for (const s of [-1, 1]) { malla(geo('caja', 15, .3, .4), '#ffffff', 0, .15, s * 7.5, g, false); malla(geo('caja', .4, .3, 15), '#ffffff', s * 7.5, .15, 0, g, false); }
    const cartel = grupo(g, -5.6, 0, 7.9);
    malla(geo('cil', .1, .1, 2.2, 8), '#ffffff', 0, 1.1, 0, cartel);
    T.tex = null; T.cartel = cartel;
    T.pintarCartel = () => {
      const old = cartel.getObjectByName('tabla'); if (old) cartel.remove(old);
      const c = E.casas[i] ? CASAS.find(c => c.id === E.casas[i]) : null;
      const p = new THREE.Mesh(geo('plano', 2.6, .86), new THREE.MeshLambertMaterial({ map: texTexto(c ? [c.n] : ['Terreno ' + (i + 1), 'toca para construir 🔨'], { w: 512, h: 170, tam: c ? 46 : 54, sub: 30 }), transparent: true }));
      p.name = 'tabla'; p.position.y = 2.3; cartel.add(p);
    };
    T.pintarCartel();
    interactivos.push({ x: T.x - 5.6, z: T.z + 8.6, r: 2.6, ic: '🔨', txt: () => E.casas[i] ? 'Cambiar de casa' : 'Construir una casa', activo: () => true, fn: () => panelConstruir(i) });
    interactivos.push({ x: T.x, z: T.z + 5, r: 3, ic: '🔨', txt: () => 'Construir aquí', activo: () => !E.casas[i], fn: () => panelConstruir(i) });
    interactivos.push({ x: T.x, z: T.z + 0, r: 1, ic: '🚪', txt: () => 'Entrar a tu casa', activo: () => !!E.casas[i], fn: () => entrarCasa(i), puerta: i });
  });
  function ponerCasa(i, id) {
    const T = TERRENOS[i];
    if (casasMesh[i]) { mundo.remove(casasMesh[i]); casasMesh[i] = null; }
    for (let k = colisiones.length - 1; k >= 0; k--) if (colisiones[k].casa === i) colisiones.splice(k, 1);
    if (!id) return null;
    const C = CASAS.find(c => c.id === id);
    const { g, piezas } = crearCasa(id);
    g.position.set(T.x, 0, T.z - .5); mundo.add(g); casasMesh[i] = g;
    // colisión en forma de varios círculos
    const r = C.tam * .62;
    for (const dx of [-1, 0, 1]) for (const dz of [-1, 0, 1]) colisiones.push({ x: T.x + dx * r * .7, z: T.z - .5 + dz * r * .7, r: r * .55, casa: i });
    // puerta
    const pu = interactivos.find(o => o.puerta === i); pu.x = T.x; pu.z = T.z - .5 + r * 1.25 + .9; pu.r = 2.4;
    T.pintarCartel();
    return { g, piezas };
  }
  E.casas.forEach((id, i) => { if (id) ponerCasa(i, id); });

  // Cocinita al aire libre
  const coc = cocinita(); coc.position.set(14, 0, -27); coc.rotation.y = -.3; mundo.add(coc);
  colisiones.push({ x: 13.4, z: -27.4, r: 1.4 }, { x: 15, z: -26.8, r: 1.2 });
  interactivos.push({ x: 13.6, z: -25, r: 2.6, ic: '🍳', txt: () => 'Cocinar', activo: () => true, fn: () => panelCocina(coc) });

  /* ---------- Pueblito de tiendas ---------- */
  const TIENDAS = [
    { id: 'mercado', n: 'Mercado', sub: 'compra y vende 🧺', techo: '#7bd389', toldo: ['#ffffff', '#7bd389'], forma: 'dosaguas', fn: () => panelMercado() },
    { id: 'muebles', n: 'Mueblería', sub: 'para tu casita 🛋️', techo: '#c9a7ff', toldo: ['#ffffff', '#b89cf5'], forma: 'plano', fn: () => panelTienda('muebles') },
    { id: 'bazar', n: 'Bazar de Navidad', sub: 'decoración 🎄', techo: '#ff6b6b', toldo: ['#ffffff', '#ff6b6b'], forma: 'cupula', fn: () => panelTienda('bazar') },
    { id: 'boutique', n: 'Boutique', sub: 'arma tu outfit 👗', techo: '#ff8fc4', toldo: ['#ffffff', '#ff8fc4'], forma: 'cupula', fn: () => panelBoutique() },
    { id: 'floreria', n: 'Florería', sub: 'semillas 🌷', techo: '#ffb347', toldo: ['#ffffff', '#ffb347'], forma: 'dosaguas', fn: () => panelFloreria() },
    { id: 'autos', n: 'Vehículos', sub: 'bici, moto, carruaje 🚲', techo: '#7fc8ff', toldo: ['#ffffff', '#7fc8ff'], forma: 'plano', fn: () => panelVehiculos() },
  ];
  TIENDAS.forEach((S, i) => {
    const th = (-50 + i * 20) * Math.PI / 180, R = 47;
    const x = Math.sin(th) * R, z = Math.cos(th) * R;
    const g = tienda({ techo: S.techo, toldo: S.toldo, forma: S.forma, letrero: [S.n, S.sub] });
    g.position.set(x, 0, z); g.rotation.y = Math.atan2(-x, -z); mundo.add(g);
    const fx = -Math.sin(g.rotation.y + Math.PI) * 0, fr = V3(0, 0, 1).applyAxisAngle(V3(0, 1, 0), g.rotation.y);
    for (const [ox, oz, r] of [[-2, -.3, 2.4], [2, -.3, 2.4], [0, -1.5, 2.4]]) { const p = V3(ox, 0, oz).applyAxisAngle(V3(0, 1, 0), g.rotation.y); colisiones.push({ x: x + p.x, z: z + p.z, r }); }
    // adornos frente a la tienda
    const deco = { mercado: () => { const c = new THREE.Group(); [['#ff4d4d', 0], ['#a8e06a', 1], ['#ffd23f', 2]].forEach(([col, k]) => { const ca = grupo(c, -1 + k * 1, 0, 0); malla(geo('caja', .8, .5, .6), '#e7b48a', 0, .25, 0, ca); for (let j = 0; j < 5; j++) malla(geo('esf', .13, 8, 6), col, azar(-.25, .25), .55, azar(-.18, .18), ca); }); return c; },
      muebles: () => crearObjeto('sofa'), bazar: () => { const a = crearObjeto('arbolnav', { adornos: { esferas: 30, luces: true, estrella: true } }); a.scale.setScalar(.7); return a; },
      boutique: () => { const m = crearChica({ top: 'vestidoGala', abajo: 'jeans', zapatos: 'cristal', acc: 'corona', peinado: 'chongo' }); m.g.scale.setScalar(.85); return m.g; },
      floreria: () => { const c = new THREE.Group(); FLORES.forEach((f, k) => { const fl = crearFlor(f.id, 2); fl.position.set(-1.6 + k * .65, 0, 0); c.add(fl); }); return c; },
      autos: () => { const b = crearVehiculo('bici').g; b.rotation.y = Math.PI / 2; return b; } }[S.id]();
    const dp = V3(-2.6, 0, 4.2).applyAxisAngle(V3(0, 1, 0), g.rotation.y);
    deco.position.set(x + dp.x, 0, z + dp.z); deco.rotation.y = g.rotation.y; mundo.add(deco);
    colisiones.push({ x: x + dp.x, z: z + dp.z, r: 1.1 });
    const ent = V3(1.9, 0, 4.4).applyAxisAngle(V3(0, 1, 0), g.rotation.y);
    interactivos.push({ x: x + ent.x, z: z + ent.z, r: 3, ic: { mercado: '🧺', muebles: '🛋️', bazar: '🎄', boutique: '👗', floreria: '🌷', autos: '🚲' }[S.id], txt: () => 'Entrar a ' + S.n, activo: () => true, fn: S.fn, tienda: S.id });
    S.x = x + ent.x; S.z = z + ent.z;
  });
  const tiendaPos = (id) => { const t = TIENDAS.find(s => s.id === id); return { x: t.x, z: t.z }; };

  /* ---------- Dulcecitos que viven en el reino ---------- */
  const DULCECITOS = [];
  const SALUDOS = ES_EL ? ['¡Hola, Lalito! 🍬', '¡Bienvenido al reino! ✨', '¡Las galletas están en el bosque! 🍪', '¡Brittybee te quiere muchísimo! 💞', '¡El huerto tiene fresas! 🍓', '¡Vamos a bailar! 🎶', '¡Me encanta el chocolate! 🍫', '¡Cuida mucho a Brittybee! 💞'] : ['¡Hola, Brittybee! 🍬', '¡Bienvenida, princesa! ✨', '¡Las galletas están en el bosque! 🍪', '¡Qué bonita te ves hoy! 💞', '¡Lalito te quiere muchísimo! 💞', '¡El huerto tiene fresas! 🍓', '¡Vamos a bailar! 🎶', '¡Cuida tus flores! 🌷', '¡Me encanta el chocolate! 🍫'];
  [['#ff7eb6', 0, 6, 9], ['#9b7bff', -50, -14, 8], ['#7bd389', 52, 16, 7], ['#ffb347', 54, -22, 7], ['#7fc8ff', 0, 36, 10], ['#ff6b6b', -56, 30, 7], ['#ffd23f', -10, -40, 9], ['#c9a7ff', 22, -10, 9]].forEach(([c, x, z, rad], i) => {
    const d = crearDulcecito(c); d.g.position.set(x + azar(-2, 2), 0, z + azar(-2, 2)); mundo.add(d.g);
    DULCECITOS.push({ p: d, cx: x, cz: z, rad, dest: null, espera: azar(0, 3), estado: 'quieto', t: azar(0, 9), saludo: 0 });
  });
  animados.push((t, dt) => {
    if (modo !== 'fuera') return;
    for (const d of DULCECITOS) {
      const g = d.p.g; d.t += dt;
      const dj = Math.hypot(jug.pos.x - g.position.x, jug.pos.z - g.position.z);
      if (dj < 4 && reloj - d.saludo > 14 && !cine) {
        d.saludo = reloj; d.estado = 'saluda'; d.dest = null; d.espera = 2.2;
        g.rotation.y = Math.atan2(jug.pos.x - g.position.x, jug.pos.z - g.position.z);
        burbuja(g, SALUDOS[Math.floor(Math.random() * SALUDOS.length)], 2400, 1.5);
      }
      if (d.estado === 'camina' && d.dest) {
        const dx = d.dest[0] - g.position.x, dz = d.dest[1] - g.position.z, L = Math.hypot(dx, dz);
        if (L < .3) { d.dest = null; d.estado = Math.random() < .3 ? 'baila' : 'quieto'; d.espera = azar(1.5, 4); }
        else { g.position.x += dx / L * 1.8 * dt; g.position.z += dz / L * 1.8 * dt; g.rotation.y = Math.atan2(dx, dz); }
      } else {
        d.espera -= dt;
        if (d.espera <= 0) {
          for (let k = 0; k < 8; k++) { const a = azar(0, 6.28), r = azar(1, d.rad), x = d.cx + Math.cos(a) * r, z = d.cz + Math.sin(a) * r; if (!enRio(x, z) && !colisiones.some(c => Math.hypot(c.x - x, c.z - z) < c.r + .5)) { d.dest = [x, z]; d.estado = 'camina'; break; } }
          if (!d.dest) d.espera = 1;
        }
      }
      animarDulcecito(d.p, d.estado, d.t * (d.estado === 'camina' ? 9 : 2));
    }
  });

  /* ---------- Lalito chiquito paseando por el reino ---------- */
  const bebe = { p: null, dest: null, espera: 2, estado: 'quieta', t: 0, saludo: -99, abrazo: 0 };
  bebe.p = crearBebe(); bebe.p.g.position.set(4, 0, -18); mundo.add(bebe.p.g);
  const FRASES_BEBE = ES_EL ? ['¡Hola, Lalito grande! 👶', '¡Cuando sea grande quiero ser como tú! 💪', '¡Brittybee nos ama! 💞', '¿Me das un abrazo? 🤗', '¡Vamos a jugar! 🍭', '¡Cuida mucho a Brittybee! 💞', '¡Qué bonita casa! 🏡'] : ['¡Hola, princesa! 👶', 'Te amo demasiado 💞', 'Estoy muy orgulloso de ti 💞', '¡Qué bonita casa tienes! 🏡', '¿Me das un abrazo? 🤗', '¡Eres la mejor, Brittybee! ✨', '¡Vamos a jugar! 🍭', 'Cuando sea grande me voy a casar contigo 💍', '¡Hoy te ves preciosa! 💞'];
  const interBebe = { x: 0, z: 0, r: 2.2, ic: '🤗', txt: () => 'Abrazar a Lalito chiquito', activo: () => bebe.p.g.visible && modo === 'fuera', fn: () => abrazarBebe() };
  interactivos.push(interBebe);
  function abrazarBebe() {
    const g = bebe.p.g;
    mirarA(g.position.x, g.position.z);
    g.rotation.y = Math.atan2(jug.pos.x - g.position.x, jug.pos.z - g.position.z);
    jug.accion = { estado: 'abraza', hasta: reloj + 2.4 };
    bebe.estado = 'abraza'; bebe.espera = 2.6; bebe.dest = null;
    particulas('corazon', g.position.clone().setY(1.6), 8); sonar('meta');
    burbuja(g, ['¡Te amo demasiado! 💞', '¡Qué rico abrazo! 🤗💞', '¡Eres mi persona favorita! 💞', '¡No me sueltes! 💞'][bebe.abrazo++ % 4], 2400, 2);
    stat('abrazosBebe');
  }
  animados.push((t, dt) => {
    const g = bebe.p.g;
    g.visible = (!!E.vistoBebe || E.casas.some(Boolean)) && !cine;
    if (!g.visible || modo !== 'fuera') return;
    bebe.t += dt;
    interBebe.x = g.position.x; interBebe.z = g.position.z;
    const dj = Math.hypot(jug.pos.x - g.position.x, jug.pos.z - g.position.z);
    if (dj < 5 && reloj - bebe.saludo > 12 && bebe.estado !== 'abraza') {
      bebe.saludo = reloj; bebe.estado = 'saluda'; bebe.dest = null; bebe.espera = 2.4;
      g.rotation.y = Math.atan2(jug.pos.x - g.position.x, jug.pos.z - g.position.z);
      burbuja(g, FRASES_BEBE[Math.floor(Math.random() * FRASES_BEBE.length)], 2800, 2);
    }
    if (bebe.estado === 'camina' && bebe.dest) {
      const dx = bebe.dest[0] - g.position.x, dz = bebe.dest[1] - g.position.z, L = Math.hypot(dx, dz);
      if (L < .3) { bebe.dest = null; bebe.estado = Math.random() < .25 ? 'baila' : 'quieta'; bebe.espera = azar(2, 5); }
      else { g.position.x += dx / L * 2.2 * dt; g.position.z += dz / L * 2.2 * dt; g.rotation.y = Math.atan2(dx, dz); }
    } else {
      bebe.espera -= dt;
      if (bebe.espera <= 0) {
        // pasea cerca de ella si está lejos de casa; si no, por la plaza y los terrenos
        const cerca = dj > 30 ? [jug.pos.x, jug.pos.z] : [0, -22];
        for (let k = 0; k < 10; k++) { const a = azar(0, 6.28), r = azar(2, dj > 30 ? 6 : 14), x = cerca[0] + Math.cos(a) * r, z = cerca[1] + Math.sin(a) * r; if (Math.hypot(x, z) < RADIO - 4 && !enRio(x, z) && !colisiones.some(c => Math.hypot(c.x - x, c.z - z) < c.r + .6)) { bebe.dest = [x, z]; bebe.estado = 'camina'; break; } }
        if (!bebe.dest) bebe.espera = 1;
        if (bebe.estado === 'abraza' || bebe.estado === 'saluda') bebe.estado = 'quieta';
      }
    }
    // si ella se fue muy lejos, Lalito chiquito aparece cerca de ella
    if (dj > 60) { const a = jug.ry + Math.PI * .75; g.position.set(jug.pos.x + Math.sin(a) * 6, 0, jug.pos.z + Math.cos(a) * 6); if (enRio(g.position.x, g.position.z) || Math.hypot(g.position.x, g.position.z) > RADIO - 4) g.position.set(jug.pos.x, 0, jug.pos.z + 3); particulas('chispa', g.position.clone().setY(.8), 10); }
    const est = bebe.estado === 'quieta' ? 'quieta' : bebe.estado;
    animarPersona(bebe.p, est === 'abraza' ? 'abraza' : est, bebe.t * (est === 'camina' ? 11 : 3));
  });

  /* =========================================================
     PERSONAJE
     ========================================================= */
  const jug = { y: 0, vy: 0, raiz: new THREE.Group(), p: null, pos: V3(E.pos.x, 0, E.pos.z), ry: E.pos.ry, estado: 'quieta', t: 0, vel: 0, accion: null, veh: null, sentada: null };
  scene.add(jug.raiz);
  function vestir(ropa) {
    if (jug.p) jug.raiz.remove(jug.p.g);
    if (ES_EL) { jug.p = crearChico(); jug.p.casco.visible = false; jug.p.martillo.visible = false; }
    else jug.p = crearChica(ropa);
    jug.raiz.add(jug.p.g);
    acomodarVehiculo();
  }
  function acomodarVehiculo() {
    const u = jug.veh;
    jug.p.g.position.set(0, 0, 0);
    if (u) {
      if (u.patines) { jug.p.g.position.y = .1; for (const k of ['piernaI', 'piernaD']) { const pt = crearPatin(); pt.position.set(0, -.6, .04); jug.p[k].add(pt); } }
      else { jug.p.g.position.set(0, u.asiento - .6, u.zPersona || 0); }
    }
  }
  function subir(id) {
    bajar(true);
    if (modo !== 'fuera') { aviso('Los vehículos se usan afuera 🌤️'); return; }
    jug.veh = crearVehiculo(id); jug.veh.id = id; E.veh = id;
    jug.raiz.add(jug.veh.g); acomodarVehiculo(); vestir(E.ropa);
    particulas('chispa', jug.pos.clone().setY(1), 14);
    sonar('pop'); pintarBajar(); guardar();
  }
  function bajar(silencio) {
    if (!jug.veh) return;
    jug.raiz.remove(jug.veh.g); jug.veh = null; E.veh = null; vestir(E.ropa);
    if (!silencio) { sonar('pop'); pintarBajar(); guardar(); }
  }
  function pintarBajar() {
    const b = $('bajar');
    if (jug.veh) { b.hidden = false; b.textContent = 'Bajarme 🚶‍♀️'; }
    else if (E.vehTengo.length && modo === 'fuera') { const v = VEHICULOS.find(v => v.id === (E.vehUltimo || E.vehTengo[E.vehTengo.length - 1])); b.hidden = false; b.textContent = 'Subirme ' + v.e; }
    else b.hidden = true;
  }
  $('bajar').onclick = () => { if (jug.veh) bajar(); else { const id = E.vehUltimo || E.vehTengo[E.vehTengo.length - 1]; if (id) subir(id); } };
  vestir(E.ropa);
  if (E.veh && E.vehTengo.includes(E.veh)) { jug.veh = crearVehiculo(E.veh); jug.veh.id = E.veh; jug.raiz.add(jug.veh.g); vestir(E.ropa); }

  // En el perfil de Brittybee el que ayuda es Lalito; en el de Lalito, la que ayuda es Brittybee
  function crearCompa() {
    if (!ES_EL) return crearChico();
    const p = crearChica({ top: 'vestidoFresa', abajo: 'jeans', zapatos: 'flats', acc: 'mono', peinado: 'suelto' });
    const mart = grupo(p.brazoD, 0, -.48, .06); mart.rotation.x = Math.PI / 2;
    malla(geo('cil', .035, .035, .5, 8), '#ff8fb8', 0, .16, 0, mart);
    malla(geo('caja', .26, .12, .12), mat('#ffd34d', { brillo: 80 }), 0, .42, 0, mart);
    p.martillo = mart; p.casco = new THREE.Group();
    return p;
  }

  /* =========================================================
     PARTÍCULAS, BURBUJAS Y TEXTOS FLOTANTES
     ========================================================= */
  const parts = [];
  const texPart = { chispa: texChispa(), suave: texSuave(), corazon: texEmoji('💞'), gota: null, confeti: null };
  texPart.gota = texCanvas(32, 32, (x) => { x.fillStyle = '#7fc8ff'; x.beginPath(); x.moveTo(16, 2); x.quadraticCurveTo(28, 18, 16, 30); x.quadraticCurveTo(4, 18, 16, 2); x.fill(); x.fillStyle = 'rgba(255,255,255,.7)'; x.beginPath(); x.arc(13, 18, 3, 0, 7); x.fill(); });
  texPart.confeti = texCanvas(16, 16, (x) => { x.fillStyle = '#fff'; x.fillRect(2, 5, 12, 6); });
  function particulas(tipo, pos, n = 10, o = {}) {
    for (let i = 0; i < n; i++) {
      const m = new THREE.SpriteMaterial({ map: texPart[tipo] || texPart.chispa, transparent: true, depthWrite: false });
      if (tipo === 'confeti') m.color.set(['#ff6fa3', '#ffd23f', '#7bd389', '#9ad7ff', '#b89cf5'][i % 5]);
      if (tipo === 'polvo') { m.map = texPart.suave; m.color.set(o.color || '#fff1e0'); }
      if (tipo === 'vapor') { m.map = texPart.suave; m.opacity = .7; }
      const s = new THREE.Sprite(m); s.position.copy(pos);
      const t = tipo;
      const v = t === 'corazon' ? V3(azar(-1, 1), azar(1.5, 3), azar(-1, 1))
        : t === 'gota' ? (o.dir ? o.dir.clone().multiplyScalar(azar(1.5, 2.5)).add(V3(azar(-.3, .3), azar(-.5, .5), azar(-.3, .3))) : V3(azar(-.5, .5), -1, azar(-.5, .5)))
          : t === 'polvo' ? V3(azar(-2, 2), azar(.3, 1.5), azar(-2, 2))
            : t === 'vapor' ? V3(azar(-.2, .2), azar(.6, 1.2), azar(-.2, .2))
              : t === 'confeti' ? V3(azar(-4, 4), azar(5, 9), azar(-4, 4))
                : V3(azar(-2, 2), azar(1, 4), azar(-2, 2));
      const tam = o.tam || { corazon: .55, polvo: 1.1, vapor: .7, gota: .22, confeti: .25, chispa: .5 }[t] || .5;
      s.scale.setScalar(tam);
      const vida = o.vida || { corazon: 1.6, polvo: .9, vapor: 1.6, gota: .8, confeti: 2.4, chispa: 1 }[t] || 1;
      const grav = { corazon: -.2, polvo: 1.5, vapor: -.1, gota: 9, confeti: 6, chispa: 3 }[t] ?? 3;
      scene.add(s);
      parts.push({ s, v, vida, t: 0, grav, tam, tipo: t, giro: azar(-6, 6) });
    }
  }
  function actualizarParticulas(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.t += dt;
      p.v.y -= p.grav * dt; if (p.tipo === 'confeti') { p.v.multiplyScalar(.985); }
      p.s.position.addScaledVector(p.v, dt);
      const k = p.t / p.vida;
      p.s.material.opacity = (p.tipo === 'vapor' ? .7 : 1) * (1 - Math.max(0, k - .6) / .4);
      const esc = p.tipo === 'polvo' || p.tipo === 'vapor' ? p.tam * (1 + k * 1.2) : p.tam * (k < .15 ? k / .15 : 1);
      p.s.scale.setScalar(esc);
      if (p.tipo === 'confeti') p.s.material.rotation += p.giro * dt;
      if (k >= 1) { scene.remove(p.s); p.s.material.dispose(); parts.splice(i, 1); }
    }
  }
  const burbujas = [];
  function burbuja(obj, txt, ms = 2800, alto = 2.7) {
    for (let i = burbujas.length - 1; i >= 0; i--) if (burbujas[i].obj === obj) { burbujas[i].el.remove(); burbujas.splice(i, 1); }
    const el = document.createElement('div'); el.className = 'burbuja'; el.textContent = txt; $('flotantes').append(el);
    burbujas.push({ el, obj, hasta: performance.now() + ms, alto });
  }
  const vtmp = V3();
  function aPantalla(p) { vtmp.copy(p).project(camera); return { x: (vtmp.x + 1) / 2 * innerWidth, y: (1 - vtmp.y) / 2 * innerHeight, z: vtmp.z }; }
  function flotante(pos, txt, color) {
    const s = aPantalla(pos); if (s.z > 1) return;
    const el = document.createElement('div'); el.className = 'flota'; el.innerHTML = txt; el.style.left = s.x + 'px'; el.style.top = s.y + 'px';
    if (color) el.style.textShadow = `0 2px 0 ${color}`;
    $('flotantes').append(el); setTimeout(() => el.remove(), 1400);
  }
  let avisoT;
  function aviso(txt, ms = 2400) { const t = $('toast'); t.innerHTML = txt; t.classList.add('on'); clearTimeout(avisoT); avisoT = setTimeout(() => t.classList.remove('on'), ms); }

  /* =========================================================
     SONIDO (todo sintetizado, música de cajita original)
     ========================================================= */
  let actx = null, master = null, musGain = null, sfxGain = null, eco = null;
  function iniciarAudio() {
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      master = actx.createGain(); master.gain.value = .9; master.connect(actx.destination);
      musGain = actx.createGain(); musGain.gain.value = E.musica ? .55 : 0; musGain.connect(master);
      sfxGain = actx.createGain(); sfxGain.gain.value = E.efectos ? .7 : 0; sfxGain.connect(master);
      eco = actx.createDelay(); eco.delayTime.value = .33; const fb = actx.createGain(); fb.gain.value = .32; const ef = actx.createBiquadFilter(); ef.type = 'lowpass'; ef.frequency.value = 2600;
      eco.connect(ef); ef.connect(fb); fb.connect(eco); ef.connect(musGain);
    } catch (e) { actx = null; }
  }
  const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);
  function nota(n, t, dur = 1.2, vol = .12, tipo = 'sine', destino) {
    if (!actx) return;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = tipo; o.frequency.value = hz(n);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .008); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
    o.connect(g); g.connect(destino || musGain); if (!destino) g.connect(eco);
    o.start(t); o.stop(t + dur + .05);
  }
  // Canción de cajita musical (melodía original)
  const ACORDES = [[65, 69, 72], [62, 65, 69], [58, 62, 65], [60, 64, 67], [65, 69, 72], [57, 60, 64], [58, 62, 65], [60, 64, 67, 70]];
  const MELODIA = [[84, 0], [81, 2], [84, 3], [86, 4], [84, 6], [81, 7], [79, 8], [77, 10], [79, 11], [81, 12], [79, 14], [77, 15], [76, 16], [77, 18], [79, 19], [81, 20], [84, 22], [86, 24], [84, 26], [81, 27], [79, 28], [81, 30], [77, 32], [76, 34], [74, 35], [72, 36], [74, 38], [76, 39], [77, 40], [76, 42], [74, 43], [72, 44], [77, 48], [81, 50], [84, 52], [81, 54], [79, 56], [76, 58], [77, 60]];
  let musT = 0, musPaso = 0;
  const PASO = .25;
  function programarMusica() {
    if (!actx || actx.state !== 'running') return;
    if (musT < actx.currentTime) musT = actx.currentTime + .1;
    while (musT < actx.currentTime + .6) {
      const paso = musPaso % 64, ac = ACORDES[Math.floor(paso / 8)];
      const arp = [0, 1, 2, 1][paso % 4];
      nota(ac[arp % ac.length] + 12, musT, 1.1, .045, 'triangle');
      if (paso % 8 === 0) nota(ac[0] - 12, musT, 2.2, .06, 'sine');
      const m = MELODIA.find(([, s]) => s === paso);
      if (m) nota(m[0], musT, 1.6, .07, 'sine');
      musT += PASO; musPaso++;
    }
  }
  function ruido(dur, vol, tipoF = 'bandpass', frec = 1200, q = 1, t0 = 0) {
    if (!actx) return;
    const t = actx.currentTime + t0, n = Math.floor(actx.sampleRate * dur), b = actx.createBuffer(1, n, actx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = actx.createBufferSource(); s.buffer = b; const f = actx.createBiquadFilter(); f.type = tipoF; f.frequency.value = frec; f.Q.value = q; const g = actx.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(sfxGain); s.start(t);
  }
  function sonar(tipo) {
    if (!actx || !E.efectos) return;
    const t = actx.currentTime;
    if (tipo === 'pop') { const o = actx.createOscillator(), g = actx.createGain(); o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(1300, t + .12); g.gain.setValueAtTime(.18, t); g.gain.exponentialRampToValueAtTime(.001, t + .18); o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + .2); }
    else if (tipo === 'moneda') { nota(83, t, .25, .12, 'square', sfxGain); nota(88, t + .08, .5, .12, 'square', sfxGain); }
    else if (tipo === 'martillo') { ruido(.08, .9, 'lowpass', 900, 1); ruido(.05, .5, 'bandpass', 3200, 4); const o = actx.createOscillator(), g = actx.createGain(); o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(60, t + .1); g.gain.setValueAtTime(.3, t); g.gain.exponentialRampToValueAtTime(.001, t + .14); o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + .15); }
    else if (tipo === 'agua') { ruido(1.2, .25, 'bandpass', 2400, .7); ruido(1, .15, 'highpass', 5000, .5, .2); }
    else if (tipo === 'cocina') { for (let i = 0; i < 6; i++) ruido(.12, .2, 'highpass', 3000 + Math.random() * 2000, .5, i * .14 + Math.random() * .05); }
    else if (tipo === 'meta') { [72, 76, 79, 84, 88].forEach((n, i) => nota(n, t + i * .09, .8, .1, 'triangle', sfxGain)); }
    else if (tipo === 'fanfarria') { [[72, 0], [76, .12], [79, .24], [84, .4], [79, .58], [84, .7], [88, .9]].forEach(([n, d]) => { nota(n, t + d, 1, .1, 'triangle', sfxGain); nota(n - 12, t + d, 1, .05, 'sine', sfxGain); }); }
    else if (tipo === 'puf') { ruido(.35, .4, 'bandpass', 900, .6); nota(91, t, .4, .05, 'sine', sfxGain); nota(96, t + .06, .4, .05, 'sine', sfxGain); }
    else if (tipo === 'piano') { [72, 76, 79, 77, 76, 74, 72, 79, 84, 83, 81, 79].forEach((n, i) => nota(n, t + i * .22, 1.3, .1, 'triangle', sfxGain)); }
    else if (tipo === 'error') { nota(64, t, .2, .08, 'square', sfxGain); nota(60, t + .1, .3, .08, 'square', sfxGain); }
    else if (tipo === 'abrir') { nota(79, t, .3, .07, 'sine', sfxGain); nota(84, t + .05, .4, .07, 'sine', sfxGain); }
  }
  const musica = window.__musica || new Audio('musica/fondo.mp3?v=1');
  musica.loop = true; musica.volume = .45;
  function tocarMusica() { if (E.musica) { const p = musica.play(); if (p && p.catch) p.catch(() => {}); } else musica.pause(); }
  document.addEventListener('visibilitychange', () => { if (document.hidden) musica.pause(); else tocarMusica(); });
  $('bMusica').onclick = () => {
    E.musica = !E.musica; tocarMusica();
    $('bMusica').textContent = E.musica ? '🎵' : '🔇'; aviso(E.musica ? 'Música encendida 🎵' : 'Música apagada 🔇', 1400); guardar();
  };
  $('bMusica').textContent = E.musica ? '🎵' : '🔇';

  /* =========================================================
     TWEENS, ESPERAS Y MODO CINE
     ========================================================= */
  const tweens = [], esperas = [];
  let saltando = false, reloj = 0;
  const tween = (dur, fn) => new Promise(res => tweens.push({ ini: reloj, dur, fn, res }));
  const espera = (s) => new Promise(res => esperas.push({ fin: reloj + s, res }));
  function actualizarTweens() {
    for (let i = tweens.length - 1; i >= 0; i--) { const w = tweens[i]; const k = saltando ? 1 : clamp((reloj - w.ini) / w.dur, 0, 1); w.fn(k); if (k >= 1) { tweens.splice(i, 1); w.res(); } }
    for (let i = esperas.length - 1; i >= 0; i--) { const w = esperas[i]; if (saltando || reloj >= w.fin) { esperas.splice(i, 1); w.res(); } }
  }
  const easeBack = (k) => { const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  let cine = null; // {centro, ang, dist, alto}
  function modoCine(on) { document.body.classList.toggle('cinema', on); if (!on) { cine = null; saltando = false; } }
  $('saltar').onclick = () => { saltando = true; if (typeof mandarJuntos === 'function') mandarJuntos({ t: 'saltar' }); };

  /* =========================================================
     CONTROLES
     ========================================================= */
  const joy = { id: null, x0: 0, y0: 0, dx: 0, dy: 0 };
  const cam = { yaw: 0, pitch: .42, dist: 10, id: null, x: 0, y: 0, objetivo: V3() };
  const toques = new Map();
  const teclas = {};
  let pinch = null;
  renderer.domElement.addEventListener('pointerdown', (e) => {
    if (bloqueado()) return;
    toques.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (toques.size === 2 && joy.id === null) { const [a, b] = [...toques.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: cam.dist }; cam.id = null; return; }
    if (e.clientX < innerWidth * .45 && joy.id === null && e.pointerType !== 'mouse') {
      joy.id = e.pointerId; joy.x0 = e.clientX; joy.y0 = e.clientY; joy.dx = joy.dy = 0;
      const j = $('joy'); j.style.left = e.clientX + 'px'; j.style.top = e.clientY + 'px'; j.classList.add('on'); j.firstElementChild.style.transform = '';
      $('joyPista').style.opacity = 0;
    } else if (cam.id === null) { cam.id = e.pointerId; cam.x = e.clientX; cam.y = e.clientY; }
    renderer.domElement.setPointerCapture?.(e.pointerId);
  });
  renderer.domElement.addEventListener('pointermove', (e) => {
    if (toques.has(e.pointerId)) toques.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && toques.size >= 2) { const [a, b] = [...toques.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); cam.dist = clamp(pinch.dist * pinch.d / d, 5.5, 18); return; }
    if (e.pointerId === joy.id) {
      let dx = e.clientX - joy.x0, dy = e.clientY - joy.y0; const L = Math.hypot(dx, dy), M = 52;
      if (L > M) { dx *= M / L; dy *= M / L; }
      joy.dx = dx / M; joy.dy = dy / M;
      $('joy').firstElementChild.style.transform = `translate(${dx}px,${dy}px)`;
    } else if (e.pointerId === cam.id) {
      cam.yaw -= (e.clientX - cam.x) * .0065; cam.pitch = clamp(cam.pitch + (e.clientY - cam.y) * .004, .12, 1.2);
      cam.x = e.clientX; cam.y = e.clientY;
    }
  });
  const soltar = (e) => {
    toques.delete(e.pointerId); if (toques.size < 2) pinch = null;
    if (e.pointerId === joy.id) { joy.id = null; joy.dx = joy.dy = 0; $('joy').classList.remove('on'); }
    if (e.pointerId === cam.id) cam.id = null;
  };
  renderer.domElement.addEventListener('pointerup', soltar);
  renderer.domElement.addEventListener('pointercancel', soltar);
  renderer.domElement.addEventListener('wheel', (e) => { cam.dist = clamp(cam.dist + e.deltaY * .01, 5.5, 18); e.preventDefault(); }, { passive: false });
  addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    teclas[e.key.toLowerCase()] = true;
    if ((e.key === 'e' || e.key === 'Enter') && !bloqueado() && interActual) { e.preventDefault(); interActual.fn(); }
    if (e.key === ' ') { e.preventDefault(); brincar(); }
    if (e.key === 'q' && !bloqueado() && interActual?.fn2) interActual.fn2();
    if (e.key === 'Escape') cerrarPanel();
  });
  addEventListener('keyup', (e) => { teclas[e.key.toLowerCase()] = false; });
  addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });
  const bloqueado = () => panelAbierto || !!cine || !!jug.accion || $('nota').classList.contains('on') || tutoAbierto;
  let tutoAbierto = false;

  /* =========================================================
     MOVIMIENTO Y CÁMARA
     ========================================================= */
  let modo = 'fuera', casaDentro = -1, cuarto = null;
  function moverJugadora(dt) {
    let ix = joy.dx, iz = joy.dy;
    if (teclas['a'] || teclas['arrowleft']) ix -= 1; if (teclas['d'] || teclas['arrowright']) ix += 1;
    if (teclas['w'] || teclas['arrowup']) iz -= 1; if (teclas['s'] || teclas['arrowdown']) iz += 1;
    const L = Math.hypot(ix, iz);
    if (bloqueado() || L < .12) { jug.vel = lerp(jug.vel, 0, Math.min(1, dt * 10)); return false; }
    if (jug.sentada) levantarse();
    const k = Math.min(1, L);
    const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw);
    const mx = (rx * ix - fx * iz) / L, mz = (rz * ix - fz * iz) / L;
    const vmax = 6.2 * (jug.veh ? VEHICULOS.find(v => v.id === jug.veh.id).vel : 1);
    jug.vel = lerp(jug.vel, vmax * k, Math.min(1, dt * 6));
    const ang = Math.atan2(mx, mz);
    let d = ang - jug.ry; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
    jug.ry += d * Math.min(1, dt * (jug.veh ? 6 : 12));
    const paso = jug.vel * dt;
    const nx = jug.pos.x + mx * paso, nz = jug.pos.z + mz * paso;
    const ok = (x, z) => modo === 'fuera' ? (Math.hypot(x, z) < RADIO - 2.5 && !enRio(x, z)) : (Math.abs(x - INT.x) < cuarto.w / 2 - .6 && z - INT.z > -cuarto.d / 2 + .7 && z - INT.z < cuarto.d / 2 - .4);
    if (ok(nx, nz)) { jug.pos.x = nx; jug.pos.z = nz; }
    else if (ok(nx, jug.pos.z)) jug.pos.x = nx;
    else if (ok(jug.pos.x, nz)) jug.pos.z = nz;
    // empujar fuera de los obstáculos
    const rj = jug.veh?.id === 'carruaje' ? 1.3 : jug.veh ? .8 : .45;
    const lista = modo === 'fuera' ? colisiones : colInterior;
    for (const c of lista) {
      const dx = jug.pos.x - c.x, dz = jug.pos.z - c.z, dd = Math.hypot(dx, dz), m = c.r + rj;
      if (dd < m && dd > .0001) { jug.pos.x = c.x + dx / dd * m; jug.pos.z = c.z + dz / dd * m; }
    }
    return true;
  }
  const camPos = V3(), camMira = V3();
  function actualizarCamara(dt, inmediato) {
    let objetivo, pos;
    if (cine) {
      cine.ang += dt * (cine.vel ?? .22);
      objetivo = cine.centro.clone();
      pos = V3(cine.centro.x + Math.sin(cine.ang) * cine.dist, cine.centro.y + cine.alto, cine.centro.z + Math.cos(cine.ang) * cine.dist);
    } else if (vistaBoutique) {
      const f = V3(Math.sin(jug.ry), 0, Math.cos(jug.ry));
      objetivo = jug.pos.clone().add(V3(0, .35, 0));
      pos = jug.pos.clone().addScaledVector(f, 5.2).add(V3(0, 1.6, 0));
      if (innerWidth > innerHeight) { const der = V3(Math.cos(jug.ry), 0, -Math.sin(jug.ry)); objetivo.add(V3(0, .9, 0)).addScaledVector(der, 1.6); pos.add(V3(0, -.6, 0)).addScaledVector(der, 1.6); }
    } else {
      const alt = modo === 'dentro' ? clamp(cam.pitch, .7, 1) : cam.pitch;
      const dist = modo === 'dentro' ? clamp(cam.dist, 10, 14) : cam.dist;
      const yaw = modo === 'dentro' ? clamp(cam.yaw, -.5, .5) : cam.yaw;
      if (modo === 'dentro') cam.yaw = yaw;
      objetivo = jug.pos.clone().add(V3(0, 1.3, modo === 'dentro' ? -2.5 : 0));
      pos = V3(objetivo.x + Math.sin(yaw) * Math.cos(alt) * dist, objetivo.y + Math.sin(alt) * dist, objetivo.z + Math.cos(yaw) * Math.cos(alt) * dist);
      if (pos.y < .8) pos.y = .8;
    }
    const k = inmediato ? 1 : Math.min(1, dt * (cine ? 2.5 : 7));
    camPos.lerp(pos, k); camMira.lerp(objetivo, k);
    camera.position.copy(camPos); camera.lookAt(camMira);
  }

  /* =========================================================
     INTERACCIÓN (botón de acción)
     ========================================================= */
  let interActual = null;
  function buscarInteractivo() {
    let mejor = null, md = 1e9;
    const lista = modo === 'fuera' ? interactivos.concat(interColocados, interFlores) : interInterior.concat(interColocados);
    for (const o of lista) {
      if (o.activo && !o.activo()) continue;
      const d = Math.hypot(o.x - jug.pos.x, o.z - jug.pos.z);
      if (d < o.r && d < md) { md = d; mejor = o; }
    }
    if (mejor !== interActual) {
      interActual = mejor;
      const caja = $('accionCaja');
      if (!mejor) caja.hidden = true;
      else { caja.hidden = false; $('accionIc').textContent = mejor.ic; }
    }
    if (mejor) { const tx = mejor.txt(); if ($('accionTxt').textContent !== tx) $('accionTxt').textContent = tx; $('accion2').hidden = !mejor.fn2; if (mejor.fn2) $('accion2').textContent = mejor.ic2 || '🎒'; }
    $('accionCaja').style.visibility = bloqueado() ? 'hidden' : '';
    $('brincar').style.visibility = bloqueado() ? 'hidden' : '';
  }
  function brincar() {
    if (bloqueado() || jug.y > 0 || jug.sentada) return;
    if (jug.veh && !jug.veh.patines) { sonar('pop'); burbuja(jug.raiz, jug.veh.id === 'carruaje' ? '¡Arre, ponicito! 🐴' : '¡Wiii! ✨', 1200); return; }
    asegurarAudio(); jug.vy = 9.5; jug.y = .001;
    if (actx && E.efectos) { const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain(); o.frequency.setValueAtTime(380, t); o.frequency.exponentialRampToValueAtTime(900, t + .18); g.gain.setValueAtTime(.14, t); g.gain.exponentialRampToValueAtTime(.001, t + .22); o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + .25); }
    particulas('chispa', jug.pos.clone().setY(.3), 5);
  }
  $('brincar').onclick = brincar;
  $('accion').onclick = () => { if (!bloqueado() && interActual) { asegurarAudio(); interActual.fn(); } };
  $('accion2').onclick = () => { if (!bloqueado() && interActual?.fn2) interActual.fn2(); };
  const mirarA = (x, z) => { jug.ry = Math.atan2(x - jug.pos.x, z - jug.pos.z); };

  /* ---------- Recolectar ---------- */
  function recoger(n) {
    if (!n.listo) return;
    bajar(true); pintarBajar();
    mirarA(n.x, n.z);
    jug.accion = { estado: 'recoge', hasta: reloj + 1.1 };
    sonar('pop');
    const base = n.o.scale.x;
    tween(1, (k) => { n.o.rotation.z = Math.sin(k * 30) * .06 * (1 - k); });
    espera(.75).then(() => {
      const c = Math.floor(azar(n.rango[0], n.rango[1] + 1));
      dar(n.item, c);
      if (n.item === 'galleta') stat('galletas', c);
      flotante(V3(n.x, 2.6, n.z), `+${c} ${ITEMS[n.item].e}`);
      particulas('chispa', V3(n.x, 1.4, n.z), 10);
      sonar('moneda');
      n.listo = false; n.t = ahoraMs();
      tween(.35, (k) => n.o.scale.setScalar(lerp(1, .35, k)));
      revisarMetas(); guardar();
    });
  }
  function actualizarNodos(t) {
    const ah = ahoraMs();
    for (const n of nodos) {
      if (!n.listo && ah - n.t > n.resp) { n.listo = true; tween(.6, (k) => n.o.scale.setScalar(lerp(.35, 1, easeBack(k)))); particulas('chispa', V3(n.x, 1.5, n.z), 6); }
      if (n.listo && n.tipo === 'cristal') n.o.rotation.y += .003;
      if (n.tipo === 'choco') n.o.children.forEach(c => { if (c.userData.burbuja !== undefined) { const f = (t * .8 + c.userData.burbuja * .33) % 1; c.position.y = .5 + f * .15; c.scale.setScalar(.4 + f); } });
    }
  }

  /* =========================================================
     PANELES
     ========================================================= */
  let panelAbierto = false, panelRender = null, panelCierre = null, panelTab = null;
  function abrirPanel({ tit, sub, tabs, tab, render, pie, alCerrar, ligero }) {
    panelAbierto = true; panelRender = render; panelCierre = alCerrar || null; panelTab = tab || (tabs && tabs[0][0]);
    $('panelTit').innerHTML = tit;
    $('panelSub').hidden = !sub; $('panelSub').innerHTML = sub || '';
    const pt = $('panelTabs'); pt.hidden = !tabs; pt.innerHTML = '';
    if (tabs) tabs.forEach(([id, lab]) => { const b = document.createElement('button'); b.textContent = lab; b.dataset.id = id; b.className = id === panelTab ? 'on' : ''; b.onclick = () => { panelTab = id; [...pt.children].forEach(c => c.classList.toggle('on', c.dataset.id === id)); repintar(); $('panelCuerpo').scrollTop = 0; }; pt.append(b); });
    $('panel').classList.toggle('ligero', !!ligero);
    $('panel').classList.add('on'); $('velo').classList.add('on');
    repintar(); $('panelCuerpo').scrollTop = 0;
    sonar('abrir');
    $('accionCaja').hidden = true; interActual = null;
  }
  function repintar() { const c = $('panelCuerpo'); c.innerHTML = ''; $('panelPie').hidden = true; $('panelPie').innerHTML = ''; panelRender && panelRender(c, panelTab); }
  function cerrarPanel() {
    if (!panelAbierto) return;
    panelAbierto = false; $('panel').classList.remove('on'); $('velo').classList.remove('on');
    const f = panelCierre; panelCierre = null; f && f();
    guardar();
  }
  $('panelX').onclick = cerrarPanel; $('velo').onclick = cerrarPanel;
  const h = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };
  const chips = (pide) => Object.entries(pide).map(([k, n]) => `<span class="chip ${cuenta(k) < n ? 'falta' : ''}">${ITEMS[k].e} ${Math.min(cuenta(k), n)}/${n}</span>`).join('');
  function fila(c, { ic, tit, sub = '', extra = '', botones = [] }) {
    const f = h(`<div class="fila"><div class="ic">${ic}</div><div class="tx"><b>${tit}</b>${sub ? `<small>${sub}</small>` : ''}${extra}</div><div class="btns"></div></div>`);
    const bx = f.querySelector('.btns');
    botones.forEach(([txt, fn, clase = '', des = false]) => { const b = document.createElement('button'); b.className = 'btn ' + clase; b.innerHTML = txt; b.disabled = des; b.onclick = fn; bx.append(b); });
    c.append(f); return f;
  }
  const vacio = (c, ic, txt) => c.append(h(`<div class="vacio"><span>${ic}</span>${txt}</div>`));
  function pagar(n) { if (E.monedas < n) { sonar('error'); aviso('Te faltan monedas 🪙 Vende comida en el Mercado'); return false; } E.monedas -= n; pintarMonedas(); sonar('moneda'); return true; }
  function pintarMonedas(salto) { $('monedasN').textContent = E.monedas.toLocaleString('es-MX'); if (salto) { const p = $('monedas'); p.classList.remove('salto'); void p.offsetWidth; p.classList.add('salto'); } }

  /* ---------- Mochila ---------- */
  $('bMochila').onclick = () => { asegurarAudio(); abrirMochila(); };
  function abrirMochila(tab) {
    abrirPanel({
      tit: '🎒 Tu mochila', tabs: [['mat', '🍪 Materiales'], ['ing', '🌽 Ingredientes'], ['com', '🍝 Comida'], ['cosas', '🛋️ Cosas'], ['veh', '🚲 Vehículos']], tab,
      render: (c, t) => {
        if (t === 'mat' || t === 'ing') {
          const tipo = t === 'mat' ? 'material' : 'ingrediente';
          const lista = Object.entries(ITEMS).filter(([, v]) => v.t === tipo);
          lista.forEach(([id, v]) => fila(c, { ic: v.e, tit: v.n, sub: t === 'mat' ? { galleta: 'Bosque de Galleta', caramelo: 'Cantera de Caramelo', chocolate: 'Río de Chocolate', azucar: 'Cristales de Azúcar', gomita: 'Arbustos de gomitas' }[id] : v.precio ? 'Se compra en el Mercado' : id === 'huevo' ? 'Gallinero del huerto' : 'Huerto', extra: `<span class="chip">Tienes ${cuenta(id)}</span>` }));
        } else if (t === 'com') {
          const lista = RECETAS.filter(r => cuenta(r.id) > 0);
          if (!lista.length) return vacio(c, '🍳', 'Todavía no cocinas nada.<br>Ve a la cocinita para preparar algo rico.');
          lista.forEach(r => fila(c, { ic: r.e, tit: `${r.n} ×${cuenta(r.id)}`, sub: `Se vende en $${r.venta}`, botones: [['Comer 😋', () => { cerrarPanel(); comer(r); }]] }));
        } else if (t === 'cosas') {
          const cosas = [...MUEBLES, ...DECOR].filter(m => cuenta(m.id) > 0);
          const semillas = FLORES.filter(f => cuenta('sem_' + f.id) > 0);
          if (!cosas.length && !semillas.length) return vacio(c, '🛍️', 'Aquí aparecen tus muebles, adornos y semillas.<br>Cómpralos en el Pueblito.');
          semillas.forEach(f => fila(c, { ic: '🌱', tit: `Semilla de ${f.n} ×${cuenta('sem_' + f.id)}`, sub: modo === 'fuera' ? 'Se planta donde estás parada' : 'Las flores se plantan afuera', botones: [['Plantar aquí', () => { cerrarPanel(); plantar(f.id); }, '', modo !== 'fuera']] }));
          cosas.forEach(m => {
            if (m.consumible) return fila(c, { ic: m.e, tit: `${m.n} ×${cuenta(m.id)}`, sub: 'Úsalas en tu árbol de Navidad' });
            fila(c, { ic: m.e, tit: `${m.n} ×${cuenta(m.id)}`, sub: modo === 'fuera' ? 'Se pone enfrente de ti' : 'Se pone enfrente de ti, en tu casa', botones: [['Poner aquí', () => { cerrarPanel(); colocar(m.id); }]] });
          });
        } else if (t === 'veh') {
          if (!E.vehTengo.length) return vacio(c, '🚲', 'Todavía no tienes vehículos.<br>Pásate a la tienda de Vehículos del Pueblito.');
          E.vehTengo.forEach(id => { const v = VEHICULOS.find(x => x.id === id); const usando = jug.veh?.id === id; fila(c, { ic: v.e, tit: v.n, sub: `Velocidad ×${v.vel}`, botones: [[usando ? 'Bajarme' : 'Subirme', () => { cerrarPanel(); if (usando) bajar(); else { E.vehUltimo = id; subir(id); } }, usando ? 'sec' : '']] }); });
        }
      },
    });
  }

  /* ---------- Construir ---------- */
  function panelConstruir(i) {
    let confirmar = null;
    abrirPanel({
      tit: '🔨 Construir', sub: E.casas[i] ? 'Ya tienes una casa aquí. Si construyes otra, la cambias (las cosas de adentro se quedan).' : 'Elige tu casa. Lalito te la construye 💞',
      render: (c) => {
        CASAS.forEach(C => {
          const ok = alcanza(C.pide) && E.monedas >= C.monedas, actual = E.casas[i] === C.id;
          fila(c, {
            ic: C.e, tit: C.n, sub: C.d, extra: `<div class="chips">${chips(C.pide)}${C.monedas ? `<span class="chip ${E.monedas < C.monedas ? 'falta' : ''}">🪙 ${C.monedas}</span>` : ''}</div>`,
            botones: [[actual ? 'Ya la tienes' : confirmar === C.id ? '¿Segura? 💞' : E.casas[i] ? 'Cambiar' : 'Construir', () => {
              if (E.casas[i] && confirmar !== C.id) { confirmar = C.id; repintar(); return; }
              cerrarPanel(); construir(i, C.id);
            }, actual ? 'sec' : 'verde', !ok || actual]],
          });
        });
      },
    });
  }
  // ¿Está el otro jugador cerca y libre para salir en la escena?
  const otroDisponible = () => !!(otro && otro.g.visible && !otro.ocupado && !otro.guion && Date.now() - otro.ult < 2500);
  async function construir(i, id) {
    const C = CASAS.find(c => c.id === id);
    if (!alcanza(C.pide) || E.monedas < C.monedas) return;
    gastar(C.pide); E.monedas -= C.monedas; pintarMonedas(true);
    E.casas[i] = id; stat('casas'); guardar(true);
    const coop = otroDisponible();
    if (coop) mandarJuntos({ t: 'escena', tipo: 'construir', i, id, dueño: PERFIL });
    await escenaConstruir(i, id, coop ? 'mira' : 'solo');
  }
  // Herramientas (casco y martillo) para quien construye
  function herramientas(p, on) {
    if (!p.martillo) {
      const mart = grupo(p.brazoD, 0, -.48, .06); mart.rotation.x = Math.PI / 2;
      malla(geo('cil', .035, .035, .5, 8), '#ff8fb8', 0, .16, 0, mart);
      malla(geo('caja', .26, .12, .12), mat('#ffd34d', { brillo: 80 }), 0, .42, 0, mart);
      p.martillo = mart; p.casco = new THREE.Group();
    }
    p.martillo.visible = on; p.casco.visible = on;
  }
  // Quien hace la escena: un actor de mentiritas, el otro jugador (visto desde aquí) o yo mismo
  function actorNPC() {
    const L = crearCompa(); scene.add(L.g); let est = 'saluda', t = 0;
    const anim = (tt, dt) => { t += dt * (est === 'camina' ? 9 : est === 'lleva' ? 8 : 3); animarPersona(L, est, t); if (est === 'sentada' || est === 'comeSentada') L.cuerpo.position.y = 0; };
    animados.push(anim);
    return { g: L.g, p: L, bur: L.g, set(e) { est = e; if (e === 'martillo') t = 0; }, sentar(on) { L.g.position.y = on ? -.1 : 0; }, aparece() { particulas('chispa', L.g.position.clone().setY(1.2), 18); particulas('corazon', L.g.position.clone().setY(2), 5); sonar('puf'); }, fin() { particulas('chispa', L.g.position.clone().setY(1.2), 20); particulas('corazon', L.g.position.clone().setY(2), 6); sonar('puf'); scene.remove(L.g); animados.splice(animados.indexOf(anim), 1); } };
  }
  function actorRemoto() {
    otro.guion = { est: 'saluda', sent: false };
    return { g: otro.g, p: otro.p, bur: otro.g, set(e) { if (otro && otro.guion) otro.guion.est = e; }, sentar(on) { if (otro && otro.guion) otro.guion.sent = on; }, aparece() { particulas('chispa', otro.g.position.clone().setY(1.2), 14); }, fin() { if (!otro) return; otro.guion = null; herramientas(otro.p, false); if (otro.ella) { otro.p.martillo.visible = false; } } };
  }
  function actorYo() {
    const proxy = new THREE.Object3D(); proxy.position.copy(jug.pos); proxy.rotation.y = jug.ry;
    jug.guion = { obj: proxy, est: 'saluda', sent: false };
    return { g: proxy, p: jug.p, bur: jug.raiz, set(e) { if (jug.guion) jug.guion.est = e; }, sentar(on) { if (jug.guion) jug.guion.sent = on; }, aparece() { particulas('chispa', proxy.position.clone().setY(1.2), 14); }, fin() { jug.guion = null; if (jug.p.martillo) { jug.p.martillo.visible = false; jug.p.casco.visible = false; } acomodarVehiculo(); } };
  }
  // rol: 'solo' (actor de mentiritas) · 'mira' (yo veo y el otro jugador construye) · 'construye' (yo construyo la casa del otro)
  async function escenaConstruir(i, id, rol) {
    const C = CASAS.find(c => c.id === id);
    const yoConstruyo = rol === 'construye';
    const constructorEsEl = yoConstruyo ? ES_EL : !ES_EL;   // ¿quien construye es Lalito?
    bajar(true); pintarBajar(); if (panelAbierto) cerrarPanel(); jug.sentada = null; jug.accion = null;
    modoCine(true); saltando = false;
    const T = TERRENOS[i];
    let g, piezas, casaPropia = null;
    if (yoConstruyo) {
      casaPropia = casasMesh[i]; if (casaPropia) casaPropia.visible = false;
      ({ g, piezas } = crearCasa(id)); g.position.set(T.x, 0, T.z - .5); mundo.add(g);
    } else ({ g, piezas } = ponerCasa(i, id));
    g.updateMatrixWorld(true);
    const centro = V3(T.x, 0, T.z - .5);
    const info = piezas.map(p => { const b = new THREE.Box3().setFromObject(p); const cc = b.getCenter(V3()); return { p, c: cc, y0: p.position.y, s: b.getSize(V3()) }; });
    piezas.forEach(p => { p.visible = false; });
    // quien mira (la dueña o el dueño de la casa)
    const mirador = yoConstruyo ? { g: otro.g, bur: otro.g, pos: V3(T.x + 4.5, 0, T.z + 10.5) } : { g: jug.raiz, bur: jug.raiz };
    if (!yoConstruyo) { jug.pos.set(T.x + 4.5, 0, T.z + 10.5); mirarA(T.x, T.z); }
    const mp = yoConstruyo ? mirador.pos : jug.pos;
    // quien construye llega
    const A = rol === 'solo' ? actorNPC() : rol === 'mira' ? actorRemoto() : actorYo();
    herramientas(A.p, true);
    A.g.position.set(T.x - 4, 0, T.z + 9);
    A.g.rotation.y = Math.atan2(mp.x - A.g.position.x, mp.z - A.g.position.z);
    A.aparece();
    cine = { centro: V3(T.x, 1 + C.tam * .45, T.z), ang: -.75, dist: C.tam * 2.4 + 9, alto: 4 + C.tam * .5, vel: .09 };
    burbuja(A.bur, constructorEsEl ? '¡Yo te la construyo, princesa! 👷‍♂️💞' : '¡Yo te la construyo, amor! 👷‍♀️💞', 2600, 3);
    await espera(1.8);
    burbuja(mirador.bur, '¡Sí, amor! 💞', 1800);
    const porPieza = clamp(9 / piezas.length, .45, 1);
    for (const it of info) {
      const dir = V3(it.c.x - centro.x, 0, it.c.z - centro.z); if (dir.lengthSq() < .01) dir.set(0, 0, 1); dir.normalize();
      const destino = centro.clone().addScaledVector(dir, C.tam * .78 + 1.7);
      const ini = A.g.position.clone();
      A.set('camina');
      A.g.rotation.y = Math.atan2(destino.x - ini.x, destino.z - ini.z);
      await tween(porPieza * .35, (k) => A.g.position.lerpVectors(ini, destino, k));
      A.g.rotation.y = Math.atan2(it.c.x - destino.x, it.c.z - destino.z);
      A.set('martillo');
      it.p.visible = true;
      const ySub = Math.max(2.5, it.s.y * .8);
      await tween(porPieza * .6, (k) => { const e = easeBack(k); it.p.scale.setScalar(Math.max(.01, e)); it.p.position.y = it.y0 + (1 - k) * ySub; });
      sonar('martillo'); setTimeout(() => sonar('martillo'), 170);
      particulas('polvo', V3(it.c.x, Math.max(.4, it.c.y - it.s.y / 2), it.c.z), 8);
      particulas('chispa', it.c, 4);
    }
    // ¡Lista!
    A.set('saluda');
    A.g.rotation.y = Math.atan2(mp.x - A.g.position.x, mp.z - A.g.position.z);
    sonar('fanfarria');
    tween(.6, (k) => { const s = 1 + Math.sin(k * Math.PI) * .08; g.scale.set(s, 1 / s, s); });
    particulas('confeti', V3(T.x, 6, T.z), 60); particulas('corazon', V3(T.x, 4, T.z), 14);
    burbuja(A.bur, '¡Lista tu ' + C.n.toLowerCase() + ', mi amor! 💞', 3000, 3);
    if (!yoConstruyo) jug.accion = { estado: 'baila', hasta: reloj + 3.2 };
    await espera(2.6);
    burbuja(mirador.bur, constructorEsEl ? '¡Gracias, amor! ¡Está preciosa! 💞' : '¡Gracias, mi princesa! ¡Quedó increíble! 💞', 2400);
    await espera(2.2);
    herramientas(A.p, false);
    A.fin();
    piezas.forEach(p => { p.visible = true; p.scale.setScalar(1); });
    info.forEach(it => { it.p.position.y = it.y0; });
    g.scale.setScalar(1);
    if (yoConstruyo) {
      // la casa era del otro: se quita y vuelve la mía
      particulas('chispa', V3(T.x, 3, T.z), 20);
      mundo.remove(g); if (casaPropia) casaPropia.visible = true;
      jug.accion = null; modoCine(false);
      cam.yaw = Math.atan2(jug.pos.x - T.x, jug.pos.z - T.z); cam.pitch = .38;
      return;
    }
    // La primera casa: aparece Lalito chiquito con los Dulcecitos
    if ((E.stats.casas || 0) === 1 && !E.vistoBebe && !ES_EL) {
      E.vistoBebe = true; guardar();
      saltando = false;
      const fj = V3(Math.cos(jug.ry), 0, -Math.sin(jug.ry));
      const B = crearBebe(); const bp = jug.pos.clone().addScaledVector(fj, 1.9).addScaledVector(V3(Math.sin(jug.ry), 0, Math.cos(jug.ry)), .8);
      B.g.position.copy(bp); B.g.rotation.y = Math.atan2(jug.pos.x - bp.x, jug.pos.z - bp.z); scene.add(B.g);
      B.g.scale.setScalar(.01); tween(.5, (k) => B.g.scale.setScalar(Math.max(.01, easeBack(k)) * .95));
      particulas('chispa', bp.clone().setY(.8), 20); particulas('corazon', bp.clone().setY(1.4), 6); sonar('puf');
      mirarA(bp.x, bp.z);
      { const fr = V3(Math.cos(jug.ry), 0, -Math.sin(jug.ry)); cine = { centro: bp.clone().lerp(jug.pos, .5).setY(.95), ang: Math.atan2(fr.x, fr.z) + .3, dist: 4.4, alto: 1.4, vel: .03 }; }
      const peques = [];
      ['#ff7eb6', '#9b7bff', '#7bd389', '#ffd23f', '#7fc8ff'].forEach((c, k) => {
        const d = crearDulcecito(c); const a0 = Math.atan2(-Math.cos(cine.ang), -Math.sin(cine.ang)); const a = a0 + (k - 2) * .55;
        d.g.position.set(bp.x + Math.cos(a) * 1.7, 0, bp.z + Math.sin(a) * 1.7); d.g.rotation.y = Math.atan2(bp.x - d.g.position.x, bp.z - d.g.position.z) + Math.PI;
        d.g.scale.setScalar(.01); scene.add(d.g); peques.push(d);
        espera(.3 + k * .15).then(() => { tween(.4, (q) => d.g.scale.setScalar(Math.max(.01, easeBack(q)))); particulas('chispa', d.g.position.clone().setY(.6), 5); sonar('pop'); });
      });
      let tB = 0, estB = 'saluda';
      const animB = (t, dt) => { tB += dt * 3; animarPersona(B, estB, tB); peques.forEach((d, k) => animarDulcecito(d, 'baila', tB + k)); };
      animados.push(animB);
      jug.accion = { estado: 'quieta', hasta: reloj + 16 };
      await espera(1);
      burbuja(B.g, '¡Hola, Brittybee! Soy Lalito chiquito 👶', 2800, 2);
      await espera(3);
      burbuja(B.g, 'Estoy muy orgulloso de ti, princesa 💞', 3000, 2);
      particulas('corazon', bp.clone().setY(1.6), 6);
      await espera(3.2);
      estB = 'baila';
      burbuja(B.g, '¡Te amo demasiado! 💞💞💞', 3000, 2);
      particulas('confeti', bp.clone().setY(3), 40); particulas('corazon', bp.clone().setY(1.8), 10); sonar('fanfarria');
      await espera(2.4);
      jug.accion = { estado: 'abraza', hasta: reloj + 2.6 };
      burbuja(jug.raiz, '¡Ayyy, qué bonito! Yo también te amo 🥹💞', 2800);
      await espera(3);
      estB = 'saluda';
      burbuja(B.g, '¡Adiós! 👋💞', 1600, 2);
      await espera(1.6);
      particulas('chispa', bp.clone().setY(.8), 24); sonar('puf');
      scene.remove(B.g); peques.forEach(d => { particulas('chispa', d.g.position.clone().setY(.6), 4); scene.remove(d.g); });
      animados.splice(animados.indexOf(animB), 1);
    }
    jug.accion = null;
    modoCine(false);
    cam.yaw = Math.atan2(jug.pos.x - T.x, jug.pos.z - T.z); cam.pitch = .38;
    revisarMetas(); guardar();
  }

  /* ---------- Cocina ---------- */
  function panelCocina(estufa) {
    abrirPanel({
      tit: '🍳 Cocinita', sub: 'Elige qué preparar. Los ingredientes salen del huerto, el gallinero y el Mercado.',
      render: (c) => {
        RECETAS.forEach(r => fila(c, {
          ic: r.e, tit: r.n, sub: (r.fav ? '<span class="fav">💞 De tus favoritas · </span>' : '') + `se vende en $${r.venta}${cuenta(r.id) ? ` · tienes ${cuenta(r.id)}` : ''}`,
          extra: `<div class="chips">${chips(r.pide)}</div>`,
          botones: [['Cocinar', () => { cerrarPanel(); cocinar(r, estufa); }, 'verde', !alcanza(r.pide)]],
        }));
      },
    });
  }
  async function cocinar(r, estufa) {
    if (!alcanza(r.pide)) return;
    gastar(r.pide);
    const pe = estufa ? estufa.localToWorld(V3(-.8, 1.4, 0)) : jug.pos.clone().setY(1.2);
    mirarA(pe.x, pe.z);
    jug.accion = { estado: 'cocina', hasta: 1e9 };
    const pr = $('progreso'); pr.hidden = false;
    const total = r.pasos.length * 1.1;
    let i = 0;
    for (const paso of r.pasos) {
      $('progresoTxt').textContent = paso; sonar('cocina');
      const t0 = i * 1.1;
      await tween(1.1, (k) => { $('progresoBarra').style.width = ((t0 + k * 1.1) / total * 100) + '%'; if (Math.random() < .25) particulas('vapor', pe.clone().add(V3(azar(-.2, .2), .2, azar(-.2, .2))), 1); });
      i++;
    }
    pr.hidden = true; $('progresoBarra').style.width = '0';
    jug.accion = null;
    dar(r.id, 1); stat('cocinado_' + r.id); stat('cocinado');
    flotante(pe.clone().add(V3(0, 1, 0)), `+1 ${r.e}`);
    particulas('chispa', pe, 12); sonar('meta');
    if (r.fav) { burbuja(jug.raiz, { spaghetti: '¡Mi spaghetti en salsa verde con milanesa! 🤤', pizza: '¡Pizza calientita! 🍕', cheetos: '¡Cheetos! Mis favoritos 😋', dulces: '¡Dulcecitos de fresa! 🍬' }[r.id], 2600); }
    else burbuja(jug.raiz, '¡Me quedó delicioso! ✨', 2000);
    revisarMetas(); guardar();
  }
  async function comer(r) {
    if (cuenta(r.id) < 1 || cine) return;
    E.inv[r.id]--; stat('comido'); guardar();
    bajar(true); pintarBajar(); if (jug.sentada) levantarse();
    const f = V3(Math.sin(jug.ry), 0, Math.cos(jug.ry));
    const C = jug.pos.clone().addScaledVector(f, 1.4);
    if (modo === 'dentro') { C.x = clamp(C.x, INT.x - cuarto.w / 2 + 2, INT.x + cuarto.w / 2 - 2); C.z = clamp(C.z, INT.z - cuarto.d / 2 + 2, INT.z + cuarto.d / 2 - 2); }
    const coop = modo === 'fuera' && otroDisponible();
    if (coop) mandarJuntos({ t: 'escena', tipo: 'comer', r: r.id, cx: +C.x.toFixed(2), cz: +C.z.toFixed(2), ry: +jug.ry.toFixed(3) });
    await escenaComer(r.id, C, jug.ry, coop ? 'mira' : 'solo');
  }
  // rol: 'solo' · 'mira' (el otro jugador me sirve) · 'sirve' (yo le sirvo al otro)
  async function escenaComer(rid, C, ry, rol) {
    const yoSirvo = rol === 'sirve';
    const servidorEsEl = yoSirvo ? ES_EL : !ES_EL;
    if (panelAbierto) cerrarPanel(); bajar(true); pintarBajar(); if (jug.sentada) levantarse(); jug.accion = null;
    modoCine(true); saltando = false;
    const f = V3(Math.sin(ry), 0, Math.cos(ry)), lado = V3(Math.cos(ry), 0, -Math.sin(ry));
    const mesa = crearObjeto('mesa'); mesa.position.copy(C); mesa.rotation.y = ry - Math.PI / 2; scene.add(mesa);
    mesa.scale.setScalar(.01); tween(.4, (k) => mesa.scale.setScalar(Math.max(.01, easeBack(k))));
    particulas('chispa', C.clone().setY(1), 10); sonar('puf');
    const silla = (s) => C.clone().addScaledVector(f, s * 1.25);
    // quien come (la que pidió la comida) se sienta
    const pos0 = jug.pos.clone();
    let comensal;
    if (!yoSirvo) { jug.pos.copy(silla(-1)); jug.ry = ry; jug.sentada = { o: { ref: { ry } }, alto: .48, t: 0, comiendo: false }; comensal = { bur: jug.raiz, comer(on) { if (jug.sentada) jug.sentada.comiendo = on; } }; }
    else comensal = { bur: otro.g, comer() { } };
    // quien sirve llega con los platos
    const A = rol === 'solo' ? actorNPC() : rol === 'mira' ? actorRemoto() : actorYo();
    if (A.p.casco) { A.p.casco.visible = false; A.p.martillo.visible = false; }
    const lejos = C.clone().addScaledVector(lado, 5).addScaledVector(f, 2);
    A.g.position.copy(lejos); A.aparece();
    const plato1 = crearPlato(rid), plato2 = crearPlato(rid);
    // en el actor de mentiritas los platos van en sus manos; con jugadores de verdad, flotan frente a él
    const portaPlatos = new THREE.Group(); scene.add(portaPlatos);
    plato1.position.set(-.2, 1.08, .5); plato2.position.set(.2, 1.12, .5); portaPlatos.add(plato1, plato2);
    const sigue = () => { portaPlatos.position.copy(A.g.position); portaPlatos.rotation.y = A.g.rotation.y; };
    animados.push(sigue);
    A.set('lleva');
    cine = { centro: C.clone().setY(1), ang: Math.atan2(-Math.cos(ry), Math.sin(ry)) + .35, dist: 5, alto: 1.9, vel: -.04 };
    burbuja(A.bur, servidorEsEl ? '¡Te traigo de comer, princesa! 💞' : '¡Te traigo de comer, amor! 💞', 2400, 2.9);
    await espera(1.2);
    const junto = C.clone().addScaledVector(lado, .95).addScaledVector(f, -.55);
    let a = A.g.position.clone();
    A.g.rotation.y = Math.atan2(junto.x - a.x, junto.z - a.z);
    await tween(1.6, (k) => A.g.position.lerpVectors(a, junto, k));
    A.set('quieta'); A.g.rotation.y = Math.atan2(-Math.cos(ry), Math.sin(ry));
    // le sirve su plato
    portaPlatos.remove(plato1); plato1.position.copy(C).addScaledVector(f, -.42).setY(.9); plato1.rotation.y = ry; scene.add(plato1);
    plato1.scale.setScalar(.5); tween(.35, (k) => plato1.scale.setScalar(lerp(.5, 1, easeBack(k))));
    particulas('chispa', plato1.position, 8); sonar('pop');
    burbuja(A.bur, 'Para ti, mi amor. Hecho con mucho amor 💞', 2600, 2.9);
    await espera(1.4);
    burbuja(comensal.bur, '¡Gracias, amor! 🥹💞', 2000);
    await espera(1);
    // se sienta enfrente con su plato
    a = A.g.position.clone(); const suSilla = silla(1);
    A.set('lleva'); A.g.rotation.y = Math.atan2(suSilla.x - a.x, suSilla.z - a.z);
    await tween(1, (k) => A.g.position.lerpVectors(a, suSilla, k));
    portaPlatos.remove(plato2); plato2.position.copy(C).addScaledVector(f, .42).setY(.9); plato2.rotation.y = ry + Math.PI; scene.add(plato2);
    A.g.rotation.y = ry + Math.PI; A.sentar(true); A.set('comeSentada');
    comensal.comer(true);
    sonar('meta');
    const frases = { spaghetti: '¡Mmm! Mi spaghetti en salsa verde con milanesa 🤤', pizza: '¡Qué rica pizza! 🍕', cheetos: '*crunch crunch* ¡Mis Cheetos! 😋', dulces: '¡Dulcecitos de fresa! 🍬', pastel: '¡Qué rico pastelito! 🍰', galletas: '¡Recién horneadas! 🍪', chocolatito: 'Calientito… ☕', elote: '¡Con mucho chile! 🌽' };
    burbuja(comensal.bur, frases[rid] || '¡Delicioso!', 2600);
    const iv = setInterval(() => { particulas('corazon', C.clone().setY(2.2), 2); }, 450);
    await espera(2.8);
    burbuja(A.bur, servidorEsEl ? 'Lo más rico es comer contigo 💞' : 'Lo más rico es comer contigo, mi amor 💞', 2600, 2.6);
    await espera(2.8);
    clearInterval(iv);
    tween(.5, () => { plato1.children.slice(2).forEach(c => c.scale.multiplyScalar(.9)); plato2.children.slice(2).forEach(c => c.scale.multiplyScalar(.9)); });
    await espera(.6);
    comensal.comer(false);
    A.sentar(false); A.set('saluda');
    burbuja(A.bur, '¡Te amo! 💞', 1800, 2.9);
    await espera(1.8);
    animados.splice(animados.indexOf(sigue), 1);
    scene.remove(mesa, plato1, plato2, portaPlatos);
    particulas('chispa', C.clone().setY(1), 14);
    A.fin();
    if (yoSirvo) { jug.pos.copy(silla(1)).addScaledVector(lado, 1.4); }
    else { jug.sentada = null; acomodarVehiculo(); jug.pos.copy(pos0); }
    modoCine(false);
    guardar();
  }

  /* ---------- Mercado ---------- */
  function panelMercado() {
    abrirPanel({
      tit: '🧺 Mercado', tabs: [['vender', '💰 Vender comida'], ['comprar', '🛒 Comprar ingredientes']],
      render: (c, t) => {
        if (t === 'comprar') {
          Object.entries(ITEMS).filter(([, v]) => v.precio).forEach(([id, v]) => fila(c, { ic: v.e, tit: v.n, sub: `$${v.precio} cada uno · tienes ${cuenta(id)}`, botones: [[`+1 · $${v.precio}`, () => { if (pagar(v.precio)) { dar(id); repintar(); } }], [`+5 · $${v.precio * 5}`, () => { if (pagar(v.precio * 5)) { dar(id, 5); repintar(); } }, 'sec']] }));
          c.append(h('<div class="vacio" style="padding:10px">Lo demás lo encuentras en el huerto 🌽, el gallinero 🥚 y los cristales ✨</div>'));
        } else {
          const lista = RECETAS.filter(r => cuenta(r.id) > 0);
          if (!lista.length) return vacio(c, '🍝', 'No tienes comida para vender.<br>Cocina algo rico en la cocinita y tráelo aquí.');
          lista.forEach(r => fila(c, { ic: r.e, tit: `${r.n} ×${cuenta(r.id)}`, sub: `Te pagan $${r.venta}`, botones: [[`Vender 1`, () => vender(r, 1)], [`Todo · $${r.venta * cuenta(r.id)}`, () => vender(r, cuenta(r.id)), 'sec']] }));
        }
      },
    });
  }
  function vender(r, n) {
    if (cuenta(r.id) < n || n < 1) return;
    E.inv[r.id] -= n; E.monedas += r.venta * n; stat('vendidas', n);
    pintarMonedas(true); sonar('moneda');
    flotante(jug.pos.clone().setY(2.5), `+$${r.venta * n}`, '#d18b00');
    revisarMetas(); repintar(); guardar();
  }

  /* ---------- Mueblería y bazar ---------- */
  function panelTienda(cual) {
    const lista = cual === 'muebles' ? MUEBLES : DECOR;
    abrirPanel({
      tit: cual === 'muebles' ? '🛋️ Mueblería' : '🎄 Bazar de Navidad', sub: 'Lo que compres va a tu mochila. Desde ahí lo pones donde quieras.',
      render: (c) => lista.forEach(m => fila(c, { ic: m.e, tit: m.n, sub: `$${m.precio}${cuenta(m.id) ? ` · tienes ${cuenta(m.id)}` : ''}`, botones: [['Comprar', () => { if (pagar(m.precio)) { dar(m.id); stat(cual === 'muebles' ? 'muebles' : 'decor'); flotante(jug.pos.clone().setY(2.4), `+1 ${m.e}`); revisarMetas(); repintar(); guardar(); } }, '', E.monedas < m.precio]] })),
    });
  }
  /* ---------- Florería ---------- */
  function panelFloreria() {
    abrirPanel({
      tit: '🌷 Florería', sub: 'Planta las semillas desde tu mochila y riégalas para que crezcan. Si no las riegas, se marchitan 🥺',
      render: (c) => FLORES.forEach(f => fila(c, { ic: f.e, tit: 'Semilla de ' + f.n, sub: `$${f.precio}${cuenta('sem_' + f.id) ? ` · tienes ${cuenta('sem_' + f.id)}` : ''}`, botones: [['Comprar', () => { if (pagar(f.precio)) { dar('sem_' + f.id); repintar(); guardar(); } }, '', E.monedas < f.precio], ['×5', () => { if (pagar(f.precio * 5)) { dar('sem_' + f.id, 5); repintar(); guardar(); } }, 'sec', E.monedas < f.precio * 5]] })),
    });
  }
  /* ---------- Vehículos ---------- */
  function panelVehiculos() {
    abrirPanel({
      tit: '🚲 Vehículos', sub: 'Para pasear más rápido por el reino.',
      render: (c) => VEHICULOS.forEach(v => {
        const tengo = E.vehTengo.includes(v.id);
        fila(c, { ic: v.e, tit: v.n, sub: tengo ? 'Ya es tuyo 💞' : `$${v.precio.toLocaleString('es-MX')} · velocidad ×${v.vel}`, botones: [[tengo ? 'Subirme' : 'Comprar', () => {
          if (!tengo) { if (!pagar(v.precio)) return; E.vehTengo.push(v.id); stat('vehiculos'); revisarMetas(); }
          E.vehUltimo = v.id; cerrarPanel(); subir(v.id); burbuja(jug.raiz, '¡Wiii! ' + v.e, 1800);
        }, tengo ? 'verde' : '', !tengo && E.monedas < v.precio]] });
      }),
    });
  }
  /* ---------- Boutique ---------- */
  let vistaBoutique = false;
  function panelBoutique() {
    if (ES_EL) { aviso('La boutique es de Brittybee 👗 ¡Cómprale algo bonito desde su perfil! 💞', 3200); return; }
    bajar(true); pintarBajar();
    const prueba = { ...E.ropa };
    vistaBoutique = true;
    const S = TIENDAS.find(s => s.id === 'boutique');
    jug.ry = Math.atan2(-S.x, -S.z);
    const repinta = () => { vestir(prueba); };
    abrirPanel({
      tit: '👗 Boutique', ligero: true, tabs: ROPA_CATS,
      render: (c, cat) => {
        const gr = h('<div class="grid-ropa"></div>'); c.append(gr);
        ROPA[cat].forEach(r => {
          const tengo = E.ropaTengo.includes(r.id), puesta = prueba[cat] === r.id;
          const col = r.c ? `background:${r.c2 ? `linear-gradient(135deg,${r.c} 55%,${r.c2} 55%)` : r.c}` : 'background:#f3eef1';
          const ic = cat === 'peinado' ? { suelto: '💁‍♀️', coleta: '🎀', chongo: '🍡', trenzas: '🪢' }[r.id] : cat === 'acc' && r.id === 'nada' ? '✖️' : '';
          const p = h(`<button class="prenda ${puesta ? 'on' : ''}"><div class="mu" style="${col};display:grid;place-items:center;font-size:18px">${ic}</div>${r.n}${tengo ? '<span class="ok">✓ Tuyo</span>' : `<span class="pr">$${r.precio}</span>`}</button>`);
          p.onclick = () => { prueba[cat] = r.id; if (tengo) { E.ropa[cat] = r.id; guardar(); } repinta(); repintar(); };
          gr.append(p);
        });
        // pie: comprar lo que se está probando
        const falta = Object.entries(prueba).filter(([k, id]) => !E.ropaTengo.includes(id)).map(([k, id]) => ROPA[k].find(r => r.id === id));
        if (falta.length) {
          const tot = falta.reduce((a, r) => a + r.precio, 0);
          const pie = $('panelPie'); pie.hidden = false; pie.innerHTML = '';
          const b = document.createElement('button'); b.className = 'btn verde'; b.textContent = `Comprar ${falta.map(r => r.n).join(' + ')} · $${tot}`; b.disabled = E.monedas < tot;
          b.onclick = () => { if (!pagar(tot)) return; falta.forEach(r => E.ropaTengo.push(r.id)); Object.assign(E.ropa, prueba); stat('ropaComprada'); particulas('chispa', jug.pos.clone().setY(1.5), 16); burbuja(jug.raiz, '¡Me encanta! ✨', 1800); revisarMetas(); guardar(); repintar(); };
          const q = document.createElement('button'); q.className = 'btn sec'; q.textContent = 'Quitar prueba'; q.style.flex = '0 0 auto';
          q.onclick = () => { Object.assign(prueba, E.ropa); repinta(); repintar(); };
          pie.append(q, b);
        }
      },
      alCerrar: () => { vistaBoutique = false; vestir(E.ropa); },
    });
  }

  /* ---------- Colocar muebles y adornos ---------- */
  const objColocados = new Map(); // obj -> mesh
  let interColocados = [], colInterior = [];
  const ACCIONES_OBJ = {
    cama: ['😴', 'Dormir', (o) => dormir(o)], sofa: ['🛋️', 'Sentarse', (o) => sentarse(o, .55, .2)], banca: ['🪑', 'Sentarse', (o) => sentarse(o, .55, .05)],
    columpio: ['🎠', 'Columpiarse', (o) => sentarse(o, .65, 0, true)], piano: ['🎹', 'Tocar el piano', (o) => { sonar('piano'); mirarA(o.x, o.z); jug.accion = { estado: 'cocina', hasta: reloj + 2.6 }; particulas('chispa', V3(o.x, 1.6, o.z), 10); burbuja(jug.raiz, '🎵 ♪ ♫', 2400); }],
    peluche: ['🧸', 'Abrazar', (o) => { mirarA(o.x, o.z); jug.accion = { estado: 'abraza', hasta: reloj + 2 }; particulas('corazon', V3(o.x, 1.6, o.z), 6); burbuja(jug.raiz, 'Como si fueras tú 💞', 2200); }],
    tele: ['📺', 'Ver la tele', () => { burbuja(jug.raiz, 'Están pasando una peli romántica 🎬', 2600); }],
    arbolnav: ['🎄', 'Decorar el árbol', (o) => panelArbol(o)], tocador: ['🪞', 'Arreglarme', () => { panelBoutiqueLigero(); }],
    fuente: ['⛲', 'Pedir un deseo', (o) => { particulas('chispa', V3(o.x, 2.5, o.z), 16); sonar('meta'); burbuja(jug.raiz, 'Deseo… que estemos juntos pronto 💞', 2800); }],
    cuadro: ['🖼️', 'Ver el cuadro', () => burbuja(jug.raiz, 'Nosotros 💞', 2000)],
  };
  function colocar(id) {
    if (cuenta(id) < 1) return;
    const d = 2.2, x = jug.pos.x + Math.sin(jug.ry) * d, z = jug.pos.z + Math.cos(jug.ry) * d;
    if (modo === 'fuera' && (enRio(x, z) || Math.hypot(x, z) > RADIO - 3)) { aviso('Aquí no se puede poner 🙈 Muévete un poquito'); return; }
    E.inv[id]--;
    const o = { id, x: modo === 'dentro' ? x - INT.x : x, z: modo === 'dentro' ? z - INT.z : z, ry: jug.ry + Math.PI, dentro: modo === 'dentro' ? casaDentro : -1 };
    if (id === 'arbolnav') o.adornos = { esferas: 0, luces: false, estrella: false };
    E.colocados.push(o);
    pintarColocado(o, true);
    sonar('pop'); guardar();
    aviso('¡Listo! Si lo quieres mover, acércate y toca 🎒', 2600);
  }
  function pintarColocado(o, nuevo) {
    const m = crearObjeto(o.id, { adornos: o.adornos });
    m.position.set(o.x, 0, o.z); m.rotation.y = o.ry;
    (o.dentro >= 0 ? interior : mundo).add(m);
    objColocados.set(o, m);
    if (nuevo) { m.scale.setScalar(.01); tween(.5, (k) => m.scale.setScalar(Math.max(.01, easeBack(k)))); particulas('chispa', V3(o.dentro >= 0 ? o.x + INT.x : o.x, 1, o.dentro >= 0 ? o.z + INT.z : o.z), 10); }
    reconstruirInterColocados();
  }
  function quitarColocado(o) {
    const m = objColocados.get(o); if (m) m.parent.remove(m);
    objColocados.delete(o);
    E.colocados.splice(E.colocados.indexOf(o), 1);
    dar(o.id); sonar('pop'); guardar();
    reconstruirInterColocados();
    aviso('Lo guardaste en tu mochila 🎒', 1600);
  }
  const RADIO_OBJ = { cama: 2.2, sofa: 1.8, mesa: 1.9, piano: 1.8, fuente: 2.6, arco: 2, columpio: 2, alfombra: 1.8, librero: 1.5, tele: 1.6, arbolnav: 2.2, banca: 1.6 };
  const COL_OBJ = { cama: 1.3, sofa: 1, mesa: 1, piano: 1, fuente: 1.7, librero: .8, tele: .8, arbolnav: 1.1, banca: .8, tocador: .7, monito: .6, columpio: 1, maceta: .4, lampara: .3, peluche: .5, regalos: .6, farol: .3, cuadro: .5 };
  function reconstruirInterColocados() {
    interColocados = []; colInterior = [];
    for (const o of E.colocados) {
      const enEsta = modo === 'dentro' ? o.dentro === casaDentro : o.dentro === -1;
      if (!enEsta) continue;
      const x = o.dentro >= 0 ? o.x + INT.x : o.x, z = o.dentro >= 0 ? o.z + INT.z : o.z;
      const ac = ACCIONES_OBJ[o.id], info = [...MUEBLES, ...DECOR].find(m => m.id === o.id);
      interColocados.push({ x, z, r: RADIO_OBJ[o.id] || 1.6, ic: ac ? ac[0] : '🎒', txt: () => ac ? ac[1] : 'Guardar ' + info.n.toLowerCase(), fn: () => ac ? ac[2]({ ...o, x, z, ref: o }) : quitarColocado(o), fn2: ac ? () => quitarColocado(o) : null, ic2: '🎒' });
      if (COL_OBJ[o.id]) (modo === 'dentro' ? colInterior : colisiones).push({ x, z, r: COL_OBJ[o.id], colocado: o });
    }
    // quitar colisiones viejas de colocados de afuera
    if (modo === 'fuera') { for (let k = colisiones.length - 1; k >= 0; k--) { const c = colisiones[k]; if (c.colocado && (!E.colocados.includes(c.colocado) || colisiones.indexOf(c) !== colisiones.findIndex(q => q.colocado === c.colocado))) colisiones.splice(k, 1); } }
    if (modo === 'dentro' && cuarto) colInterior.push(...cuarto.col);
  }
  function sentarse(o, alto, adelante, columpio) {
    jug.sentada = { o, alto, columpio, t: 0 };
    jug.pos.set(o.x + Math.sin(o.ref.ry) * adelante, 0, o.z + Math.cos(o.ref.ry) * adelante);
    jug.ry = o.ref.ry;
    burbuja(jug.raiz, columpio ? '¡Wiii! 🎠' : 'Qué cómodo… 💞', 1600);
  }
  function levantarse() { jug.sentada = null; jug.p.g.position.y = jug.veh ? jug.p.g.position.y : 0; acomodarVehiculo(); }
  function dormir(o) {
    $('fundido').classList.add('on');
    setTimeout(() => {
      E.hora = .27; aplicarHora(1);
      $('fundido').classList.remove('on');
      burbuja(jug.raiz, '¡Buenos días! ☀️ Soñé contigo, amor 💞', 3000);
      guardar();
    }, 1100);
  }
  function panelArbol(o) {
    const ref = o.ref;
    abrirPanel({
      tit: '🎄 Tu árbol de Navidad', ligero: true,
      render: (c) => {
        const a = ref.adornos;
        fila(c, { ic: '🔴', tit: `Esferas (${a.esferas}/30)`, sub: `Tienes ${cuenta('esferas')} cajas de 6`, botones: [['Poner 6', () => { E.inv.esferas--; a.esferas = Math.min(30, a.esferas + 6); actualizarArbol(ref); repintar(); }, '', !cuenta('esferas') || a.esferas >= 30]] });
        fila(c, { ic: '✨', tit: 'Series de luces', sub: a.luces ? 'Ya tiene luces ✨' : `Tienes ${cuenta('luces')}`, botones: [['Poner', () => { E.inv.luces--; a.luces = true; actualizarArbol(ref); repintar(); }, '', !cuenta('luces') || a.luces]] });
        fila(c, { ic: '⭐', tit: 'Estrella en la punta', sub: a.estrella ? 'Ya tiene estrella ⭐' : `Tienes ${cuenta('estrella')}`, botones: [['Poner', () => { E.inv.estrella--; a.estrella = true; actualizarArbol(ref); repintar(); }, '', !cuenta('estrella') || a.estrella]] });
        if (!cuenta('esferas') && !cuenta('luces') && !cuenta('estrella')) c.append(h('<div class="vacio" style="padding:10px">Compra esferas, luces y la estrella en el Bazar de Navidad 🎄</div>'));
        const pie = $('panelPie'); pie.hidden = false; pie.innerHTML = '';
        const b = document.createElement('button'); b.className = 'btn sec'; b.textContent = 'Guardar el árbol en la mochila 🎒'; b.onclick = () => { cerrarPanel(); quitarColocado(ref); }; pie.append(b);
      },
    });
  }
  function actualizarArbol(ref) {
    const m = objColocados.get(ref); if (m) m.userData.decorar(ref.adornos);
    particulas('chispa', V3(ref.dentro >= 0 ? ref.x + INT.x : ref.x, 2.2, ref.dentro >= 0 ? ref.z + INT.z : ref.z), 12); sonar('pop');
    revisarMetas(); guardar();
  }
  function panelBoutiqueLigero() { aviso('Para estrenar ropa nueva ve a la Boutique del Pueblito 👗', 2400); }

  /* ---------- Flores ---------- */
  const floresMesh = new Map();
  let interFlores = [];
  function plantar(tipo) {
    const x = jug.pos.x + Math.sin(jug.ry) * 1.4, z = jug.pos.z + Math.cos(jug.ry) * 1.4;
    if (enRio(x, z)) { aviso('Ahí está el río de chocolate 🍫'); return; }
    if (cuenta('sem_' + tipo) < 1) return;
    E.inv['sem_' + tipo]--;
    jug.accion = { estado: 'recoge', hasta: reloj + 1.1 };
    const f = { tipo, x, z, crec: 0, riego: ahoraMs() - AGUA_MS * .75, ult: ahoraMs() };
    E.flores.push(f);
    setTimeout(() => { pintarFlor(f, true); burbuja(jug.raiz, '¡Ahora a regarla! 💧', 2000); }, 600);
    sonar('pop'); guardar();
  }
  const aguaDe = (f, ah = ahoraMs()) => clamp(100 - (ah - f.riego) / AGUA_MS * 100, 0, 100);
  const etapaDe = (f) => f.crec >= CRECE_FLOR ? 2 : f.crec >= CRECE_BOTON ? 1 : 0;
  function pintarFlor(f, nuevo) {
    const old = floresMesh.get(f); if (old) mundo.remove(old.m);
    const et = etapaDe(f), ag = aguaDe(f), mar = ag <= 0 && et > 0;
    const m = crearFlor(f.tipo, et, mar);
    m.position.set(f.x, 0, f.z); mundo.add(m);
    floresMesh.set(f, { m, et, mar, seca: ag < 30 });
    if (nuevo) { m.scale.setScalar(.01); tween(.4, (k) => m.scale.setScalar(Math.max(.01, easeBack(k)))); particulas('chispa', V3(f.x, .6, f.z), 6); }
    interFlores = E.flores.map(fl => ({ x: fl.x, z: fl.z, r: 1.6, ic: '💧', txt: () => { const a = aguaDe(fl); return a <= 0 && etapaDe(fl) > 0 ? 'Regar para revivirla' : a > 92 ? 'Ya está regadita 💞' : 'Regar la flor'; }, fn: () => regar(fl), activo: () => true }));
  }
  function regar(f) {
    if (aguaDe(f) > 92) { burbuja(jug.raiz, 'Ya tiene agüita 💞', 1400); return; }
    mirarA(f.x, f.z);
    jug.accion = { estado: 'riega', hasta: reloj + 1.8 };
    // regadera en la mano
    const reg = new THREE.Group();
    malla(geo('cil', .16, .18, .3, 12), mat('#7fc8ff', { brillo: 80 }), 0, 0, 0, reg);
    const pico = malla(geo('cil', .03, .05, .4, 8), mat('#7fc8ff', { brillo: 80 }), 0, .05, .3, reg); pico.rotation.x = 1.1;
    reg.position.set(0, -.5, .12); reg.rotation.x = 1.4;
    jug.p.brazoD.add(reg);
    sonar('agua');
    const iv = setInterval(() => particulas('gota', V3(f.x, 1.3, f.z).lerp(jug.pos.clone().setY(1.1), .4), 3, { dir: V3(0, -1, 0) }), 90);
    setTimeout(() => {
      clearInterval(iv); jug.p.brazoD.remove(reg);
      const revive = aguaDe(f) <= 0;
      f.riego = ahoraMs(); f.ult = ahoraMs(); stat('regadas');
      pintarFlor(f); particulas('chispa', V3(f.x, .8, f.z), 8);
      if (revive) burbuja(jug.raiz, '¡Revivió! 🌸', 1800);
      revisarMetas(); guardar();
    }, 1700);
  }
  function actualizarFlores(dt) {
    const ah = ahoraMs();
    for (const f of E.flores) {
      const fin = f.riego + AGUA_MS;
      const desde = f.ult || ah;
      const mojado = Math.max(0, Math.min(ah, fin) - desde);
      f.crec += mojado; f.ult = ah;
      const v = floresMesh.get(f);
      if (!v) { pintarFlor(f); continue; }
      const et = etapaDe(f), ag = aguaDe(f, ah), mar = ag <= 0 && et > 0;
      if (et !== v.et || mar !== v.mar) { pintarFlor(f, et !== v.et); if (et !== v.et) particulas('chispa', V3(f.x, 1, f.z), 6); }
      else if ((ag < 30) !== v.seca) { v.seca = ag < 30; }
      const cab = v.m.userData.cabeza; if (cab && !mar) cab.rotation.x = v.seca ? .6 : Math.sin(reloj * 1.5 + f.x) * .08;
    }
  }

  /* =========================================================
     INTERIOR DE LAS CASAS
     ========================================================= */
  const TEMAS = {
    galleta: { w: 12, d: 9, pared: '#f6d2ae', piso: ['#e8b48a', '#dca37a'], marco: '#ffffff' },
    caramelo: { w: 13, d: 10, pared: '#ffd6b0', piso: ['#ffbfd8', '#ffb0cf'], marco: '#ff8fb8' },
    chocolate: { w: 14, d: 10, pared: '#f6dcc7', piso: ['#a8724e', '#9b6544'], marco: '#fff3e6' },
    pastel: { w: 16, d: 11, pared: '#ffd3e6', piso: ['#f3c9a0', '#ebbd92'], marco: '#ffffff' },
    castillo: { w: 18, d: 13, pared: '#e6d4ff', piso: ['#ffc4dc', '#ffb3d1'], marco: '#ffd34d' },
  };
  let interInterior = [];
  function construirCuarto(id) {
    while (interior.children.length) interior.remove(interior.children[0]);
    const T = TEMAS[id], w = T.w, d = T.d;
    const texP = texCanvas(256, 256, (x) => { for (let i = 0; i < 8; i++) { x.fillStyle = T.piso[i % 2]; x.fillRect(0, i * 32, 256, 32); x.fillStyle = 'rgba(0,0,0,.06)'; x.fillRect(0, i * 32 + 30, 256, 2); x.fillRect((i * 97) % 256, i * 32, 2, 32); } }, [w / 4, d / 4]);
    malla(geo('caja', w, .2, d), new THREE.MeshLambertMaterial({ map: texP }), 0, -.1, 0, interior, false).receiveShadow = true;
    malla(geo('caja', 90, .1, 90), new THREE.MeshLambertMaterial({ map: texPiso }), 0, -.16, 0, interior, false).receiveShadow = true;
    for (let i = 0; i < 8; i++) { const ar = arbolAlgodon(coloresAlgodon[i % 5], 2.8); ar.position.set((i % 2 ? 1 : -1) * (w / 2 + 3 + (i % 3) * 2.5), 0, -d / 2 + i * 2.2); interior.add(ar); }
    const pared = mat(T.pared);
    malla(geo('caja', w, 5, .3), pared, 0, 2.5, -d / 2, interior, false).receiveShadow = true;
    for (const s of [-1, 1]) malla(geo('caja', .3, 5, d), pared, s * w / 2, 2.5, 0, interior, false).receiveShadow = true;
    malla(geo('caja', w, .3, .34), T.marco, 0, .15, -d / 2 + .02, interior, false);
    for (const s of [-1, 1]) malla(geo('caja', .34, .3, d), T.marco, s * (w / 2 - .02), .15, 0, interior, false);
    // ventanas con cielo
    for (const x of [-w / 4, w / 4]) { const v = grupo(interior, x, 2.8, -d / 2 + .17); malla(geo('caja', 2.2, 1.8, .1), T.marco, 0, 0, 0, v); malla(geo('caja', 1.9, 1.5, .12), matLuz('#bfe6ff', .5), 0, 0, .02, v, false); malla(geo('caja', 1.9, .08, .14), T.marco, 0, 0, .03, v, false); malla(geo('caja', .08, 1.5, .14), T.marco, 0, 0, .03, v, false); for (const s of [-1, 1]) { const c = malla(geo('caja', .5, 1.9, .06), '#ffb3cf', s * 1.25, 0, .1, v); } }
    // guirnalda de banderines
    for (let i = 0; i < 9; i++) { const b = malla(geo('cono', .22, .4, 3), ['#ff8fb8', '#fff3a3', '#b89cf5'][i % 3], -w / 2 + .6 + i * (w - 1.2) / 8, 4.3 - Math.sin(i / 8 * Math.PI) * .3, -d / 2 + .3, interior, false); b.rotation.x = Math.PI; }
    // cocina dentro
    const k = cocinita(); k.position.set(-w / 2 + 2.2, 0, -d / 2 + 1); k.scale.setScalar(.85); interior.add(k);
    k.children.filter(c => c.geometry && c.geometry.type === 'ConeGeometry').forEach(c => c.visible = false);
    // tapete de salida
    malla(geo('caja', 2.4, .04, 1.2), '#ff8fb8', 0, .02, d / 2 - .8, interior, false);
    const ent = new THREE.Mesh(geo('plano', 2, .66), new THREE.MeshBasicMaterial({ map: texTexto(['Salir 🚪'], { w: 512, h: 170, tam: 60 }), transparent: true }));
    ent.rotation.x = -Math.PI / 2; ent.position.set(0, .06, d / 2 - .8); interior.add(ent);
    interior.traverse(o => { if (o.isMesh) { o.receiveShadow = true; } });
    cuarto = { w, d, col: [{ x: INT.x - w / 2 + 2.2, z: INT.z - d / 2 + 1, r: 1.5 }] };
    interInterior = [
      { x: INT.x, z: INT.z + d / 2 - .8, r: 1.8, ic: '🚪', txt: () => 'Salir', fn: () => salirCasa(), activo: () => true },
      { x: INT.x - w / 2 + 2.2, z: INT.z - d / 2 + 2.4, r: 2.2, ic: '🍳', txt: () => 'Cocinar', fn: () => panelCocina(k), activo: () => true },
    ];
  }
  function entrarCasa(i) {
    bajar(true);
    $('fundido').classList.add('on');
    setTimeout(() => {
      modo = 'dentro'; casaDentro = i;
      construirCuarto(E.casas[i]);
      for (const o of E.colocados) if (o.dentro === i) pintarColocado(o);
      mundo.visible = false; interior.visible = true;
      jug.pos.set(INT.x, 0, INT.z + cuarto.d / 2 - 2); jug.ry = Math.PI;
      cam.yaw = 0; cam.pitch = .78; cam.dist = 12.5;
      reconstruirInterColocados(); actualizarCamara(0, true);
      $('fundido').classList.remove('on'); pintarBajar();
      burbuja(jug.raiz, E.colocados.some(o => o.dentro === i) ? '¡Mi casita! 💞' : 'Está vacía… ¡a decorarla! 🛋️', 2200);
    }, 600);
  }
  function salirCasa() {
    $('fundido').classList.add('on');
    setTimeout(() => {
      for (const [o, m] of objColocados) if (o.dentro >= 0) { m.parent && m.parent.remove(m); objColocados.delete(o); }
      modo = 'fuera';
      const T = TERRENOS[casaDentro], pu = interactivos.find(o => o.puerta === casaDentro);
      casaDentro = -1;
      mundo.visible = true; interior.visible = false;
      jug.pos.set(pu.x, 0, pu.z + 1.6); jug.ry = 0;
      cam.yaw = 0; cam.pitch = .42; cam.dist = 10;
      reconstruirInterColocados(); actualizarCamara(0, true);
      $('fundido').classList.remove('on'); pintarBajar();
    }, 600);
  }

  /* =========================================================
     METAS Y NOTITAS DE LALITO
     ========================================================= */
  const COND = {
    m1: () => (E.stats.galletas || 0) >= 6, m2: () => E.casas.some(Boolean), m3: () => (E.stats.cocinado_spaghetti || 0) >= 1,
    m4: () => (E.stats.vendidas || 0) >= 3, m5: () => (E.stats.regadas || 0) >= 1, m6: () => (E.stats.ropaComprada || 0) >= 1,
    m7: () => (E.stats.muebles || 0) >= 1, m8: () => E.colocados.some(o => o.id === 'arbolnav' && o.adornos && o.adornos.esferas > 0),
    m9: () => E.vehTengo.length > 0, m10: () => E.casas.includes('castillo'),
  };
  const colaNotas = [];
  function revisarMetas() {
    for (const m of METAS) {
      if (E.metas[m.id] || !COND[m.id]()) continue;
      E.metas[m.id] = Date.now(); E.monedas += m.premio; pintarMonedas(true);
      colaNotas.push(m);
    }
    pintarMetaMini();
    if (colaNotas.length && !cine && !$('nota').classList.contains('on')) setTimeout(mostrarNota, 700);
  }
  function mostrarNota() {
    if (cine || $('nota').classList.contains('on') || !colaNotas.length) return;
    if (panelAbierto) cerrarPanel();
    const m = colaNotas.shift();
    $('nota').querySelector('.de').textContent = T('De Lalito', '¡Meta cumplida! 🎉'); $('notaOk').textContent = T('💞 Gracias, amor', '¡Sigamos! 💪');
    $('notaTxt').textContent = T(m.nota, ['¡Muy bien, Lalito! Sigue así 💪', '¡Eres todo un constructor! 🔨', 'Brittybee estaría muy orgullosa de ti 💞', '¡El reino se ve cada vez más bonito! ✨'][Object.keys(E.metas).length % 4]); $('notaPremio').textContent = `+${m.premio} monedas 🪙`; $('notaMeta').textContent = '✓ ' + m.n;
    $('nota').classList.add('on'); sonar('meta');
    particulas('corazon', jug.pos.clone().setY(2.4), 8);
  }
  $('notaOk').onclick = () => { $('nota').classList.remove('on'); setTimeout(mostrarNota, 400); guardar(); };
  function metaSiguiente() { return METAS.find(m => !E.metas[m.id]); }
  function pintarMetaMini() {
    const m = metaSiguiente(); const el = $('metaMini');
    el.innerHTML = m ? `<b>Meta:</b> ${m.n}` : '<b>¡Completaste todo!</b> Eres la reina del Reino de Dulce 👑';
    $('puntoMetas').hidden = !colaNotas.length;
  }
  $('metaMini').onclick = () => $('bMetas').click();
  $('bMetas').onclick = () => {
    asegurarAudio();
    abrirPanel({
      tit: '📜 Metas', sub: 'Cada meta trae una notita de Lalito 💞',
      render: (c) => METAS.forEach(m => {
        const hecha = !!E.metas[m.id];
        const el = h(`<div class="meta ${hecha ? 'hecha' : ''}"><div class="ck">${hecha ? '✓' : '○'}</div><div class="tx">${m.n}<small>Premio: ${m.premio} 🪙</small></div></div>`);
        if (hecha) { const b = document.createElement('button'); b.className = 'btn sec'; b.textContent = 'Notita 💌'; b.onclick = () => { cerrarPanel(); colaNotas.unshift(m); setTimeout(() => { const pr = m.premio; $('notaTxt').textContent = m.nota; $('notaPremio').textContent = ''; $('notaMeta').textContent = '✓ ' + m.n; $('nota').classList.add('on'); colaNotas.shift(); }, 250); }; el.append(b); }
        c.append(el);
      }),
    });
  };
  // Marcador que guía hacia la meta
  const guia = new THREE.Group();
  { const d = malla(geo('octa', .5), matLuz('#ff6fa3', .6), 0, 0, 0, guia, false); d.scale.y = 1.5; const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texChispa(), transparent: true, depthWrite: false })); s.scale.setScalar(2.2); guia.add(s); }
  scene.add(guia);
  function destinoGuia() {
    const m = metaSiguiente(); if (!m || modo !== 'fuera') return null;
    const falta = (pide) => Object.keys(pide).find(k => cuenta(k) < pide[k]);
    const lugar = (item) => {
      if (ITEMS[item]?.precio) { const p = tiendaPos('mercado'); return [p.x, p.z]; }
      // el árbol / roca / planta más cercano que tenga ese material (primero los que ya están listos)
      let mejor = null, md = 1e9;
      for (const listo of [true, false]) { for (const n of nodos) { if (n.item !== item || n.listo !== listo) continue; const d = Math.hypot(n.x - jug.pos.x, n.z - jug.pos.z); if (d < md) { md = d; mejor = [n.x, n.z]; } } if (mejor) break; }
      return mejor;
    };
    const sp = RECETAS[0].pide;
    switch (m.id) {
      case 'm1': return lugar('galleta');
      case 'm2': { const f = falta(CASAS[0].pide); return f ? lugar(f) : [TERRENOS[0].x - 5.6, TERRENOS[0].z + 8.6]; }
      case 'm3': { const f = falta(sp); return f ? lugar(f) : [13.6, -25]; }
      case 'm4': return RECETAS.some(r => cuenta(r.id)) ? [tiendaPos('mercado').x, tiendaPos('mercado').z] : [13.6, -25];
      case 'm5': return E.flores.length ? [E.flores[0].x, E.flores[0].z] : FLORES.some(f => cuenta('sem_' + f.id)) ? null : [tiendaPos('floreria').x, tiendaPos('floreria').z];
      case 'm6': { const p = tiendaPos('boutique'); return [p.x, p.z]; }
      case 'm7': { const p = tiendaPos('muebles'); return [p.x, p.z]; }
      case 'm8': { const a = E.colocados.find(o => o.id === 'arbolnav' && o.dentro === -1); if (a) return [a.x, a.z]; if (cuenta('arbolnav') && cuenta('esferas')) return null; const p = tiendaPos('bazar'); return [p.x, p.z]; }
      case 'm9': { const p = tiendaPos('autos'); return [p.x, p.z]; }
      case 'm10': return [TERRENOS[1].x - 5.6, TERRENOS[1].z + 8.6];
    }
    return null;
  }

  // Pasos de tutorial (las primeras veces): texto + flecha en el piso
  function pasoTutorial() {
    const m = metaSiguiente(); if (!m || modo !== 'fuera') return null;
    if (!['m1', 'm2', 'm3', 'm4', 'm5'].includes(m.id)) return null;
    const falta = (pide) => Object.keys(pide).find(k => cuenta(k) < pide[k]);
    const donde = (k) => ITEMS[k].precio ? 'en el Mercado 🧺' : k === 'huevo' ? 'en el gallinero del huerto' : ['galleta', 'gomita'].includes(k) ? 'en el Bosque de Galleta' : k === 'azucar' ? 'en los Cristales de Azúcar' : k === 'caramelo' ? 'en la Cantera de Caramelo' : k === 'chocolate' ? 'en el Río de Chocolate' : 'en el huerto 🌽';
    const consigue = (k, n) => `Consigue ${ITEMS[k].n.toLowerCase()} ${ITEMS[k].e} ${donde(k)} (${cuenta(k)}/${n})`;
    switch (m.id) {
      case 'm1': return `Sigue la flecha al Bosque de Galleta 🍪 (${Math.min(E.stats.galletas || 0, 6)}/6)`;
      case 'm2': { const f = falta(CASAS[0].pide); return f ? consigue(f, CASAS[0].pide[f]) + ' para tu primera casita' : '¡Ya tienes todo! Ve a tu terreno y toca 🔨 Construir'; }
      case 'm3': { const f = falta(RECETAS[0].pide); return f ? consigue(f, RECETAS[0].pide[f]) + ' para tu spaghetti 🍝' : 'Ve a la cocinita 🍳 y prepara tu spaghetti'; }
      case 'm4': return RECETAS.some(r => cuenta(r.id)) ? 'Lleva tu comida al Mercado y véndela 🧺' : 'Cocina algo rico en la cocinita 🍳';
      case 'm5': return E.flores.length ? 'Riega tu flor 💧' : FLORES.some(f => cuenta('sem_' + f.id)) ? 'Abre tu mochila 🎒 → Cosas → Plantar aquí' : 'Compra una semilla en la Florería 🌷';
    }
    return null;
  }
  const flecha = new THREE.Group();
  {
    const sh = new THREE.Shape();
    sh.moveTo(0, 1.1); sh.lineTo(.8, .2); sh.lineTo(.32, .2); sh.lineTo(.32, -.7); sh.lineTo(-.32, -.7); sh.lineTo(-.32, .2); sh.lineTo(-.8, .2); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: .14, bevelEnabled: true, bevelThickness: .05, bevelSize: .06, bevelSegments: 2 });
    const m = new THREE.Mesh(g, matLuz('#ff5f9a', .55)); m.rotation.x = -Math.PI / 2; m.castShadow = true;
    const borde = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffffff })); borde.rotation.x = -Math.PI / 2; borde.scale.set(1.18, 1.18, .5); borde.position.y = -.04;
    flecha.add(borde, m);
  }
  flecha.visible = false; scene.add(flecha);
  let pasoPrev = '';
  /* =========================================================
     DÍA Y NOCHE
     ========================================================= */
  const C = (h) => new THREE.Color(h);
  const CIELOS = { dia: [C('#8fd0ff'), C('#ffe6f2')], tarde: [C('#a58be0'), C('#ffbfa8')], noche: [C('#16133a'), C('#4a3170')] };
  let noche = 0;
  function aplicarHora() {
    const sun = Math.sin((E.hora - .25) * Math.PI * 2);
    let a, b, k;
    if (sun > .25) { a = CIELOS.dia; b = CIELOS.dia; k = 0; }
    else if (sun > -.05) { a = CIELOS.tarde; b = CIELOS.dia; k = (sun + .05) / .3; }
    else if (sun > -.3) { a = CIELOS.noche; b = CIELOS.tarde; k = (sun + .3) / .25; }
    else { a = CIELOS.noche; b = CIELOS.noche; k = 0; }
    cieloU.arriba.value.copy(a[0]).lerp(b[0], k); cieloU.abajo.value.copy(a[1]).lerp(b[1], k);
    scene.fog.color.copy(cieloU.abajo.value);
    noche = clamp(-sun * 2.2 + .15, 0, 1);
    hemi.intensity = lerp(.55, .3, noche); sol.intensity = lerp(.62, .1, noche);
    hemi.color.set(noche > .5 ? '#c9b8ff' : '#fff0f7');
    sol.color.set(sun < .2 && sun > -.1 ? '#ffc29a' : noche > .5 ? '#9fa8ff' : '#fff3e0');
    amb.intensity = modo === 'dentro' ? .1 : lerp(.12, .22, noche);
    estrellasMat.opacity = noche; luna.material.opacity = noche;
    for (const m of MATS_LUZ) m.emissiveIntensity = m.userData.base + noche * 1.1;
    const hh = Math.floor(E.hora * 24), mm = Math.floor((E.hora * 24 - hh) * 60 / 10) * 10;
    const rt = `${noche > .5 ? '🌙' : sun < .2 ? '🌅' : '☀️'} ${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'am' : 'pm'}`;
    if ($('reloj').textContent !== rt) $('reloj').textContent = rt;
  }

  /* =========================================================
     BUCLE PRINCIPAL
     ========================================================= */
  let ultimoGuardado = 0, tPrev = performance.now();
  function cuadro(tAhora) {
    requestAnimationFrame(cuadro);
    const dt = Math.min(.05, (tAhora - tPrev) / 1000); tPrev = tAhora; reloj += dt;
    actualizarTweens();
    E.hora = (E.hora + dt / 960) % 1; aplicarHora();
    // jugadora
    const moviendo = moverJugadora(dt);
    if (jug.accion && reloj > jug.accion.hasta) jug.accion = null;
    let estado = jug.accion ? jug.accion.estado : moviendo && jug.vel > .5 ? (jug.veh ? jug.veh.pose : 'camina') : jug.veh ? (jug.veh.patines ? 'quieta' : jug.veh.pose === 'pedalea' ? 'maneja' : jug.veh.pose) : 'quieta';
    if (jug.sentada) estado = jug.sentada.comiendo ? 'comeSentada' : 'sentada';
    if (jug.guion) { jug.pos.copy(jug.guion.obj.position); jug.ry = jug.guion.obj.rotation.y; estado = jug.guion.est; }
    if (vistaBoutique) estado = 'quieta';
    const vk = jug.veh && !jug.veh.patines ? 1 : clamp(jug.vel / 6, .6, 1.4);
    if (jug.sentada && jug.sentada.comiendo) jug.t += dt * 2;
    jug.t += dt * (estado === 'camina' ? 7 * vk : estado === 'pedalea' ? 9 : estado === 'patina' ? 4 : 3);
    animarPersona(jug.p, estado, jug.t, 1); jug.estadoAct = estado;
    if (jug.guion) jug.p.g.position.y = jug.guion.sent ? -.1 : (jug.veh ? jug.p.g.position.y : 0);
    if (jug.sentada) {
      const s = jug.sentada; s.t += dt;
      jug.p.g.position.y = s.alto - .6 + .02;
      if (s.columpio) { const m = objColocados.get(s.o.ref); const sw = m?.userData.columpio; const a = Math.sin(s.t * 2.2) * .5; if (sw) sw.rotation.x = a; jug.p.g.position.y = 2.6 - Math.cos(a) * 2 - .6 + .05; jug.p.g.position.z = Math.sin(a) * 2; }
    }
    if (jug.y > 0 || jug.vy > 0) { jug.vy -= 26 * dt; jug.y += jug.vy * dt; if (jug.y <= 0) { jug.y = 0; jug.vy = 0; particulas('polvo', jug.pos.clone().setY(.2), 4); } }
    if (jug.y > .05 && !jug.veh) estado = 'brinca';
    if (estado === 'brinca') animarPersona(jug.p, 'brinca', jug.t);
    jug.raiz.position.copy(jug.pos); jug.raiz.position.y = jug.y; jug.raiz.rotation.y = jug.ry;
    if (jug.veh) {
      const u = jug.veh, w = jug.vel * dt;
      u.ruedas.forEach(r => { r.rotation.x += w / .45; });
      if (u.patas) u.patas.forEach((p, i) => { p.rotation.x = moviendo ? Math.sin(reloj * 10 + (i % 2) * Math.PI + (i > 1 ? Math.PI / 2 : 0)) * .5 : 0; });
      if (u.poni) u.poni.position.y = moviendo ? Math.abs(Math.sin(reloj * 10)) * .08 : 0;
    }
    // sol y sombra siguen a la jugadora
    sol.position.set(jug.pos.x + 30, 55, jug.pos.z + 22); sol.target.position.copy(jug.pos);
    luna.position.set(camera.position.x - 160, 140, camera.position.z - 220);
    cielo.position.copy(camera.position); estrellas.position.copy(camera.position);
    // mundo
    for (const f of animados) f(reloj, dt);
    if (modo === 'fuera') { actualizarNodos(reloj); actualizarFlores(dt); }
    for (const [o, m] of objColocados) { if (o.id === 'arbolnav') m.traverse(c => { if (c.userData.titila !== undefined) c.visible = Math.sin(reloj * 3 + c.userData.titila) > -.6; if (c.userData.gira) c.rotation.y += dt; }); if (o.id === 'columpio' && !(jug.sentada && jug.sentada.o.ref === o)) { const sw = m.userData.columpio; if (sw) sw.rotation.x *= .95; } }
    for (const m of casasMesh) if (m) m.traverse(c => { if (c.userData.bandera) c.rotation.y = Math.sin(reloj * 3 + c.position.x) * .3; });
    actualizarParticulas(dt);
    // guía
    const dg = destinoGuia();
    if (dg && !cine) { guia.visible = true; guia.position.set(dg[0], 4.6 + Math.sin(reloj * 3) * .35, dg[1]); guia.rotation.y += dt * 2; const d = Math.hypot(dg[0] - jug.pos.x, dg[1] - jug.pos.z); guia.scale.setScalar(d < 6 ? .6 : 1); }
    else guia.visible = false;
    if (!cine) buscarInteractivo();
    // flecha y texto del tutorial
    let pt = !cine && !panelAbierto ? pasoTutorial() : null;
    if (pt && interActual) pt = `Toca el botón rosa: ${interActual.txt()} ${interActual.ic}`;
    if (pt !== pasoPrev) { pasoPrev = pt; const el = $('paso'); el.hidden = !pt; if (pt) { el.textContent = pt; el.classList.remove('nuevo'); void el.offsetWidth; el.classList.add('nuevo'); } }
    if (dg && modo === 'fuera' && !cine && !panelAbierto && !jug.accion) {
      // si el destino está del otro lado del río, primero lleva al puente más cercano
      let tx = dg[0], tz = dg[1];
      const ladoJ = jug.pos.x < riox(jug.pos.z), ladoD = dg[0] < riox(dg[1]);
      if (ladoJ !== ladoD) {
        const pz = PUENTES.reduce((a, b) => Math.abs(b - jug.pos.z) + Math.abs(b - dg[1]) < Math.abs(a - jug.pos.z) + Math.abs(a - dg[1]) ? b : a);
        const enPuente = Math.abs(jug.pos.z - pz) < 2.5 && Math.abs(jug.pos.x - riox(pz)) < 6;
        if (!enPuente) { tx = riox(pz) + (ladoJ ? -6 : 6); tz = pz; if (Math.hypot(tx - jug.pos.x, tz - jug.pos.z) < 1.5) { tx = riox(pz) + (ladoJ ? 6 : -6); } }
        else { tx = riox(pz) + (ladoJ ? 6 : -6); tz = pz; }
      }
      const dx = tx - jug.pos.x, dz = tz - jug.pos.z, d = Math.hypot(dx, dz);
      if (d > 3.2 && Math.hypot(dg[0] - jug.pos.x, dg[1] - jug.pos.z) > 3.6) {
        flecha.visible = true;
        const off = 2.9 + Math.sin(reloj * 5) * .35;
        flecha.position.set(jug.pos.x + dx / d * off, .12 + (jug.veh ? .1 : 0), jug.pos.z + dz / d * off);
        flecha.rotation.y = Math.atan2(dx, dz) + Math.PI;
        flecha.scale.setScalar(1.35 + Math.sin(reloj * 5) * .08);
      } else flecha.visible = false;
    } else flecha.visible = false;
    actualizarCamara(dt);
    // burbujas encima de las cabezas
    const ta = performance.now();
    for (let i = burbujas.length - 1; i >= 0; i--) {
      const b = burbujas[i];
      if (ta > b.hasta || !b.obj.parent) { b.el.remove(); burbujas.splice(i, 1); continue; }
      const p = b.obj.getWorldPosition(V3()); p.y += b.alto + (b.obj === jug.raiz && jug.veh ? jug.veh.asiento - .5 : 0);
      const s = aPantalla(p); b.el.style.left = s.x + 'px'; b.el.style.top = s.y + 'px'; b.el.style.display = s.z > 1 ? 'none' : '';
    }
    if (reloj - ultimoGuardado > 8) { ultimoGuardado = reloj; E.pos = { x: modo === 'fuera' ? jug.pos.x : (interactivos.find(o => o.puerta === casaDentro)?.x ?? 0), z: modo === 'fuera' ? jug.pos.z : (interactivos.find(o => o.puerta === casaDentro)?.z + 1.6 ?? 16), ry: jug.ry }; guardar(); }
    renderer.render(scene, camera);
  }

  /* =========================================================
     JUGAR LOS DOS AL MISMO TIEMPO (en tiempo real)
     ========================================================= */
  const NOMBRES = { brittani: 'Brittybee', lalito: 'Lalito' };
  const MI_ID = Math.random().toString(36).slice(2, 10);
  const TEMA_JUNTOS = window.NUBE ? NUBE.SALA + '/juntos' : null;
  let otro = null, nEnv = 0, tEnv = 0, tInfo = 0;
  const vistos = {};
  function etiquetaNombre(txt, ella) {
    const t = texCanvas(256, 64, (x) => { x.fillStyle = ella ? '#ff6fa6' : '#5b8fe0'; redondo(x, 4, 6, 248, 52, 26); x.fill(); x.fillStyle = '#fff'; x.font = '900 34px Nunito, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 128, 34); });
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); sp.scale.set(1.8, .45, 1); return sp;
  }
  function crearOtro(m) {
    const ella = m.perfil !== 'lalito';
    const g = new THREE.Group();
    const o = { id: m.de, perfil: m.perfil, g, ella, ropa: JSON.stringify(m.ropa || {}), p: null, veh: null, vehId: null, x: m.x || 0, z: m.z || 0, y: 0, ry: 0, tx: m.x || 0, tz: m.z || 0, ty: 0, try: 0, estado: 'quieta', t: 0, ult: Date.now(), modo: 'fuera' };
    o.vestir = () => {
      if (o.p) g.remove(o.p.g);
      if (o.ella) o.p = crearChica(Object.assign({ top: 'blusaRosa', abajo: 'jeans', zapatos: 'tenis', acc: 'nada', peinado: 'suelto' }, JSON.parse(o.ropa)));
      else { o.p = crearChico(); o.p.casco.visible = false; o.p.martillo.visible = false; }
      g.add(o.p.g); o.acomodar();
    };
    o.acomodar = () => { o.p.g.position.set(0, 0, 0); if (o.veh) { if (o.veh.patines) { o.p.g.position.y = .1; for (const k of ['piernaI', 'piernaD']) { const pt = crearPatin(); pt.position.set(0, -.6, .04); o.p[k].add(pt); } } else o.p.g.position.set(0, o.veh.asiento - .6, o.veh.zPersona || 0); } };
    o.lab = etiquetaNombre(NOMBRES[m.perfil] || 'Jugador', ella); o.lab.position.y = 2.75; g.add(o.lab);
    o.vestir();
    g.position.set(o.x, 0, o.z); scene.add(g);
    particulas('chispa', V3(o.x, 1.2, o.z), 18); particulas('corazon', V3(o.x, 2, o.z), 6);
    return o;
  }
  function quitarOtro(msg) {
    if (!otro) return;
    particulas('chispa', otro.g.position.clone().setY(1.2), 14);
    scene.remove(otro.g); const n = NOMBRES[otro.perfil]; otro = null;
    $('bCorazon').hidden = true; $('enLinea').hidden = true;
    if (msg) aviso(msg.replace('{n}', n), 3000);
  }
  function mandarJuntos(m) { if (!TEMA_JUNTOS) return; m.de = MI_ID; m.n = ++nEnv; NUBE.publicar(TEMA_JUNTOS, m); }
  function recibirJuntos(m) {
    if (!m || m.de === MI_ID) return;
    if (vistos[m.de] && m.n <= vistos[m.de]) return;  // repetido (llega por dos servidores)
    vistos[m.de] = m.n;
    if (otro && otro.id !== m.de) {
      if (Date.now() - otro.ult < 4000) return;  // ya estoy jugando con alguien
      quitarOtro();
    }
    if (m.t === 'adios') { if (otro) quitarOtro('{n} salió del reino 👋'); return; }
    if (!otro) {
      if (m.t !== 'pos' && m.t !== 'info') return;
      otro = crearOtro(m);
      $('bCorazon').hidden = false; $('enLinea').hidden = false; $('enLinea').textContent = `👥 ${NOMBRES[m.perfil]} está jugando`;
      sonar('fanfarria'); aviso(`💞 ¡${NOMBRES[m.perfil]} entró al reino! Ya pueden jugar juntos`, 3600);
      mandarJuntos(Object.assign(miPos(), { t: 'info', ropa: E.ropa, perfil: PERFIL }));
    }
    otro.ult = Date.now();
    if (m.t === 'pos' || m.t === 'info') {
      otro.tx = m.x; otro.tz = m.z; otro.ty = m.y || 0; otro.try = m.ry || 0; otro.estado = m.e || 'quieta'; otro.modo = m.m || 'fuera';
      if (m.t === 'info' && m.ropa && JSON.stringify(m.ropa) !== otro.ropa) { otro.ropa = JSON.stringify(m.ropa); otro.vestir(); }
      if ((m.v || null) !== otro.vehId) {
        if (otro.veh) otro.g.remove(otro.veh.g);
        otro.vehId = m.v || null; otro.veh = otro.vehId ? crearVehiculo(otro.vehId) : null;
        if (otro.veh) otro.g.add(otro.veh.g);
        otro.vestir();
      }
      if (m.sent && !otro.sentada) otro.sentada = true; else if (!m.sent) otro.sentada = false;
      otro.ocupado = !!m.c;
    } else if (m.t === 'corazon') {
      const p = otro.g.position.clone();
      particulas('corazon', p.clone().setY(2.4), 10); burbuja(otro.g, '💞💞💞', 2200, 2.7); sonar('meta');
      aviso(`💞 ${NOMBRES[otro.perfil]} te mandó un corazón`, 2400);
    } else if (m.t === 'abrazo') {
      if (otro.modo === modo) {
        const p = otro.g.position;
        if (Math.hypot(p.x - jug.pos.x, p.z - jug.pos.z) < 4 && !cine && !jug.veh) { mirarA(p.x, p.z); jug.accion = { estado: 'abraza', hasta: reloj + 2.4 }; }
        particulas('corazon', p.clone().setY(2), 10); sonar('meta');
        burbuja(otro.g, m.txt || '🤗💞', 2400, 2.7);
      }
    } else if (m.t === 'escena') {
      if (cine || modo !== 'fuera' || otro.modo !== 'fuera') return;
      if (jug.sentada) levantarse();
      if (m.tipo === 'construir' && CASAS.some(c => c.id === m.id) && TERRENOS[m.i]) escenaConstruir(m.i, m.id, 'construye');
      else if (m.tipo === 'comer' && RECETAS.some(r => r.id === m.r)) escenaComer(m.r, V3(m.cx, 0, m.cz), m.ry, 'sirve');
      else if (m.tipo === 'fiesta' && !ES_EL) { E.fiestaVista = Math.max(E.fiestaVista || 0, m.id || 0); guardar(); escenaFiesta({ C: V3(m.cx, 0, m.cz), ry: m.ry, carta: String(m.carta || '').slice(0, 8000), rol: 'cumpleVivo', id: m.id }); }
    } else if (m.t === 'saltar') {
      if (cine) saltando = true;
    } else if (m.t === 'dice') {
      burbuja(otro.g, String(m.txt || '').slice(0, 80), 2600, 2.7);
    }
  }
  function miPos() {
    const dentro = modo === 'dentro';
    return { x: +jug.pos.x.toFixed(2), z: +jug.pos.z.toFixed(2), y: +jug.y.toFixed(2), ry: +jug.ry.toFixed(2), e: jug.estadoAct || 'quieta', v: jug.veh ? jug.veh.id : null, m: dentro ? 'dentro' + casaDentro : 'fuera', sent: !!(jug.sentada || (jug.guion && jug.guion.sent)), c: cine ? 1 : 0, perfil: PERFIL };
  }
  if (TEMA_JUNTOS) NUBE.suscribir(TEMA_JUNTOS, recibirJuntos);
  const interOtro = { x: 0, z: 0, r: 2.6, ic: '🤗', txt: () => 'Abrazar a ' + (otro ? NOMBRES[otro.perfil] : ''), activo: () => !!otro && otro.g.visible && !jug.veh, fn: () => {
    if (!otro) return;
    const p = otro.g.position; mirarA(p.x, p.z);
    jug.accion = { estado: 'abraza', hasta: reloj + 2.4 };
    particulas('corazon', p.clone().lerp(jug.pos, .5).setY(2), 10); sonar('meta');
    const txt = T('¡Te amo! 🤗💞', '¡Te amo, princesa! 🤗💞');
    burbuja(jug.raiz, txt, 2200);
    mandarJuntos({ t: 'abrazo', txt });
  } };
  interactivos.push(interOtro);
  $('bCorazon').onclick = () => { if (!otro) return; mandarJuntos({ t: 'corazon' }); particulas('corazon', jug.pos.clone().setY(2.4), 8); burbuja(jug.raiz, '💞', 1400); sonar('pop'); };
  animados.push((t, dt) => {
    if (!TEMA_JUNTOS) return;
    tEnv += dt; tInfo += dt;
    if (tInfo > 3) { tInfo = 0; mandarJuntos(Object.assign(miPos(), { t: 'info', ropa: E.ropa })); tEnv = 0; }
    else if (tEnv > .1) { tEnv = 0; mandarJuntos(Object.assign(miPos(), { t: 'pos' })); }
    if (!otro) return;
    if (Date.now() - otro.ult > 7000) { quitarOtro('Se perdió la conexión con {n} 📶'); return; }
    const mismoLugar = otro.modo === (modo === 'dentro' ? 'dentro' + casaDentro : 'fuera') && otro.modo === 'fuera';
    otro.g.visible = mismoLugar;
    $('enLinea').textContent = `👥 ${NOMBRES[otro.perfil]} ${mismoLugar ? 'está jugando' : otro.modo === 'fuera' ? 'está afuera' : 'está en su casita'}`;
    if (otro.guion) {
      otro.x = otro.g.position.x; otro.z = otro.g.position.z; otro.ry = otro.g.rotation.y;
      otro.g.visible = true;
      otro.t += dt * (otro.guion.est === 'camina' ? 9 : otro.guion.est === 'lleva' ? 8 : 3);
      animarPersona(otro.p, otro.guion.est, otro.t, 1);
      otro.p.g.position.y = otro.guion.sent ? -.1 : 0;
      interOtro.x = otro.x; interOtro.z = otro.z;
      return;
    }
    const k = Math.min(1, dt * 12);
    // si brincó lejos (cambio de lugar), aparece directo
    if (Math.hypot(otro.tx - otro.x, otro.tz - otro.z) > 12) { otro.x = otro.tx; otro.z = otro.tz; }
    otro.x = lerp(otro.x, otro.tx, k); otro.z = lerp(otro.z, otro.tz, k); otro.y = lerp(otro.y, otro.ty, k);
    let d = otro.try - otro.ry; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; otro.ry += d * k;
    otro.g.position.set(otro.x, otro.y, otro.z); otro.g.rotation.y = otro.ry;
    otro.t += dt * (otro.estado === 'camina' ? 7 : otro.estado === 'pedalea' ? 9 : 3);
    animarPersona(otro.p, otro.estado, otro.t, 1);
    if (otro.sentada || otro.estado === 'sentada' || otro.estado === 'comeSentada') otro.p.g.position.y = (otro.veh ? otro.veh.asiento : .5) - .6;
    else if (!otro.veh) otro.p.g.position.y = 0;
    if (otro.veh) { const vel = Math.hypot(otro.tx - otro.x, otro.tz - otro.z) * 10; otro.veh.ruedas.forEach(r => { r.rotation.x += vel * dt / .45; }); if (otro.veh.patas) otro.veh.patas.forEach((p, i) => { p.rotation.x = vel > .3 ? Math.sin(reloj * 10 + (i % 2) * Math.PI + (i > 1 ? Math.PI / 2 : 0)) * .5 : 0; }); }
    interOtro.x = otro.x; interOtro.z = otro.z;
  });
  addEventListener('pagehide', () => mandarJuntos({ t: 'adios' }));

  /* =========================================================
     CUMPLEAÑOS DE BRITTYBEE (se prepara desde el perfil de Lalito)
     ========================================================= */
  const TEMA_FIESTA = window.NUBE ? NUBE.SALA + '/fiesta' : null;
  let fiestaNube = null, fiestaCorriendo = false;
  if (TEMA_FIESTA) NUBE.suscribir(TEMA_FIESTA, (o) => { if (o && o.t && (!fiestaNube || o.t >= fiestaNube.t)) { fiestaNube = o; if (ES_EL && o.carta && !E.cartaBorrador) E.cartaBorrador = o.carta; } });
  if (ES_EL) $('bFiesta').hidden = false;
  $('bFiesta').onclick = () => panelFiesta();
  const CARTA_CUMPLE = "Mi Brittybee hermosa:\n\n¡Feliz cumpleaños, mi princesa! Hoy es tu día y quise hacerte una fiesta aquí, en este reino que hice solo para ti, porque te mereces que todo el mundo, hasta uno hecho de dulces, celebre que existes.\n\nGracias por nacer. Gracias por llegar a mi vida justo cuando más la necesitaba. Desde aquel primer \"hola\" mi mundo cambió de colores, y cada día que pasa me doy cuenta de que eres lo más bonito que me ha pasado. Eres mi paz cuando el día se pone difícil, mi risa cuando estoy cansado y la razón por la que sonrío como tonto viendo el celular.\n\nSé que la distancia a veces pesa. Sé que hay días en los que quisiéramos abrazarnos y no podemos. Pero quiero que sepas algo: cada kilómetro que nos separa es un kilómetro que algún día voy a recorrer para llegar a ti. Sueño con el momento en que por fin te vea a los ojos, te abrace fuerte y no te suelte en un buen rato. Ese día va a llegar, mi amor, te lo prometo.\n\nEn este nuevo año de tu vida te deseo todo lo bonito del mundo: que se cumplan tus sueños, que nunca te falten razones para sonreír, que te rodee gente que te quiera de verdad y que siempre te sientas tan especial como eres. Y si algún día se te olvida lo increíble que eres, aquí voy a estar yo para recordártelo todas las veces que haga falta.\n\nEres fuerte, eres dulce, eres valiente y eres preciosa por dentro y por fuera. Admiro tu corazón, tu forma de querer y la manera en que haces que todo se sienta más ligero. Me siento el hombre más afortunado del mundo por poder llamarte mi novia.\n\nGracias por elegirme, por tenerme paciencia, por quererme como me quieres y por soñar conmigo un futuro juntos. Quiero estar en todos tus cumpleaños: en los que nos toquen lejos y en los que por fin pasemos juntos, con pastel de verdad, tu pizza, tu Pepsi bien fría y yo cantándote Las mañanitas en persona.\n\nTe amo hoy, te amo mañana y te voy a amar en todos los capítulos que nos falten por escribir. Eres y siempre serás mi princesa.\n\n¡Feliz cumpleaños, mi amor! 💞";
  function panelFiesta() {
    abrirPanel({
      tit: '🎂 Cumpleaños de Brittybee', sub: 'Prepárale una fiesta sorpresa con Lalito chiquito: pastel, pizza, su Pepsi, globos, regalos y una cartita tuya. Al darle el pastel suenan Las mañanitas 🎵',
      render: (c) => {
        c.append(h('<div style="font-weight:900;margin:2px 4px 6px">💌 Tu cartita para ella <small style="font-weight:700;color:#9a5577">(ya te dejé una escrita: puedes cambiarla como quieras)</small></div>'));
        const ta = document.createElement('textarea'); ta.className = 'carta-edit'; ta.maxLength = 8000; ta.placeholder = 'Escríbele aquí tu cartita de cumpleaños…'; ta.value = E.cartaBorrador || CARTA_CUMPLE; ta.style.minHeight = '240px';
        ta.oninput = () => { E.cartaBorrador = ta.value; };
        c.append(ta);
        const enLinea = otro && otro.perfil === 'brittani' && Date.now() - otro.ult < 3000;
        const estado = fiestaNube && fiestaNube.pendiente ? '🎁 Ya tiene una sorpresa guardada esperándola.' : fiestaNube && fiestaNube.vista ? '✅ Ya vio su última fiesta.' : '';
        c.append(h(`<p style="font-size:13.5px;color:#9a5577;margin:10px 4px">${enLinea ? '💞 <b>Brittybee está jugando ahorita</b>: la fiesta le sale en vivo a los dos.' : '📴 Brittybee no está conectada: la fiesta se guarda y le sale de sorpresa la próxima vez que entre.'} ${estado}</p>`));
        const pie = $('panelPie'); pie.hidden = false; pie.innerHTML = '';
        const b1 = document.createElement('button'); b1.className = 'btn sec'; b1.textContent = '👀 Ver cómo queda'; b1.style.flex = '0 0 auto';
        b1.onclick = () => { E.cartaBorrador = ta.value; guardar(); cerrarPanel(); escenaFiesta({ C: frente(3), ry: jug.ry, carta: ta.value, rol: 'prueba' }); };
        const b2 = document.createElement('button'); b2.className = 'btn verde'; b2.textContent = enLinea ? '🎉 ¡Hacerle la fiesta ahora!' : '🎁 Guardar la sorpresa';
        b2.onclick = () => {
          const carta = ta.value.trim(); if (!carta) { aviso('Escríbele su cartita primero 💌'); return; }
          E.cartaBorrador = ta.value; guardar(true);
          const id = Date.now();
          const vivo = otro && otro.perfil === 'brittani' && otroDisponible();
          NUBE.publicarRetenido(TEMA_FIESTA, { t: id, carta, pendiente: !vivo, vista: !!vivo });
          fiestaNube = { t: id, carta, pendiente: !vivo, vista: !!vivo };
          cerrarPanel();
          if (vivo) {
            const fr = V3(Math.sin(otro.ry), 0, Math.cos(otro.ry));
            const C = otro.g.position.clone().addScaledVector(fr, 3); C.y = 0;
            mandarJuntos({ t: 'escena', tipo: 'fiesta', cx: +C.x.toFixed(2), cz: +C.z.toFixed(2), ry: +otro.ry.toFixed(3), carta, id });
            escenaFiesta({ C, ry: otro.ry, carta, rol: 'festeja' });
          } else aviso('🎁 ¡Listo! La próxima vez que Brittybee entre al reino le saldrá su fiesta sorpresa 💞', 4200);
        };
        pie.append(b1, b2);
      },
    });
  }
  const frente = (d) => jug.pos.clone().addScaledVector(V3(Math.sin(jug.ry), 0, Math.cos(jug.ry)), d);
  // Ella revisa si tiene una fiesta guardada esperándola
  animados.push(() => {
    if (ES_EL || fiestaCorriendo || !fiestaNube || !fiestaNube.pendiente || cine || panelAbierto || tutoAbierto || modo !== 'fuera' || $('nota').classList.contains('on')) return;
    if ((E.fiestaVista || 0) >= fiestaNube.t) return;
    if (reloj < 4) return;
    E.fiestaVista = fiestaNube.t; guardar(true);
    NUBE.publicarRetenido(TEMA_FIESTA, Object.assign({}, fiestaNube, { pendiente: false, vista: true }));
    escenaFiesta({ C: frente(3.2), ry: jug.ry, carta: fiestaNube.carta, rol: 'cumple' });
  });
  function mostrarCarta(txt) {
    return new Promise(ok => {
      $('cartaFiestaTxt').textContent = txt || '';
      $('cartaFiesta').classList.add('on'); sonar('abrir');
      $('cartaFiestaOk').onclick = () => { $('cartaFiesta').classList.remove('on'); ok(); };
    });
  }
  // rol: 'cumple' (ella, Lalito de mentiritas) · 'cumpleVivo' (ella, Lalito de verdad) · 'festeja' (yo Lalito, ella de verdad) · 'prueba' (yo Lalito viendo cómo queda)
  async function escenaFiesta({ C, ry, carta, rol }) {
    if (fiestaCorriendo) return; fiestaCorriendo = true;
    const ellaSoyYo = rol === 'cumple' || rol === 'cumpleVivo';
    if (panelAbierto) cerrarPanel(); bajar(true); pintarBajar(); if (jug.sentada) levantarse(); jug.accion = null;
    modoCine(true); saltando = false;
    $('fundido').classList.add('on'); await new Promise(r => setTimeout(r, 650));
    const f = V3(Math.sin(ry), 0, Math.cos(ry)), lado = V3(Math.cos(ry), 0, -Math.sin(ry));
    const fiesta = new THREE.Group(); scene.add(fiesta);
    // mesa con pastel, pizza y Pepsi
    const mesa = crearObjeto('mesa'); mesa.position.copy(C); mesa.rotation.y = ry; fiesta.add(mesa);
    mesa.children.slice(-2).forEach(c => c.visible = false); // sin sillas
    const pastel = crearPastelCumple(); pastel.position.copy(C).add(V3(0, .9, 0)); fiesta.add(pastel);
    const pizza = crearPlato('pizza'); pizza.position.copy(C).addScaledVector(lado, .45).add(V3(0, .9, 0)); fiesta.add(pizza);
    for (const k of [-1, 1]) { const r = crearRefresco(); r.position.copy(C).addScaledVector(lado, -.45).addScaledVector(f, k * .18).add(V3(0, .9, 0)); fiesta.add(r); }
    // letrero y globos
    const letrero = crearLetreroCumple('¡Feliz cumpleaños, Brittybee!'); letrero.position.copy(C).addScaledVector(f, 2.2); letrero.rotation.y = ry + Math.PI; fiesta.add(letrero);
    const globos = [];
    for (const [a, b] of [[-3.2, 1.8], [3.2, 1.8], [-1.7, 2.7], [1.7, 2.7]]) { const gl = crearGlobos(3 + (globos.length % 2)); gl.position.copy(C).addScaledVector(lado, a).addScaledVector(f, b); fiesta.add(gl); globos.push(gl); }
    // regalos (el rosa trae la cartita)
    const regalos = [['#9ad7ff', '#ffffff', false], ['#b89cf5', '#ffd23f', false], ['#ff6fa3', '#ffffff', true]].map(([c, l, carta], k) => { const r = crearRegaloGrande(c, l, carta); r.position.copy(C).addScaledVector(lado, -1.8 + k * .05).addScaledVector(f, -.9 + k * .95); r.rotation.y = ry + k; fiesta.add(r); return r; });
    const anGlobos = (t) => globos.forEach((gl, i) => gl.userData.globos.forEach((b, k) => { b.position.y = 2.4 + (k % 2) * .4 + Math.sin(t * 1.4 + i + k) * .12; b.rotation.z = Math.sin(t + k) * .1; }));
    animados.push(anGlobos);
    // la cumpleañera
    const posElla = C.clone().addScaledVector(f, -2.6);
    let ella;
    if (ellaSoyYo) { jug.pos.copy(posElla); jug.ry = ry; ella = { bur: jug.raiz, g: jug.raiz, set(e, s = 3) { jug.accion = { estado: e, hasta: reloj + s }; } }; }
    else if (rol === 'festeja') ella = { bur: otro.g, g: otro.g, set() { } };
    else { const pE = crearChica({ top: 'vestidoGala', abajo: 'jeans', zapatos: 'cristal', acc: 'corona', peinado: 'chongo' }); pE.g.position.copy(posElla); pE.g.rotation.y = ry; scene.add(pE.g); let est = 'quieta', t = 0; const an = (tt, dt) => { t += dt * 3; animarPersona(pE, est, t); }; animados.push(an); ella = { bur: pE.g, g: pE.g, p: pE, an, set(e) { est = e; } }; }
    // Lalito y Lalito chiquito
    const A = rol === 'cumple' ? actorNPC() : rol === 'cumpleVivo' ? actorRemoto() : actorYo();
    if (A.p.casco) { A.p.casco.visible = false; A.p.martillo.visible = false; }
    A.g.position.copy(C).addScaledVector(lado, 1.3).addScaledVector(f, .2); A.g.rotation.y = ry + Math.PI;
    const B = crearBebe(); B.g.position.copy(C).addScaledVector(lado, -1.3).addScaledVector(f, -.4); B.g.rotation.y = ry + Math.PI; scene.add(B.g);
    let estB = 'saluda', tB = 0; const anB = (t, dt) => { tB += dt * 3; animarPersona(B, estB, tB); }; animados.push(anB);
    cine = { centro: C.clone().addScaledVector(f, -1).setY(1.2), ang: Math.atan2(-f.x, -f.z) + .55, dist: 7.5, alto: 2.6, vel: -.05 };
    $('fundido').classList.remove('on');
    await espera(.6);
    // ¡Sorpresa!
    sonar('fanfarria'); particulas('confeti', C.clone().setY(4), 70); particulas('corazon', C.clone().setY(2.5), 12);
    A.set('baila'); estB = 'baila';
    burbuja(A.bur, '¡SORPRESA! 🎉 ¡Feliz cumpleaños, mi amor!', 3000, 2.9);
    burbuja(B.g, '¡Sorpresa! 🎈', 2600, 2);
    await espera(2.4);
    ella.set('abraza', 2.5); burbuja(ella.bur, '¡¿Qué?! ¡No puede ser! 🥹💞', 2600);
    await espera(2.8);
    // el pastel con Las mañanitas
    A.set('lleva'); estB = 'quieta';
    burbuja(A.bur, 'Te traje tu pastel 🎂', 2000, 2.9);
    const ini = A.g.position.clone(), destino = posElla.clone().addScaledVector(f, 1.1);
    const portaPastel = new THREE.Group(); scene.add(portaPastel); fiesta.remove(pastel); pastel.position.set(0, 1.05, .45); portaPastel.add(pastel);
    const sigue = () => { portaPastel.position.copy(A.g.position); portaPastel.rotation.y = A.g.rotation.y; }; animados.push(sigue);
    A.g.rotation.y = Math.atan2(destino.x - ini.x, destino.z - ini.z);
    await tween(1.4, (k) => A.g.position.lerpVectors(ini, destino, k));
    A.set('lleva'); A.g.rotation.y = ry + Math.PI;
    cine = { centro: posElla.clone().lerp(destino, .5).setY(1.3), ang: Math.atan2(lado.x, lado.z) + .25, dist: 4.6, alto: 1.4, vel: .025 };
    // suenan Las mañanitas
    // se usa el mismo reproductor de la música de fondo (en iPhone ya tiene permiso para sonar)
    const man = musica; const srcFondo = man.src, tFondo = man.currentTime;
    man.pause(); man.loop = false; man.src = '../5-meses/musica/mananitas.mp3'; man.volume = .95;
    try { await man.play(); } catch (e) { }
    $('cancion').hidden = false;
    estB = 'baila'; ella.set('quieta', 200);
    const ivC = setInterval(() => particulas('corazon', posElla.clone().setY(2.6), 2), 900);
    const t0 = performance.now();
    while (!man.ended && !saltando && performance.now() - t0 < (man.duration ? man.duration * 1000 + 800 : 92000)) {
      await new Promise(r => setTimeout(r, 300));
      if (!man.duration && performance.now() - t0 > 4000 && man.paused) break; // no se pudo reproducir
    }
    if (saltando) { saltando = false; }
    man.pause(); clearInterval(ivC); $('cancion').hidden = true;
    man.src = srcFondo; man.loop = true; man.volume = .45;
    const volver = () => { try { man.currentTime = tFondo; } catch (e) { } man.removeEventListener('loadedmetadata', volver); };
    man.addEventListener('loadedmetadata', volver); tocarMusica();
    // sopla las velitas
    burbuja(A.bur, '¡Pide un deseo y sopla tus velitas! 🎂✨', 2600, 2.9);
    await espera(2.6);
    burbuja(ella.bur, '*Fuuuu* 🌬️💞', 1600); ella.set('saluda', 1.4);
    await espera(.8);
    pastel.userData.llamas.forEach(l => { l.visible = false; particulas('vapor', pastel.localToWorld(l.position.clone()), 2); });
    sonar('fanfarria'); particulas('confeti', posElla.clone().setY(3.5), 60); particulas('corazon', posElla.clone().setY(2.4), 12);
    estB = 'baila';
    burbuja(B.g, '¡Yeeei! 🎉', 1800, 2);
    await espera(2);
    // a la mesa: pastel, pizza y Pepsi
    portaPastel.remove(pastel); animados.splice(animados.indexOf(sigue), 1); scene.remove(portaPastel);
    pastel.position.copy(C).add(V3(0, .9, 0)); fiesta.add(pastel);
    A.g.position.copy(C).addScaledVector(lado, 1.3).addScaledVector(f, -.6); A.g.rotation.y = Math.atan2(-lado.x, -lado.z);
    if (ellaSoyYo) { jug.pos.copy(C).addScaledVector(lado, -.3).addScaledVector(f, -1.2); jug.ry = ry; }
    cine = { centro: C.clone().setY(1.1), ang: Math.atan2(-f.x, -f.z) + .4, dist: 6, alto: 2.2, vel: -.04 };
    A.set('quieta');
    burbuja(A.bur, '¡Hay pastel, pizza y tu Pepsi bien fría! 🍕🥤', 2800, 2.9);
    await espera(2);
    ella.set('come', 3); burbuja(ella.bur, '¡Mmm, qué rico! 🤤', 2200);
    burbuja(B.g, '¡Yo quiero pastel! 🎂', 2200, 2);
    const ivH = setInterval(() => particulas('corazon', C.clone().setY(2.2), 2), 500);
    await espera(3);
    clearInterval(ivH);
    // los regalos
    burbuja(A.bur, '¡Ahora abre tus regalos! 🎁', 2400, 2.9);
    cine = { centro: regalos[1].position.clone().setY(.9), ang: Math.atan2(-lado.x, -lado.z) - .4, dist: 5, alto: 2, vel: .03 };
    await espera(1.8);
    const premios = [['¡300 monedas! 🪙', () => { E.monedas += 300; pintarMonedas(true); }], ['¡Un osito de peluche! 🧸', () => dar('peluche')], ['💌 ¡Una cartita!', null]];
    for (let k = 0; k < regalos.length; k++) {
      const r = regalos[k], tapa = r.userData.tapa;
      tween(.3, (q) => { r.scale.set(1 + Math.sin(q * Math.PI) * .15, 1 - Math.sin(q * Math.PI) * .1, 1 + Math.sin(q * Math.PI) * .15); });
      await espera(.3);
      sonar('pop');
      await tween(.6, (q) => { tapa.position.y = .55 + q * 1.4; tapa.rotation.z = q * 1.2; tapa.rotation.x = q * .6; });
      tapa.visible = false;
      particulas('chispa', r.position.clone().setY(1), 14); particulas('confeti', r.position.clone().setY(1.2), 20);
      if (r.userData.sobre) { r.userData.sobre.visible = true; tween(.8, (q) => { r.userData.sobre.position.y = .45 + q * 1.1; r.userData.sobre.rotation.y = q * 6.28; }); }
      flotante(r.position.clone().setY(1.6), premios[k][0]);
      if (ellaSoyYo && premios[k][1]) premios[k][1]();
      sonar('meta');
      await espera(1.6);
    }
    // la cartita
    await espera(.6);
    if (carta && carta.trim()) await mostrarCarta(carta.trim());
    // final
    cine = { centro: C.clone().addScaledVector(f, -1).setY(1.2), ang: Math.atan2(-f.x, -f.z) + .3, dist: 7, alto: 2.4, vel: -.06 };
    A.set('baila'); estB = 'baila'; ella.set('baila', 4);
    sonar('fanfarria'); particulas('confeti', C.clone().setY(4), 80); particulas('corazon', C.clone().setY(2.6), 16);
    burbuja(A.bur, '¡Feliz cumpleaños, mi princesa! Te amo 💞', 3200, 2.9);
    await espera(1.6);
    burbuja(B.g, '¡Te amo demasiado! 💞', 2600, 2);
    await espera(2.6);
    burbuja(ella.bur, '¡Gracias, mis amores! Los amo 🥹💞', 2800);
    await espera(3);
    // se acaba la fiesta
    $('fundido').classList.add('on'); await new Promise(r => setTimeout(r, 650));
    animados.splice(animados.indexOf(anGlobos), 1); animados.splice(animados.indexOf(anB), 1);
    scene.remove(fiesta, B.g);
    if (ella.an) { animados.splice(animados.indexOf(ella.an), 1); scene.remove(ella.g); }
    A.fin();
    if (rol === 'festeja' || rol === 'prueba') jug.pos.copy(C).addScaledVector(lado, 2);
    jug.accion = null;
    modoCine(false); saltando = false;
    $('fundido').classList.remove('on');
    if (ellaSoyYo) { stat('fiestas'); aviso('🎂 ¡Feliz cumpleaños, Brittybee! Te llegaron 300 monedas y un osito 🧸 a tu mochila', 4200); }
    guardar(true);
    fiestaCorriendo = false;
  }

  /* =========================================================
     ARRANQUE
     ========================================================= */
  document.addEventListener('pointerdown', () => asegurarAudio(), { passive: true });
  function asegurarAudio() { if (E.musica && musica.paused && !document.hidden) tocarMusica(); if (!actx) iniciarAudio(); if (actx && actx.state === 'suspended') actx.resume(); }
  tocarMusica();
  for (const o of E.colocados) if (o.dentro === -1) pintarColocado(o);
  for (const f of E.flores) pintarFlor(f);
  reconstruirInterColocados();
  pintarMonedas(); pintarMetaMini(); pintarBajar(); aplicarHora();
  camPos.copy(jug.pos).add(V3(0, 6, 12)); camMira.copy(jug.pos);
  cam.yaw = jug.ry + Math.PI;
  actualizarCamara(0, true);
  asegurarAudio();
  $('intro').style.transition = 'opacity .7s'; $('intro').style.opacity = 0;
  setTimeout(() => $('intro').remove(), 750);
  ['hud', 'reloj', 'metaMini', 'brincar', 'nubeEstado'].forEach(id => $(id).hidden = false);
  if (matchMedia('(pointer: coarse)').matches) $('joyPista').hidden = false;
  requestAnimationFrame(cuadro);
  // Tutorial de cómo empezar a jugar
  const TUTO = [
    ES_EL ? ['🍭', '¡Bienvenido a tu reino, Lalito!', 'Aquí vas a juntar dulces, construir tu casa (¡hasta un castillo!), cocinar, decorar y pasear. Así se juega 👇'] : ['🍭', '¡Bienvenida a tu reino, Brittybee!', 'Aquí vas a juntar dulces, construir tu casa (¡hasta un castillo!), cocinar, decorar y pasear. Te enseño cómo se juega 💞'],
    ['🕹️', 'Para caminar', 'Pon tu dedo en el <b>lado izquierdo</b> de la pantalla y deslízalo hacia donde quieras ir.'],
    ['👆', 'Para mirar alrededor', 'Desliza tu dedo en el <b>lado derecho</b> para girar la cámara. Con <b>dos dedos</b> te acercas o te alejas.'],
    ['✋', 'El botón rosa', 'Cuando estés junto a algo (un árbol de galletas, una tienda, tu terreno, la cocinita…) aparece un <b>botón rosa</b> abajo a la derecha. Tócalo para recoger, construir, cocinar o entrar.'],
    ['🎒', 'Tu mochila y tus metas', 'Arriba está tu <b>mochila 🎒</b> con todo lo que juntas y compras, y tus <b>metas 📜</b>. ' + T('Cada meta trae una notita mía 💌', 'Cada meta te da monedas de premio 🪙')],
    ['👉', '¡A jugar!', 'Sigue la <b>flecha rosa</b> en el piso y las instrucciones de abajo. Tu primera meta: juntar galletas en el Bosque de Galleta 🍪, para que te construya tu primera casita.'],
  ];
  function mostrarTutorial() {
    let i = 0; tutoAbierto = true; const el = $('tuto');
    const pinta = () => {
      const [ic, t, p] = TUTO[i];
      el.querySelector('.ic').textContent = ic; el.querySelector('h3').textContent = t; el.querySelector('p').innerHTML = p;
      el.querySelector('.puntos').innerHTML = TUTO.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('');
      $('tutoSig').textContent = i === TUTO.length - 1 ? '¡Empezar! 🍪' : 'Siguiente ➜';
      $('tutoSaltar').hidden = i === TUTO.length - 1;
      el.querySelector('.tarjeta').classList.remove('nueva'); void el.offsetWidth; el.querySelector('.tarjeta').classList.add('nueva');
    };
    const cerrar = () => { el.classList.remove('on'); tutoAbierto = false; E.tuto = true; guardar(); sonar('meta'); burbuja(jug.raiz, '¡Vamos por galletas! 🍪', 2400); };
    $('tutoSig').onclick = () => { asegurarAudio(); sonar('pop'); if (i < TUTO.length - 1) { i++; pinta(); } else cerrar(); };
    $('tutoSaltar').onclick = cerrar;
    pinta(); el.classList.add('on');
  }
  if (E.nuevo || !E.tuto) {
    E.nuevo = false; guardar();
    setTimeout(mostrarTutorial, 900);
  } else setTimeout(() => burbuja(jug.raiz, '¡Volví a mi reino! 💞', 2400), 900);
  document.addEventListener('visibilitychange', () => { if (document.hidden) guardar(true); });
  addEventListener('pagehide', () => guardar(true));
  // botón ⚙️
  $('bMenu').onclick = () => {
    abrirPanel({
      tit: '⚙️ Opciones', ligero: true,
      render: (c) => {
        fila(c, { ic: '🎵', tit: 'Música', sub: E.musica ? 'Encendida' : 'Apagada', botones: [[E.musica ? 'Apagar' : 'Encender', () => { $('bMusica').click(); repintar(); }, 'sec']] });
        fila(c, { ic: '🔔', tit: 'Efectos de sonido', sub: E.efectos ? 'Encendidos' : 'Apagados', botones: [[E.efectos ? 'Apagar' : 'Encender', () => { E.efectos = !E.efectos; if (sfxGain) sfxGain.gain.value = E.efectos ? .7 : 0; guardar(); repintar(); }, 'sec']] });
        fila(c, { ic: '🕹️', tit: 'Cómo se juega', sub: 'Ver otra vez el tutorial', botones: [['Ver', () => { cerrarPanel(); setTimeout(mostrarTutorial, 300); }, 'sec']] });
        fila(c, { ic: '👥', tit: 'Cambiar de perfil', sub: 'Estás jugando como ' + T('Brittybee 👑', 'Lalito 🔨'), botones: [['Cambiar', () => { guardar(true); setTimeout(() => location.reload(), 700); }, 'sec']] });
        fila(c, { ic: '☁️', tit: 'Guardado en la nube', sub: NUBE && NUBE.estado().conectados ? 'Tu avance se guarda solito en la nube y en este teléfono' : 'Sin conexión: se guarda en este teléfono y se sube cuando haya internet' });
        fila(c, { ic: '🏠', tit: 'Volver al menú', sub: 'Tu avance se guarda solito 💞', botones: [['Salir', () => { guardar(true); setTimeout(() => { location.href = '../'; }, 600); }, 'sec']] });
      },
    });
  };
  window.__reino = { get reloj() { return reloj; }, get saltando() { return saltando; }, get cine() { return cine; }, E, jug, scene, camera, cam, construir, TERRENOS, interactivos, dar, guardar, entrarCasa, salirCasa, colocar, plantar, panelBoutique, cocinar, RECETAS, subir, revisarMetas, mostrarNota, abrirMochila };
};
