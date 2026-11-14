/* El Reino de Dulce · modelos 3D hechos con figuras */
'use strict';

const PIEL = '#f6c9a8', PELO_ELLA = '#5a3322', PELO_EL = '#1b1820';

/* ---------- Materiales y geometrías compartidas ---------- */
const _mats = new Map();
function mat(color, o = {}) {
  const k = color + JSON.stringify(o);
  if (_mats.has(k)) return _mats.get(k);
  let m;
  if (o.brillo) m = new THREE.MeshPhongMaterial({ color, shininess: o.brillo, specular: o.spec || 0x555555, transparent: !!o.op, opacity: o.op || 1, emissive: o.em || 0x000000, side: o.doble ? THREE.DoubleSide : THREE.FrontSide });
  else m = new THREE.MeshLambertMaterial({ color, transparent: !!o.op, opacity: o.op || 1, emissive: o.em || 0x000000, side: o.doble ? THREE.DoubleSide : THREE.FrontSide, map: o.map || null });
  _mats.set(k, m);
  return m;
}
// Material que brilla de noche (ventanas, faroles)
const MATS_LUZ = [];
function matLuz(color, base = 0.25) {
  const m = new THREE.MeshLambertMaterial({ color, emissive: new THREE.Color(color), emissiveIntensity: base });
  m.userData.base = base; MATS_LUZ.push(m);
  return m;
}
const _geos = new Map();
function geo(tipo, ...a) {
  const k = tipo + a.join(',');
  if (_geos.has(k)) return _geos.get(k);
  let g;
  switch (tipo) {
    case 'esf': g = new THREE.SphereGeometry(a[0] ?? 1, a[1] ?? 18, a[2] ?? 12, a[3] ?? 0, a[4] ?? Math.PI * 2, a[5] ?? 0, a[6] ?? Math.PI); break;
    case 'caja': g = new THREE.BoxGeometry(a[0], a[1], a[2]); break;
    case 'cil': g = new THREE.CylinderGeometry(a[0], a[1], a[2], a[3] ?? 18, 1, !!a[4]); break;
    case 'cono': g = new THREE.ConeGeometry(a[0], a[1], a[2] ?? 18); break;
    case 'toro': g = new THREE.TorusGeometry(a[0], a[1], a[2] ?? 8, a[3] ?? 24, a[4] ?? Math.PI * 2); break;
    case 'ico': g = new THREE.IcosahedronGeometry(a[0], a[1] ?? 1); break;
    case 'dode': g = new THREE.DodecahedronGeometry(a[0], 0); break;
    case 'octa': g = new THREE.OctahedronGeometry(a[0], 0); break;
    case 'circ': g = new THREE.CircleGeometry(a[0], a[1] ?? 24); break;
    case 'plano': g = new THREE.PlaneGeometry(a[0], a[1]); break;
  }
  _geos.set(k, g);
  return g;
}
function malla(g, m, x = 0, y = 0, z = 0, padre, sombra = true) {
  const o = new THREE.Mesh(g, typeof m === 'string' ? mat(m) : m);
  o.position.set(x, y, z);
  if (sombra) { o.castShadow = true; o.receiveShadow = true; }
  if (padre) padre.add(o);
  return o;
}
function grupo(padre, x = 0, y = 0, z = 0) {
  const g = new THREE.Group(); g.position.set(x, y, z);
  if (padre) padre.add(g);
  return g;
}

/* ---------- Texturas pintadas en canvas ---------- */
function texCanvas(w, h, pinta, rep) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  pinta(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  t.anisotropy = 4;
  return t;
}
const _tex = {};
function texRayas(c1, c2, n = 6, diag = true) {
  const k = 'r' + c1 + c2 + n + diag;
  if (_tex[k]) return _tex[k];
  return _tex[k] = texCanvas(128, 128, (x, w, h) => {
    x.fillStyle = c1; x.fillRect(0, 0, w, h);
    x.fillStyle = c2;
    const paso = w / n;
    for (let i = -n; i < n * 2; i++) {
      x.beginPath();
      if (diag) { x.moveTo(i * paso, 0); x.lineTo(i * paso + paso / 2, 0); x.lineTo(i * paso + paso / 2 + w, h); x.lineTo(i * paso + w, h); }
      else { x.rect(0, i * paso, w, paso / 2); }
      x.fill();
    }
  }, [1, 1]);
}
function texEspiral(c1, c2) {
  const k = 'e' + c1 + c2;
  if (_tex[k]) return _tex[k];
  return _tex[k] = texCanvas(256, 256, (x, w) => {
    x.fillStyle = c1; x.beginPath(); x.arc(128, 128, 128, 0, 7); x.fill();
    x.strokeStyle = c2; x.lineWidth = 16; x.lineCap = 'round'; x.beginPath();
    for (let a = 0; a < 26; a += .1) { const r = a * 4.6; x.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r); }
    x.stroke();
  });
}
function texTexto(lineas, { w = 512, h = 160, fondo = '#fff6fa', borde = '#ff8fb8', color = '#7a3552', tam = 64, sub = 34 } = {}) {
  return texCanvas(w, h, (x) => {
    x.fillStyle = fondo; redondo(x, 6, 6, w - 12, h - 12, 34); x.fill();
    x.lineWidth = 10; x.strokeStyle = borde; x.stroke();
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = color;
    x.font = `800 ${tam}px Nunito, "Noto Color Emoji", system-ui, sans-serif`;
    if (lineas.length === 1) x.fillText(lineas[0], w / 2, h / 2 + 4);
    else { x.fillText(lineas[0], w / 2, h * .38); x.font = `700 ${sub}px Nunito, system-ui, sans-serif`; x.fillStyle = '#b25f86'; x.fillText(lineas[1], w / 2, h * .74); }
  });
}
function redondo(x, a, b, w, h, r) {
  x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath();
}
function texEmoji(e, tam = 128) {
  const k = 'em' + e;
  if (_tex[k]) return _tex[k];
  return _tex[k] = texCanvas(tam, tam, (x) => {
    x.font = `${tam * .8}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, tam / 2, tam / 2 + tam * .05);
  });
}
function texChispa() {
  if (_tex.chispa) return _tex.chispa;
  return _tex.chispa = texCanvas(64, 64, (x) => {
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,240,250,.9)'); g.addColorStop(1, 'rgba(255,220,240,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    x.fillStyle = '#fff'; x.beginPath();
    x.moveTo(32, 2); x.lineTo(35, 29); x.lineTo(62, 32); x.lineTo(35, 35); x.lineTo(32, 62); x.lineTo(29, 35); x.lineTo(2, 32); x.lineTo(29, 29); x.closePath(); x.fill();
  });
}
function texSuave() {
  if (_tex.suave) return _tex.suave;
  return _tex.suave = texCanvas(64, 64, (x) => {
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  });
}

/* ---------- Ayuda para poner cosas sobre la cabeza (esfera) ---------- */
function sobre(padre, centro, r, dir, obj) {
  const d = new THREE.Vector3(...dir).normalize();
  obj.position.copy(centro).addScaledVector(d, r);
  obj.lookAt(obj.position.clone().add(d));
  padre.add(obj);
  return obj;
}

/* =========================================================
   PERSONAJES (cabezota redonda, ojitos de punto, sonrisa)
   ========================================================= */
function cara(cab, c, { pestanas = false, rubor = '#ff9fb2' } = {}) {
  const ojoM = mat('#2b1f33');
  for (const s of [-1, 1]) {
    const ojo = malla(geo('esf', 1, 14, 10), ojoM, 0, 0, 0, null, false);
    ojo.scale.set(.068, .088, .04);
    sobre(cab, c, .485, [s * .34, -.02, .94], ojo);
    const brillo = malla(geo('esf', 1, 8, 6), '#ffffff', 0, 0, 0, null, false);
    brillo.scale.set(.026, .026, .02);
    sobre(cab, c, .5, [s * .34 + .06, .07, .94], brillo);
    const mej = new THREE.Mesh(geo('circ', 1, 18), mat(rubor, { op: .65 }));
    mej.scale.set(.085, .05, 1);
    sobre(cab, c, .495, [s * .58, -.3, .76], mej);
    if (pestanas) {
      const p = malla(geo('caja', 1, 1, 1), ojoM, 0, 0, 0, null, false);
      p.scale.set(.07, .016, .01);
      sobre(cab, c, .495, [s * .47, .1, .87], p);
      p.rotateZ(s * .5);
    }
    // orejitas
    malla(geo('esf', .09, 10, 8), PIEL, s * .49, c.y - .02, 0, cab).scale.set(.8, 1.1, .8);
  }
  const boca = new THREE.Mesh(geo('toro', .075, .018, 6, 16, Math.PI), mat('#c4505f'));
  sobre(cab, c, .49, [0, -.36, .93], boca);
  boca.rotateZ(Math.PI);
  const nariz = malla(geo('esf', .035, 8, 6), '#eaa98a', 0, 0, 0, null, false);
  sobre(cab, c, .5, [0, -.12, 1], nariz);
  return { boca };
}

function crearChica(ropa) {
  const g = new THREE.Group(), p = { g };
  const R = (cat) => ROPA[cat].find(r => r.id === ropa[cat]) || ROPA[cat][0];
  const top = R('top'), abajo = R('abajo'), zap = R('zapatos'), acc = R('acc'), peinado = ropa.peinado || 'suelto';
  const vestido = top.vestido;
  const zapM = zap.brillo ? mat(zap.c, { brillo: 120, op: .82, em: 0x335577 }) : mat(zap.c);
  const cuerpo = grupo(g); p.cuerpo = cuerpo;

  // Piernas (pivote en cadera)
  for (const s of [-1, 1]) {
    const pi = grupo(cuerpo, s * .13, .62, 0);
    const largo = abajo.largo && !vestido;
    malla(geo('cil', .1, .09, .5, 12), largo ? abajo.c : PIEL, 0, -.25, 0, pi);
    if (!vestido && !abajo.largo && !abajo.falda) malla(geo('cil', .125, .12, .2, 12), abajo.c, 0, -.08, 0, pi);
    const z = malla(geo('esf', 1, 14, 10), zapM, 0, -.53, .05, pi); z.scale.set(.12, .09, .19);
    p[s < 0 ? 'piernaI' : 'piernaD'] = pi;
  }
  // Torso
  const torso = malla(geo('cil', .25, .3, .5, 18), top.c, 0, .88, 0, cuerpo);
  p.torso = torso;
  if (top.id === 'sueterNav') {
    malla(geo('cil', .292, .302, .07, 18), '#ffffff', 0, .74, 0, cuerpo);
    for (let i = 0; i < 5; i++) { const a = -.6 + i * .3; malla(geo('esf', .03, 6, 5), '#ffffff', Math.sin(a) * .28, .92, Math.cos(a) * .26, cuerpo, false); }
  }
  if (top.id === 'sudaderaLila') malla(geo('toro', .2, .05, 6, 18, Math.PI), '#b292e8', 0, 1.08, -.06, cuerpo).rotation.x = -Math.PI / 2;
  // Parte de abajo / falda / vestido
  if (vestido === 'largo') {
    const fal = malla(geo('cil', .3, .8, .98, 28), top.c, 0, .52, 0, cuerpo); p.falda = fal;
    const orilla = malla(geo('toro', .79, .045, 6, 32), top.c2 || '#fff', 0, .05, 0, cuerpo); orilla.rotation.x = Math.PI / 2;
    malla(geo('toro', .3, .04, 6, 24), top.c2 || '#fff', 0, 1.02, 0, cuerpo).rotation.x = Math.PI / 2;
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; malla(geo('esf', .045, 6, 5), mat(top.c2 || '#fff', { brillo: 90 }), Math.sin(a) * .6, .32, Math.cos(a) * .6, cuerpo, false); }
  } else if (vestido === 'corto') {
    p.falda = malla(geo('cil', .3, .56, .42, 24), top.c, 0, .5, 0, cuerpo);
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; malla(geo('esf', .04, 6, 5), top.c2, Math.sin(a) * .47, .42 + (i % 2) * .1, Math.cos(a) * .47, cuerpo, false); }
  } else if (abajo.falda) {
    p.falda = malla(geo('cil', .29, .5, .34, 24), abajo.c, 0, .52, 0, cuerpo);
  } else {
    malla(geo('cil', .3, .3, .16, 18), abajo.c, 0, .64, 0, cuerpo);
  }
  // Brazos (pivote en hombro)
  const mangaLarga = top.id === 'sudaderaLila' || top.id === 'sueterNav';
  for (const s of [-1, 1]) {
    const br = grupo(cuerpo, s * .33, 1.06, 0);
    br.rotation.z = s * .14;
    if (mangaLarga) malla(geo('cil', .085, .075, .42, 10), top.c, 0, -.21, 0, br);
    else { malla(geo('cil', .1, .095, .16, 10), top.c, 0, -.07, 0, br); malla(geo('cil', .07, .065, .32, 10), PIEL, 0, -.27, 0, br); }
    malla(geo('esf', .085, 10, 8), PIEL, 0, -.46, 0, br);
    p[s < 0 ? 'brazoI' : 'brazoD'] = br;
  }
  // Cuello y cabeza
  malla(geo('cil', .08, .09, .12, 10), PIEL, 0, 1.15, 0, cuerpo);
  const cab = grupo(cuerpo, 0, 1.14, 0); p.cabeza = cab;
  const c = new THREE.Vector3(0, .46, 0);
  malla(geo('esf', .5, 28, 20), PIEL, 0, .46, 0, cab);
  Object.assign(p, cara(cab, c, { pestanas: true }));
  // Pelo
  const peloM = mat(PELO_ELLA);
  const casco = malla(geo('esf', .535, 28, 18, 0, Math.PI * 2, 0, Math.PI * .56), peloM, 0, .46, 0, cab);
  casco.rotation.x = -.5;
  for (let i = -2; i <= 2; i++) {
    const f = malla(geo('esf', 1, 12, 8), peloM, 0, 0, 0, null);
    f.scale.set(.16, .1, .09);
    sobre(cab, c, .47, [i * .2, .72, .62], f);
    f.rotateZ(i * .25);
  }
  for (const s of [-1, 1]) { const m = malla(geo('esf', 1, 12, 8), peloM, s * .43, .3, .1, cab); m.scale.set(.11, .28, .13); }
  if (peinado === 'suelto') {
    const at = malla(geo('cil', .44, .4, .78, 20), peloM, 0, .14, -.2, cab); at.scale.set(1, 1, .6);
    const pu = malla(geo('esf', 1, 16, 10), peloM, 0, -.24, -.2, cab); pu.scale.set(.4, .14, .25);
  } else if (peinado === 'coleta') {
    malla(geo('toro', .08, .03, 6, 12), '#ff6fa3', 0, .66, -.47, cab);
    const co = malla(geo('esf', 1, 14, 10), peloM, 0, .34, -.62, cab); co.scale.set(.15, .36, .15); co.rotation.x = .35;
  } else if (peinado === 'chongo') {
    malla(geo('esf', .21, 16, 12), peloM, 0, .98, -.14, cab);
    malla(geo('toro', .15, .03, 6, 14), '#ff6fa3', 0, .88, -.12, cab).rotation.x = Math.PI / 2 - .2;
  } else if (peinado === 'trenzas') {
    for (const s of [-1, 1]) {
      for (let i = 0; i < 5; i++) malla(geo('esf', .085 - i * .006, 10, 8), peloM, s * (.38 + i * .015), .12 - i * .14, -.1 + i * .02, cab);
      malla(geo('esf', .05, 8, 6), '#ff6fa3', s * .45, -.56, -.02, cab);
    }
  }
  // Accesorio
  if (acc.id === 'mono') {
    const m = grupo(cab, .3, .86, .12); m.rotation.z = -.4;
    for (const s of [-1, 1]) { const l = malla(geo('cono', .1, .2, 10), acc.c, s * .1, 0, 0, m); l.rotation.z = s * Math.PI / 2; }
    malla(geo('esf', .05, 8, 6), '#e24f8a', 0, 0, 0, m);
  } else if (acc.id === 'diadema') {
    const d = malla(geo('toro', .5, .03, 6, 26, Math.PI), '#ff8fb8', 0, .5, .05, cab); d.rotation.y = Math.PI / 2; d.rotation.x = -.25;
    const cols = ['#ffd1e6', '#fff3a3', '#cfe9ff', '#ffd1e6', '#e6d1ff'];
    for (let i = 0; i < 5; i++) { const a = .5 + i * .52; malla(geo('esf', .07, 8, 6), cols[i], Math.cos(a) * .5, .5 + Math.sin(a) * .5, .12 - Math.abs(Math.cos(a)) * .1, cab); }
  } else if (acc.id === 'gorroNav') {
    const gr = grupo(cab, 0, .82, -.05); gr.rotation.z = .25; gr.rotation.x = -.2;
    malla(geo('cono', .44, .62, 20), acc.c, 0, .26, 0, gr);
    malla(geo('toro', .43, .07, 8, 22), '#ffffff', 0, -.02, 0, gr).rotation.x = Math.PI / 2;
    malla(geo('esf', .09, 10, 8), '#ffffff', 0, .58, 0, gr);
  } else if (acc.id === 'sombrero') {
    const so = grupo(cab, 0, .86, -.02); so.rotation.x = -.15;
    malla(geo('cil', .82, .82, .04, 28), acc.c, 0, 0, 0, so);
    malla(geo('cil', .36, .42, .3, 20), acc.c, 0, .16, 0, so);
    malla(geo('cil', .425, .425, .08, 20), '#ff8fb8', 0, .06, 0, so);
  } else if (acc.id === 'corona') {
    const co = grupo(cab, 0, .93, -.04); co.rotation.x = -.15;
    const oro = mat('#ffd34d', { brillo: 100, spec: 0x996600 });
    malla(geo('cil', .23, .25, .14, 20, true), oro, 0, 0, 0, co);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; malla(geo('cono', .05, .14, 6), oro, Math.sin(a) * .23, .13, Math.cos(a) * .23, co); malla(geo('esf', .03, 6, 5), mat(i % 2 ? '#ff6fa3' : '#9ad7ff', { brillo: 120 }), Math.sin(a) * .245, 0, Math.cos(a) * .245, co, false); }
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return p;
}

function crearChico() {
  const g = new THREE.Group(), p = { g };
  const cuerpo = grupo(g); p.cuerpo = cuerpo;
  for (const s of [-1, 1]) {
    const pi = grupo(cuerpo, s * .14, .64, 0);
    malla(geo('cil', .11, .1, .52, 12), '#2f5d95', 0, -.26, 0, pi);
    const z = malla(geo('esf', 1, 14, 10), '#ffffff', 0, -.55, .05, pi); z.scale.set(.13, .1, .2);
    p[s < 0 ? 'piernaI' : 'piernaD'] = pi;
  }
  malla(geo('cil', .3, .3, .18, 16), '#2f5d95', 0, .66, 0, cuerpo);
  p.torso = malla(geo('cil', .29, .32, .52, 18), '#7fb8e6', 0, .92, 0, cuerpo);
  for (const s of [-1, 1]) {
    const br = grupo(cuerpo, s * .37, 1.12, 0); br.rotation.z = s * .12;
    malla(geo('cil', .11, .1, .17, 10), '#7fb8e6', 0, -.07, 0, br);
    malla(geo('cil', .075, .07, .34, 10), PIEL, 0, -.28, 0, br);
    malla(geo('esf', .09, 10, 8), PIEL, 0, -.48, 0, br);
    p[s < 0 ? 'brazoI' : 'brazoD'] = br;
  }
  malla(geo('cil', .09, .1, .12, 10), PIEL, 0, 1.22, 0, cuerpo);
  const cab = grupo(cuerpo, 0, 1.2, 0); p.cabeza = cab;
  const c = new THREE.Vector3(0, .46, 0);
  malla(geo('esf', .5, 28, 20), PIEL, 0, .46, 0, cab);
  Object.assign(p, cara(cab, c, {}));
  const peloM = mat(PELO_EL);
  const casco = malla(geo('esf', .53, 26, 16, 0, Math.PI * 2, 0, Math.PI * .5), peloM, 0, .47, 0, cab); casco.rotation.x = -.45;
  for (let i = -2; i <= 2; i++) { const f = malla(geo('cono', .1, .22, 6), peloM, 0, 0, 0, null); sobre(cab, c, .48, [i * .22, .8, .5], f); f.rotateX(Math.PI / 2 + .5); }
  for (const s of [-1, 1]) { const m = malla(geo('esf', 1, 10, 8), peloM, s * .45, .52, -.05, cab); m.scale.set(.1, .18, .2); }
  // Casco de construcción
  const cc = grupo(cab, 0, .82, -.02); cc.rotation.x = -.12; p.casco = cc;
  malla(geo('esf', .42, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#ffcf33', { brillo: 60 }), 0, -.08, 0, cc);
  malla(geo('cil', .5, .5, .04, 22), mat('#ffcf33', { brillo: 60 }), .0, -.08, .06, cc);
  malla(geo('caja', .08, .06, .7), '#f2b705', 0, .3, 0, cc);
  // Martillo en la mano derecha
  const mart = grupo(p.brazoD, 0, -.5, .06); mart.rotation.x = Math.PI / 2; p.martillo = mart;
  malla(geo('cil', .035, .035, .55, 8), '#a8693f', 0, .18, 0, mart);
  malla(geo('caja', .28, .12, .12), mat('#9aa0aa', { brillo: 80 }), 0, .45, 0, mart);
  g.scale.setScalar(1.06);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return p;
}

// Animación de personajes según el estado
function animarPersona(p, estado, t, k = 1) {
  const s = Math.sin(t), r = (o, x, y, z) => { if (!o) return; o.rotation.x = x; if (y !== undefined) o.rotation.y = y; if (z !== undefined) o.rotation.z = z; };
  const base = p.cuerpo; base.position.y = 0; base.rotation.set(0, 0, 0);
  if (p.cabeza) p.cabeza.rotation.set(0, 0, 0);
  const zI = .14, zD = -.14;
  switch (estado) {
    case 'camina': case 'patina': {
      const a = estado === 'patina' ? .45 : .7 * k;
      r(p.piernaI, s * a); r(p.piernaD, -s * a);
      r(p.brazoI, -s * a * .9, 0, -zI * -1); r(p.brazoD, s * a * .9, 0, zD);
      p.brazoI.rotation.z = .14; p.brazoD.rotation.z = -.14;
      base.position.y = Math.abs(Math.cos(t)) * .07;
      if (estado === 'patina') { base.rotation.z = s * .08; }
      break;
    }
    case 'sentada': case 'pedalea': case 'maneja': {
      const a = estado === 'pedalea' ? s * .5 : 0, b = estado === 'pedalea' ? -.75 : estado === 'maneja' ? -1.1 : -1.4;
      r(p.piernaI, b + a); r(p.piernaD, b - a);
      r(p.brazoI, -1.05, 0, .1); r(p.brazoD, -1.05, 0, -.1);
      if (estado === 'sentada') { r(p.brazoI, -.2, 0, .2); r(p.brazoD, -.2, 0, -.2); }
      break;
    }
    case 'recoge': {
      const f = (Math.sin(t * 1.6) + 1) / 2;
      base.rotation.x = .35 * f; base.position.y = -.1 * f;
      r(p.piernaI, -.3 * f); r(p.piernaD, -.3 * f);
      r(p.brazoI, -1.1 - .3 * f, 0, .2); r(p.brazoD, -1.1 - .3 * f, 0, -.2);
      break;
    }
    case 'riega': {
      r(p.piernaI, 0); r(p.piernaD, 0);
      r(p.brazoD, -1.25, 0, -.15); r(p.brazoI, -.2 + s * .05, 0, .2);
      base.rotation.x = .1;
      break;
    }
    case 'cocina': {
      r(p.piernaI, 0); r(p.piernaD, 0);
      r(p.brazoD, -1.1 + Math.sin(t * 2) * .2, Math.cos(t * 2) * .3, -.3);
      r(p.brazoI, -.6, 0, .25);
      if (p.cabeza) p.cabeza.rotation.x = .25;
      break;
    }
    case 'come': {
      r(p.piernaI, 0); r(p.piernaD, 0);
      const f = (Math.sin(t * 2) + 1) / 2;
      r(p.brazoD, -1.6 - f * .8, 0, -.5); r(p.brazoI, -.4, 0, .2);
      base.position.y = Math.abs(Math.sin(t)) * .04;
      break;
    }
    case 'martillo': {
      r(p.piernaI, .1); r(p.piernaD, -.1);
      const f = Math.max(0, Math.sin(t * 2.4));
      r(p.brazoD, -2.4 + f * 1.6, 0, -.2); r(p.brazoI, -.5, 0, .3);
      base.rotation.x = .08 + f * .06;
      break;
    }
    case 'saluda': {
      r(p.piernaI, 0); r(p.piernaD, 0);
      r(p.brazoD, 0, 0, -2.5 + Math.sin(t * 3) * .3); r(p.brazoI, 0, 0, .14);
      base.position.y = Math.abs(Math.sin(t * 1.5)) * .05;
      break;
    }
    case 'baila': {
      r(p.piernaI, Math.max(0, s) * .4); r(p.piernaD, Math.max(0, -s) * .4);
      r(p.brazoI, 0, 0, 2.2 + s * .3); r(p.brazoD, 0, 0, -2.2 + s * .3);
      base.rotation.y = Math.sin(t * .5) * .5; base.position.y = Math.abs(s) * .12;
      break;
    }
    case 'abraza': {
      r(p.piernaI, 0); r(p.piernaD, 0);
      r(p.brazoI, -1.2, 0, -.5); r(p.brazoD, -1.2, 0, .5);
      base.rotation.z = Math.sin(t * 2) * .08;
      break;
    }
    default: { // quieta, respirando
      r(p.piernaI, 0); r(p.piernaD, 0);
      p.brazoI.rotation.set(0, 0, .14 + Math.sin(t * .8) * .03);
      p.brazoD.rotation.set(0, 0, -.14 - Math.sin(t * .8) * .03);
      base.position.y = Math.sin(t * 1.6) * .015;
      if (p.cabeza) p.cabeza.rotation.z = Math.sin(t * .5) * .05;
    }
  }
}

/* =========================================================
   CASAS (cada pieza se arma una por una en la animación)
   ========================================================= */
function crearCasa(id) {
  const g = new THREE.Group(), piezas = [];
  const P = (o) => { g.add(o); piezas.push(o); return o; };
  const ventana = (padre, x, y, z, ry = 0, w = .8, h = .9, marco = '#ffffff') => {
    const v = grupo(padre, x, y, z); v.rotation.y = ry;
    malla(geo('caja', w + .2, h + .2, .1), marco, 0, 0, 0, v);
    malla(geo('caja', w, h, .12), matLuz('#ffe9a8', .2), 0, 0, .01, v, false);
    malla(geo('caja', w, .06, .14), marco, 0, 0, .02, v, false);
    malla(geo('caja', .06, h, .14), marco, 0, 0, .02, v, false);
    return v;
  };
  const puerta = (padre, z, color = '#5b3420', w = 1, h = 1.7) => {
    const d = grupo(padre, 0, 0, z);
    malla(geo('caja', w, h, .14), color, 0, h / 2, 0, d);
    malla(geo('cil', w / 2, w / 2, .14, 16, false), color, 0, h, 0, d).rotation.x = Math.PI / 2;
    malla(geo('esf', .07, 8, 6), mat('#ffd34d', { brillo: 100 }), w * .3, h * .5, .1, d);
    return d;
  };
  const base = (w, d, c = '#fff1f6') => P(malla(geo('caja', w, .3, d), c, 0, .15, 0));
  const gotas = (padre, w, d, y, c = '#ffffff', paso = .5) => {
    const gg = grupo(padre, 0, y, 0);
    for (let x = -w / 2; x <= w / 2 + .01; x += paso) for (const zz of [-d / 2, d / 2]) { const e = malla(geo('esf', .16, 8, 6), c, x, -Math.random() * .12, zz, gg); e.scale.y = 1.4 + Math.random(); }
    for (let z = -d / 2 + paso; z < d / 2; z += paso) for (const xx of [-w / 2, w / 2]) { const e = malla(geo('esf', .16, 8, 6), c, xx, -Math.random() * .12, z, gg); e.scale.y = 1.4 + Math.random(); }
    return gg;
  };
  const techoDosAguas = (w, d, y, c, alto = 1.6, grosor = .22) => {
    const t = grupo(null, 0, y, 0);
    const largo = Math.hypot(w / 2 + .5, alto);
    const ang = Math.atan2(alto, w / 2 + .5);
    for (const s of [-1, 1]) {
      const l = malla(geo('caja', largo, grosor, d + .8), c, s * (w / 4 + .25), alto / 2, 0, t);
      l.rotation.z = -s * ang;
    }
    // frontón
    const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(0, alto - .1); sh.closePath();
    const fg = new THREE.ShapeGeometry(sh);
    for (const s of [-1, 1]) { const f = new THREE.Mesh(fg, mat('#ffffff', { doble: true })); f.position.z = s * d / 2; t.add(f); }
    return t;
  };
  const baston = (padre, x, z, h = 2.4) => {
    const b = grupo(padre, x, 0, z);
    malla(geo('cil', .12, .12, h, 12), new THREE.MeshLambertMaterial({ map: texRayas('#ffffff', '#ff4d6d', 5) }), 0, h / 2, 0, b);
    const gancho = malla(geo('toro', .25, .12, 8, 16, Math.PI), new THREE.MeshLambertMaterial({ map: texRayas('#ffffff', '#ff4d6d', 5) }), .25, h, 0, b);
    return b;
  };
  const gomitaM = ['#ff6b9a', '#ffd23f', '#7bd389', '#9b7bff', '#ff9f43'];

  if (id === 'galleta') {
    base(5.4, 5.4);
    const muros = P(grupo(null)); malla(geo('caja', 4, 2.6, 4), '#b8733e', 0, 1.6, 0, muros);
    for (const x of [-2, 2]) for (const z of [-2, 2]) malla(geo('cil', .09, .09, 2.6, 8), '#ffffff', x, 1.6, z, muros);
    const ad = P(grupo(null));
    puerta(ad, 2.02, '#5b3420');
    ventana(ad, -1.2, 1.9, 2.03); ventana(ad, 1.2, 1.9, 2.03);
    ventana(ad, 2.03, 1.8, 0, Math.PI / 2); ventana(ad, -2.03, 1.8, 0, -Math.PI / 2);
    P(gotas(null, 4, 4, 2.9));
    const te = P(techoDosAguas(4, 4, 2.9, '#ffffff', 1.7));
    for (let i = 0; i < 7; i++) for (const s of [-1, 1]) malla(geo('esf', .12, 8, 6), gomitaM[i % 5], s * (.3 + i * .3), .3 + (1.4 - i * .2), -1.6 + (i % 3) * 1.3, te);
    const ch = P(grupo(null)); malla(geo('caja', .6, 1.2, .6), '#ff8fb8', 1.2, 4, -.8, ch); malla(geo('caja', .75, .2, .75), '#ffffff', 1.2, 4.6, -.8, ch);
    const ex = P(grupo(null)); baston(ex, -.9, 2.6, 2); baston(ex, .9, 2.6, 2);
    for (let i = 0; i < 6; i++) malla(geo('esf', .22, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(gomitaM[i % 5], { brillo: 60 }), -2.4 + i * .95, .3, 2.55, ex);
  } else if (id === 'caramelo') {
    base(6, 5.6, '#ffe3ef');
    const pis = P(grupo(null)); malla(geo('caja', 5.2, .2, 4.8), '#ffd1e4', 0, .4, 0, pis);
    const mu = P(grupo(null)); malla(geo('caja', 4.4, 2.6, 4), mat('#f4a259', { brillo: 60, spec: 0x664422 }), 0, 1.8, -.2, mu);
    const ad = P(grupo(null));
    puerta(ad, 1.83, '#c4503b');
    ventana(ad, -1.3, 2, 1.84, 0, .8, .9, '#ffd1e4'); ventana(ad, 1.3, 2, 1.84, 0, .8, .9, '#ffd1e4');
    ventana(ad, 2.23, 2, -.2, Math.PI / 2, .9, .9, '#ffd1e4');
    const co = P(grupo(null)); for (const x of [-2.4, 2.4]) for (const z of [2.2, -2.4]) { const b = grupo(co, x, .4, z); malla(geo('cil', .2, .2, 2.8, 14), new THREE.MeshLambertMaterial({ map: texRayas('#ffffff', '#ff4d6d', 4) }), 0, 1.4, 0, b); }
    const te = P(grupo(null, 0, 3.2, 0)); const pir = malla(geo('cono', 4.1, 2.2, 4), mat('#ff7eb6', { brillo: 40 }), 0, 1.1, 0, te); pir.rotation.y = Math.PI / 4; pir.scale.z = .9;
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; malla(geo('esf', .22, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(gomitaM[i % 5], { brillo: 70 }), Math.sin(a) * 1.6, .55 + (i % 2) * .4, Math.cos(a) * 1.4, te); }
    malla(geo('esf', .35, 12, 10), mat('#ff3b6b', { brillo: 90 }), 0, 2.25, 0, te);
    const ex = P(grupo(null)); for (let i = 0; i < 4; i++) { const pa = grupo(ex, -2.6 + i * 1.7 + (i > 1 ? .8 : 0) - (i < 2 ? .8 : 0), 0, 3.3); malla(geo('cil', .05, .05, 1, 6), '#ffffff', 0, .5, 0, pa); const d = malla(geo('cil', .35, .35, .1, 20), new THREE.MeshLambertMaterial({ map: texEspiral(['#ff6b9a', '#9b7bff', '#ffd23f', '#7bd389'][i], '#ffffff') }), 0, 1.15, 0, pa); d.rotation.x = Math.PI / 2; }
  } else if (id === 'chocolate') {
    base(6.6, 6, '#ffe8d6');
    const p1 = P(grupo(null)); malla(geo('caja', 5, 2.4, 4.6), mat('#6b3e26', { brillo: 30, spec: 0x332211 }), 0, 1.5, 0, p1);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) malla(geo('caja', 1.1, .9, .06), '#7d4a2f', -1.8 + i * 1.2, 1 + j * 1.05, 2.32, p1).visible = !(i === 1 || i === 2) || j === 1;
    const ad1 = P(grupo(null)); puerta(ad1, 2.33, '#f6d6b8', 1.1, 1.75); ventana(ad1, -1.8, 1.9, 2.34, 0, .9, .9, '#f6d6b8'); ventana(ad1, 1.8, 1.9, 2.34, 0, .9, .9, '#f6d6b8');
    P(gotas(null, 5, 4.6, 2.75, '#fff3e6'));
    const p2 = P(grupo(null)); malla(geo('caja', 4.4, 2.1, 4), mat('#8b5a3c', { brillo: 30, spec: 0x332211 }), 0, 3.75, -.2, p2);
    const ad2 = P(grupo(null)); ventana(ad2, -1.2, 3.8, 1.82, 0, .9, 1, '#f6d6b8'); ventana(ad2, 1.2, 3.8, 1.82, 0, .9, 1, '#f6d6b8'); ventana(ad2, 2.22, 3.8, -.2, Math.PI / 2, .9, 1, '#f6d6b8');
    const bal = P(grupo(null)); malla(geo('caja', 4.6, .18, 1), '#f6d6b8', 0, 2.85, 2.25, bal);
    for (let i = 0; i < 12; i++) malla(geo('cil', .05, .05, .6, 6), '#ffffff', -2.2 + i * .4, 3.2, 2.7, bal);
    malla(geo('caja', 4.6, .08, .1), '#ff8fb8', 0, 3.52, 2.7, bal);
    P(gotas(null, 4.4, 4, 4.82, '#fff3e6'));
    P(techoDosAguas(4.4, 4, 4.85, '#ff9cc2', 1.8));
    const ch = P(grupo(null)); malla(geo('caja', .7, 1.6, .7), '#6b3e26', -1.3, 6.2, -1.2, ch); malla(geo('caja', .85, .2, .85), '#fff3e6', -1.3, 7, -1.2, ch);
  } else if (id === 'pastel') {
    base(7.4, 7.4, '#fff1f6');
    const pisos = [[3.3, 2.2, '#ffd6e4'], [2.65, 2, '#fff4e0'], [2, 1.8, '#ffd6e4']];
    let y = .3;
    pisos.forEach(([r, h, c], i) => {
      const t = P(grupo(null)); malla(geo('cil', r, r, h, 40), c, 0, y + h / 2, 0, t);
      const crema = grupo(t, 0, y + h, 0);
      malla(geo('toro', r - .05, .17, 8, 40), '#ffffff', 0, 0, 0, crema).rotation.x = Math.PI / 2;
      for (let k = 0; k < 18 + i * -3; k++) { const a = k / (18 - i * 3) * Math.PI * 2; const e = malla(geo('esf', .15, 8, 6), '#ffffff', Math.sin(a) * r, -.15 - Math.random() * .2, Math.cos(a) * r, crema); e.scale.y = 1.6 + Math.random(); }
      const nV = 6 - i;
      for (let k = 0; k < nV; k++) { const a = (k + .5) / nV * Math.PI * 2; if (i === 0 && Math.abs(Math.sin(a / 2)) < .2) continue; ventana(t, Math.sin(a) * (r + .02), y + h / 2 + .1, Math.cos(a) * (r + .02), a, .6, .75, '#ffffff'); }
      if (i === 0) puerta(t, r + .02, '#ff7fb0', 1.1, 1.6).position.y = y;
      y += h;
    });
    const top = P(grupo(null, 0, y, 0));
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; const f = grupo(top, Math.sin(a) * 1.4, .15, Math.cos(a) * 1.4); malla(geo('esf', .28, 12, 10), mat('#ff3b5c', { brillo: 80 }), 0, .2, 0, f).scale.y = 1.15; malla(geo('cono', .15, .18, 5), '#4caf50', 0, .5, 0, f).rotation.x = Math.PI; }
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + .3; const v = grupo(top, Math.sin(a) * .7, 0, Math.cos(a) * .7); malla(geo('cil', .07, .07, .8, 8), new THREE.MeshLambertMaterial({ map: texRayas('#ffffff', '#7fc8ff', 3) }), 0, .4, 0, v); malla(geo('esf', .09, 8, 6), matLuz('#ffb347', .9), 0, .9, 0, v, false).scale.y = 1.6; }
    malla(geo('esf', .5, 14, 10), mat('#ff3b5c', { brillo: 90 }), 0, .45, 0, top);
  } else if (id === 'castillo') {
    base(9.6, 8.6, '#fff1f6');
    const rosa = mat('#ffd9e8'), rosa2 = mat('#ffc0d9'), lila = mat('#c9a7ff', { brillo: 40 }), oro = mat('#ffd34d', { brillo: 100, spec: 0x997700 });
    const keep = P(grupo(null)); malla(geo('caja', 6.4, 4.2, 4.6), rosa, 0, 2.4, -.6, keep);
    const alm = P(grupo(null)); for (let i = 0; i < 11; i++) malla(geo('caja', .4, .45, .4), rosa2, -3 + i * .6, 4.7, 1.55, alm); for (let i = 0; i < 8; i++) for (const s of [-1, 1]) malla(geo('caja', .4, .45, .4), rosa2, s * 3, 4.7, -2.7 + i * .6, alm);
    const portal = P(grupo(null));
    const pu = grupo(portal, 0, .3, 1.68);
    malla(geo('caja', 1.8, 2.2, .16), oro, 0, 1.1, 0, pu); malla(geo('cil', .9, .9, .16, 20), oro, 0, 2.2, 0, pu).rotation.x = Math.PI / 2;
    for (let i = 0; i < 5; i++) malla(geo('caja', .06, 2.8, .2), '#e2b52c', -.7 + i * .35, 1.3, .02, pu);
    ventana(portal, -2, 3, 1.7, 0, .7, 1.1, '#ffffff'); ventana(portal, 2, 3, 1.7, 0, .7, 1.1, '#ffffff'); ventana(portal, -2, 1.5, 1.7, 0, .7, .9, '#ffffff'); ventana(portal, 2, 1.5, 1.7, 0, .7, .9, '#ffffff');
    const torres = [[-3.6, 2.1], [3.6, 2.1], [-3.6, -3.2], [3.6, -3.2]];
    torres.forEach(([x, z], i) => {
      const t = P(grupo(null, x, 0, z));
      malla(geo('cil', 1, 1.05, 5.6, 24), i % 2 ? rosa2 : rosa, 0, 3.1, 0, t);
      for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; malla(geo('caja', .32, .4, .3), rosa, Math.sin(a) * 1.05, 6, Math.cos(a) * 1.05, t).rotation.y = a; }
      malla(geo('cono', 1.3, 2.3, 24), lila, 0, 7.35, 0, t);
      malla(geo('cil', .03, .03, 1.2, 6), '#ffffff', 0, 8.9, 0, t);
      const b = new THREE.Mesh(geo('plano', .8, .45), mat(i % 2 ? '#ff6fa3' : '#ffd34d', { doble: true })); b.position.set(.4, 9.25, 0); t.add(b); b.userData.bandera = true;
      ventana(t, 0, 4, 1.02, 0, .5, .8, '#ffffff');
    });
    const central = P(grupo(null, 0, 0, -1.2));
    malla(geo('cil', 1.5, 1.6, 8.2, 28), rosa, 0, 4.4, 0, central);
    malla(geo('toro', 1.55, .1, 8, 30), '#ffffff', 0, 6, 0, central).rotation.x = Math.PI / 2;
    ventana(central, 0, 6.8, 1.52, 0, .7, 1.1, '#ffffff');
    const tc = P(grupo(null, 0, 8.5, -1.2)); malla(geo('cono', 1.9, 3.4, 28), mat('#ff8fc4', { brillo: 40 }), 0, 1.7, 0, tc); malla(geo('esf', .3, 12, 10), oro, 0, 3.5, 0, tc);
    const bc = new THREE.Mesh(geo('plano', 1.2, .6), mat('#ff6fa3', { doble: true })); bc.position.set(.6, 4.6, 0); bc.userData.bandera = true; tc.add(bc); malla(geo('cil', .035, .035, 1.6, 6), '#ffffff', 0, 4.4, 0, tc);
    const jar = P(grupo(null)); baston(jar, -1.3, 3.2, 2.2); baston(jar, 1.3, 3.2, 2.2);
    for (let i = 0; i < 8; i++) malla(geo('esf', .25, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(gomitaM[i % 5], { brillo: 70 }), -4.4 + i * 1.25, .3, 3.9, jar);
  }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { g, piezas };
}

/* =========================================================
   MUEBLES Y DECORACIÓN
   ========================================================= */
function texCuadro() {
  if (_tex.cuadro) return _tex.cuadro;
  return _tex.cuadro = texCanvas(256, 200, (x) => {
    const g = x.createLinearGradient(0, 0, 0, 200); g.addColorStop(0, '#ffe3ef'); g.addColorStop(1, '#fff7d6');
    x.fillStyle = g; x.fillRect(0, 0, 256, 200);
    const cabeza = (cx, pelo, larga) => {
      if (larga) { x.fillStyle = pelo; x.fillRect(cx - 42, 92, 84, 70); }
      x.fillStyle = '#f6c9a8'; x.beginPath(); x.arc(cx, 100, 40, 0, 7); x.fill();
      x.fillStyle = pelo; x.beginPath(); x.arc(cx, 92, 42, Math.PI, 0); x.fill();
      x.fillStyle = '#2b1f33'; x.beginPath(); x.arc(cx - 13, 104, 4.5, 0, 7); x.arc(cx + 13, 104, 4.5, 0, 7); x.fill();
      x.fillStyle = 'rgba(255,140,170,.6)'; x.beginPath(); x.ellipse(cx - 23, 116, 7, 4, 0, 0, 7); x.ellipse(cx + 23, 116, 7, 4, 0, 0, 7); x.fill();
      x.strokeStyle = '#c4505f'; x.lineWidth = 3; x.beginPath(); x.arc(cx, 116, 8, .2, Math.PI - .2); x.stroke();
    };
    cabeza(82, '#1b1820'); cabeza(174, '#5a3322', true);
    x.font = '34px "Noto Color Emoji", sans-serif'; x.textAlign = 'center'; x.fillText('💞', 128, 70);
  });
}

function crearObjeto(id, extra = {}) {
  const g = new THREE.Group();
  const madera = '#f2c6a0', rosa = '#ffb3cf', lila = '#cdb4ff', blanco = '#ffffff';
  switch (id) {
    case 'cama': {
      malla(geo('caja', 1.9, .5, 2.7), madera, 0, .25, 0, g);
      malla(geo('caja', 1.8, .26, 2.6), blanco, 0, .63, 0, g);
      malla(geo('caja', 1.85, .1, 1.7), rosa, 0, .8, .45, g);
      for (const x of [-.45, .45]) malla(geo('caja', .7, .18, .45), '#fff4f8', x, .86, -1, g);
      malla(geo('caja', 1.9, 1.1, .14), madera, 0, .95, -1.35, g);
      for (const x of [-.9, .9]) for (const z of [-1.3, 1.3]) malla(geo('cil', .05, .05, 2.4, 8), madera, x, 1.2, z, g);
      malla(geo('caja', 1.95, .06, 2.75), mat('#ffd1e4', { op: .6 }), 0, 2.4, 0, g);
      break;
    }
    case 'sofa': {
      malla(geo('caja', 2.4, .45, 1), lila, 0, .35, 0, g);
      malla(geo('caja', 2.4, .8, .3), lila, 0, .8, -.4, g);
      for (const s of [-1, 1]) malla(geo('caja', .3, .7, 1), '#b89cf5', s * 1.2, .5, 0, g);
      for (const s of [-1, 1]) { const c = malla(geo('caja', .5, .45, .14), rosa, s * .6, .85, -.18, g); c.rotation.x = -.2; }
      break;
    }
    case 'mesa': {
      malla(geo('cil', .8, .8, .08, 24), madera, 0, .85, 0, g); malla(geo('cil', .08, .14, .85, 10), madera, 0, .42, 0, g);
      malla(geo('cil', .15, .15, .05, 12), '#ffffff', 0, .92, 0, g);
      for (const s of [-1, 1]) { const si = grupo(g, s * 1.2, 0, 0); si.rotation.y = s * Math.PI / 2; malla(geo('caja', .55, .08, .55), rosa, 0, .5, 0, si); malla(geo('caja', .55, .6, .08), rosa, 0, .8, -.26, si); for (const a of [-.22, .22]) for (const b of [-.22, .22]) malla(geo('cil', .03, .03, .5, 6), madera, a, .25, b, si); }
      break;
    }
    case 'lampara': {
      malla(geo('cil', .3, .35, .08, 16), '#ffffff', 0, .04, 0, g); malla(geo('cil', .04, .04, 1.8, 8), '#ffffff', 0, .9, 0, g);
      malla(geo('cil', .3, .5, .55, 20, true), mat('#ffd1e4', { doble: true }), 0, 1.9, 0, g);
      malla(geo('esf', .14, 10, 8), matLuz('#fff2b3', .8), 0, 1.8, 0, g, false);
      break;
    }
    case 'alfombra': {
      malla(geo('cil', 1.5, 1.5, .03, 32), rosa, 0, .02, 0, g, false).receiveShadow = true;
      malla(geo('toro', 1.2, .05, 6, 32), '#ffffff', 0, .04, 0, g, false).rotation.x = Math.PI / 2;
      malla(geo('toro', .7, .05, 6, 32), lila, 0, .04, 0, g, false).rotation.x = Math.PI / 2;
      break;
    }
    case 'librero': {
      malla(geo('caja', 1.6, 2.2, .5), madera, 0, 1.1, 0, g);
      const cols = ['#ff8fb8', '#9ad7ff', '#ffd23f', '#b89cf5', '#7bd389', '#ff9f43'];
      for (let r = 0; r < 3; r++) { malla(geo('caja', 1.45, .05, .45), '#e7b48a', 0, .45 + r * .65, .04, g); for (let i = 0; i < 7; i++) { const h = .4 + Math.random() * .15; malla(geo('caja', .14, h, .34), cols[(i + r) % 6], -.6 + i * .19, .48 + r * .65 + h / 2, .05, g); } }
      break;
    }
    case 'tele': {
      malla(geo('caja', 1.8, .5, .6), madera, 0, .25, 0, g);
      malla(geo('caja', 1.6, 1, .1), '#2b2b3a', 0, 1.1, 0, g);
      malla(geo('caja', 1.45, .85, .02), matLuz('#8fd3ff', .6), 0, 1.1, .06, g, false);
      malla(geo('cil', .05, .05, .2, 6), '#2b2b3a', 0, .58, 0, g);
      break;
    }
    case 'tocador': {
      malla(geo('caja', 1.3, .75, .55), blanco, 0, .38, 0, g);
      malla(geo('caja', .5, .06, .4), rosa, -.35, .78, 0, g);
      const esp = malla(geo('cil', .45, .45, .06, 24), '#ffd34d', 0, 1.5, -.2, g); esp.rotation.x = Math.PI / 2; esp.scale.z = 1;
      const vid = malla(geo('cil', .4, .4, .07, 24), mat('#cfeaff', { brillo: 140, spec: 0xffffff }), 0, 1.5, -.18, g); vid.rotation.x = Math.PI / 2;
      malla(geo('cil', .25, .25, .4, 16), rosa, 0, .2, .7, g);
      for (let i = 0; i < 3; i++) malla(geo('cil', .05, .05, .2, 8), ['#ff6fa3', '#b89cf5', '#ffd23f'][i], .25 + i * .14, .86, .05, g);
      break;
    }
    case 'cuadro': {
      malla(geo('cil', .04, .04, 1.4, 6), madera, -.35, .7, -.25, g).rotation.x = .2;
      malla(geo('cil', .04, .04, 1.4, 6), madera, .35, .7, -.25, g).rotation.x = .2;
      malla(geo('cil', .04, .04, 1.4, 6), madera, 0, .7, -.6, g).rotation.x = -.35;
      const marco = grupo(g, 0, 1.3, -.1); marco.rotation.x = -.2;
      malla(geo('caja', 1.25, 1, .08), '#ffd34d', 0, 0, 0, marco);
      const lienzo = new THREE.Mesh(geo('plano', 1.08, .84), new THREE.MeshLambertMaterial({ map: texCuadro() })); lienzo.position.z = .05; marco.add(lienzo);
      break;
    }
    case 'maceta': {
      malla(geo('cil', .35, .25, .5, 16), '#ff9f80', 0, .25, 0, g);
      for (let i = 0; i < 6; i++) { const a = i; malla(geo('esf', .25, 10, 8), '#5fbf6f', Math.sin(a) * .2, .7 + (i % 3) * .2, Math.cos(a) * .2, g); }
      for (let i = 0; i < 4; i++) malla(geo('esf', .07, 6, 5), '#ff8fb8', Math.sin(i * 1.7) * .3, .9 + (i % 2) * .25, Math.cos(i * 1.7) * .3, g);
      break;
    }
    case 'piano': {
      malla(geo('caja', 1.8, 1.3, .7), mat('#1f1f27', { brillo: 120 }), 0, .95, -.1, g);
      malla(geo('caja', 1.7, .08, .35), '#ffffff', 0, .85, .38, g);
      for (let i = 0; i < 12; i++) malla(geo('caja', .06, .06, .2), '#1f1f27', -.75 + i * .14, .9, .32, g);
      for (const x of [-.8, .8]) malla(geo('caja', .1, .3, .1), '#1f1f27', x, .15, .2, g);
      malla(geo('caja', .9, .5, .4), '#1f1f27', 0, .25, 1, g); malla(geo('caja', .9, .08, .4), rosa, 0, .52, 1, g);
      break;
    }
    case 'peluche': {
      const c = '#c08a5c';
      malla(geo('esf', .45, 16, 12), c, 0, .45, 0, g).scale.y = 1.05;
      malla(geo('esf', .36, 16, 12), c, 0, 1.1, 0, g);
      for (const s of [-1, 1]) { malla(geo('esf', .13, 10, 8), c, s * .27, 1.38, 0, g); malla(geo('esf', .16, 10, 8), c, s * .4, .6, .15, g); malla(geo('esf', .17, 10, 8), c, s * .25, .12, .3, g); malla(geo('esf', .04, 6, 5), '#2b1f33', s * .12, 1.15, .32, g, false); }
      malla(geo('esf', .14, 10, 8), '#e8c4a0', 0, 1.02, .3, g); malla(geo('esf', .045, 6, 5), '#2b1f33', 0, 1.07, .43, g, false);
      for (const s of [-1, 1]) { const l = malla(geo('cono', .12, .22, 8), '#ff6fa3', s * .1, .82, .3, g); l.rotation.z = s * Math.PI / 2; }
      break;
    }
    case 'arbolnav': {
      malla(geo('cil', .2, .25, .6, 10), '#8a5a3c', 0, .3, 0, g);
      malla(geo('cil', .5, .6, .4, 14), '#d7263d', 0, .2, 0, g);
      [[1.3, 1.6, 1.2], [1.05, 1.4, 2.1], [.75, 1.2, 2.9]].forEach(([r, h, y]) => malla(geo('cono', r, h, 18), '#2f9e5a', 0, y, 0, g));
      const ad = grupo(g); ad.userData.adornos = true;
      g.userData.decorar = (a = {}) => {
        while (ad.children.length) ad.remove(ad.children[0]);
        const cols = ['#ff3b5c', '#ffd34d', '#ff8fc4', '#ffffff', '#b89cf5', '#6fd3ff'];
        const n = Math.min(a.esferas || 0, 30);
        for (let i = 0; i < n; i++) { const t = (i + .5) / 30, y = .9 + t * 2.4, r = (1 - t) * 1.25 + .1, an = i * 2.4; malla(geo('esf', .11, 10, 8), mat(cols[i % 6], { brillo: 120 }), Math.sin(an) * r, y, Math.cos(an) * r, ad); }
        if (a.luces) { for (let i = 0; i < 40; i++) { const t = i / 40, y = .8 + t * 2.6, r = (1 - t) * 1.3 + .12, an = i * .9; const l = malla(geo('esf', .045, 6, 5), matLuz(['#fff2b3', '#ffb3d1', '#b3e5ff'][i % 3], 1), Math.sin(an) * r, y, Math.cos(an) * r, ad, false); l.userData.titila = i; } }
        if (a.estrella) { const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? .14 : .32, an = i / 10 * Math.PI * 2 + Math.PI / 2; const fn = i ? 'lineTo' : 'moveTo'; sh[fn](Math.cos(an) * rr, Math.sin(an) * rr); } const es = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: .08, bevelEnabled: false }), matLuz('#ffd34d', .9)); es.position.set(0, 3.75, -.04); ad.add(es); es.userData.gira = true; }
      };
      g.userData.decorar(extra.adornos);
      break;
    }
    case 'regalos': {
      [[0, 0, .6, '#ff6fa3', '#ffd34d'], [.7, .1, .45, '#9ad7ff', '#ffffff'], [-.55, .25, .4, '#b89cf5', '#ff6fa3']].forEach(([x, z, s, c, l]) => { malla(geo('caja', s, s, s), c, x, s / 2, z, g); malla(geo('caja', s + .02, s + .02, .08), l, x, s / 2, z, g); malla(geo('caja', .08, s + .02, s + .02), l, x, s / 2, z, g); const m = malla(geo('toro', .08, .03, 6, 12), l, x, s + .05, z, g); m.rotation.y = .8; });
      break;
    }
    case 'monito': {
      malla(geo('esf', .6, 16, 12), '#ffffff', 0, .55, 0, g); malla(geo('esf', .45, 16, 12), '#ffffff', 0, 1.35, 0, g); malla(geo('esf', .33, 16, 12), '#ffffff', 0, 1.95, 0, g);
      malla(geo('cono', .06, .3, 8), '#ff8a1e', 0, 1.95, .42, g).rotation.x = Math.PI / 2;
      for (const s of [-1, 1]) malla(geo('esf', .04, 6, 5), '#2b1f33', s * .12, 2.03, .29, g, false);
      malla(geo('toro', .34, .08, 8, 20), '#ff6fa3', 0, 1.7, 0, g).rotation.x = Math.PI / 2;
      malla(geo('cil', .26, .26, .4, 16), '#2b2b3a', 0, 2.38, 0, g); malla(geo('cil', .4, .4, .05, 16), '#2b2b3a', 0, 2.2, 0, g);
      for (let i = 0; i < 3; i++) malla(geo('esf', .045, 6, 5), '#2b1f33', 0, 1.2 + i * .18, .44, g, false);
      break;
    }
    case 'banca': {
      for (let i = 0; i < 3; i++) malla(geo('caja', 2, .08, .18), rosa, 0, .5, -.2 + i * .2, g);
      for (let i = 0; i < 3; i++) malla(geo('caja', 2, .16, .06), rosa, 0, .75 + i * .2, -.36, g);
      for (const x of [-.85, .85]) { malla(geo('caja', .08, .5, .5), '#ffffff', x, .25, 0, g); malla(geo('caja', .08, .7, .06), '#ffffff', x, .9, -.38, g); }
      break;
    }
    case 'farol': {
      malla(geo('cil', .07, .09, 2.4, 10), new THREE.MeshLambertMaterial({ map: texRayas('#ffffff', '#ff8fb8', 4) }), 0, 1.2, 0, g);
      malla(geo('esf', .38, 16, 12), matLuz('#ffe3f0', .55), 0, 2.6, 0, g, false);
      malla(geo('toro', .38, .04, 6, 20), '#ff6fa3', 0, 2.6, 0, g);
      break;
    }
    case 'columpio': {
      for (const s of [-1, 1]) { const a = malla(geo('cil', .07, .07, 2.8, 8), '#ff8fb8', s * 1.1, 1.3, -.4, g); a.rotation.x = .3; const b = malla(geo('cil', .07, .07, 2.8, 8), '#ff8fb8', s * 1.1, 1.3, .4, g); b.rotation.x = -.3; }
      malla(geo('cil', .07, .07, 2.4, 8), '#ffffff', 0, 2.6, 0, g).rotation.z = Math.PI / 2;
      const sw = grupo(g, 0, 2.6, 0); g.userData.columpio = sw;
      for (const s of [-1, 1]) malla(geo('cil', .015, .015, 2, 4), '#ffffff', s * .4, -1, 0, sw);
      malla(geo('caja', 1, .08, .4), rosa, 0, -2, 0, sw);
      break;
    }
    case 'arco': {
      const ar = malla(geo('toro', 1.3, .1, 8, 28, Math.PI), '#ffffff', 0, 1.3, 0, g);
      for (const s of [-1, 1]) malla(geo('cil', .1, .1, 1.3, 8), '#ffffff', s * 1.3, .65, 0, g);
      const cols = ['#ff8fb8', '#ffd1e6', '#fff3a3', '#e6d1ff', '#ffffff'];
      for (let i = 0; i < 22; i++) { const t = i / 21, a = t * Math.PI; malla(geo('esf', .14, 8, 6), cols[i % 5], Math.cos(a) * 1.3, 1.3 + Math.sin(a) * 1.3, (i % 2 - .5) * .12, g); }
      for (let i = 0; i < 12; i++) malla(geo('esf', .12, 8, 6), '#7bd389', (i < 6 ? -1.3 : 1.3), .2 + (i % 6) * .2, .1, g);
      break;
    }
    case 'fuente': {
      malla(geo('cil', 1.5, 1.6, .5, 28), '#ffd1e4', 0, .25, 0, g);
      malla(geo('cil', 1.35, 1.35, .05, 28), mat('#ff9fc8', { brillo: 120, op: .85 }), 0, .48, 0, g, false);
      malla(geo('cil', .2, .25, 1.2, 12), '#ffd1e4', 0, 1.05, 0, g);
      malla(geo('cil', .8, .5, .3, 24), '#ffd1e4', 0, 1.7, 0, g);
      malla(geo('cil', .7, .7, .04, 24), mat('#ff9fc8', { brillo: 120, op: .85 }), 0, 1.84, 0, g, false);
      malla(geo('esf', .25, 12, 10), mat('#ff3b5c', { brillo: 90 }), 0, 2.1, 0, g);
      g.userData.chorro = true;
      break;
    }
    case 'cerca': {
      for (let i = 0; i < 4; i++) { const b = grupo(g, -1.2 + i * .8, 0, 0); malla(geo('cil', .06, .06, 1, 8), new THREE.MeshLambertMaterial({ map: texRayas('#ffffff', '#ff4d6d', 3) }), 0, .5, 0, b); malla(geo('toro', .12, .06, 6, 10, Math.PI), new THREE.MeshLambertMaterial({ map: texRayas('#ffffff', '#ff4d6d', 3) }), .12, 1, 0, b); }
      malla(geo('caja', 2.6, .08, .06), '#ffffff', 0, .7, 0, g);
      break;
    }
  }
  g.traverse(o => { if (o.isMesh && o.castShadow !== false) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

/* ---------- Flores (brote, botón y flor) ---------- */
function crearFlor(tipo, etapa, marchita) {
  const f = FLORES.find(x => x.id === tipo) || FLORES[0];
  const g = new THREE.Group();
  const verde = marchita ? '#9a8a5a' : '#5fbf6f';
  const c1 = marchita ? '#b39a7a' : f.c, c2 = marchita ? '#8a6e52' : f.c2;
  malla(geo('cil', .4, .45, .1, 16), '#7a4e33', 0, .05, 0, g, false).receiveShadow = true;
  if (etapa === 0) {
    for (const s of [-1, 1]) { const h = malla(geo('esf', 1, 8, 6), verde, s * .08, .2, 0, g); h.scale.set(.1, .04, .06); h.rotation.z = s * .5; }
    malla(geo('cil', .02, .02, .2, 5), verde, 0, .15, 0, g);
    return g;
  }
  const alto = etapa === 1 ? .55 : .95;
  const tallo = grupo(g);
  malla(geo('cil', .03, .035, alto, 6), verde, 0, alto / 2, 0, tallo);
  for (const s of [-1, 1]) { const h = malla(geo('esf', 1, 8, 6), verde, s * .12, alto * .35, 0, tallo); h.scale.set(.15, .04, .08); h.rotation.z = -s * .5; }
  const cab = grupo(tallo, 0, alto, 0); g.userData.cabeza = cab;
  if (etapa === 1) { malla(geo('esf', .1, 10, 8), c1, 0, .06, 0, cab).scale.y = 1.4; }
  else if (tipo === 'tulipan') {
    for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; const p = malla(geo('esf', 1, 10, 8), c1, Math.sin(a) * .07, .12, Math.cos(a) * .07, cab); p.scale.set(.1, .18, .07); p.rotation.y = a; }
  } else if (tipo === 'rosa') {
    for (let k = 0; k < 3; k++) for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + k; const r = .05 + k * .06; malla(geo('esf', .08 - k * .01, 8, 6), k ? c1 : c2, Math.sin(a) * r, .08 - k * .02, Math.cos(a) * r, cab); }
  } else {
    const n = tipo === 'girasol' ? 12 : tipo === 'margarita' ? 10 : 6;
    const tam = tipo === 'girasol' ? 1.4 : 1;
    const corola = grupo(cab); corola.rotation.x = -.5;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const p = malla(geo('esf', 1, 8, 6), (tipo === 'algodon' && i % 2) ? c2 : c1, Math.sin(a) * .13 * tam, 0, Math.cos(a) * .13 * tam, corola); p.scale.set(.06 * tam, .03, .11 * tam); p.rotation.y = a; }
    malla(geo('esf', .07 * tam, 10, 8), tipo === 'algodon' ? '#ffffff' : c2, 0, .02, 0, corola).scale.y = .6;
  }
  if (marchita) { tallo.rotation.z = .5; cab.rotation.x = 1.3; }
  return g;
}

/* ---------- Vehículos ---------- */
function crearVehiculo(id) {
  const g = new THREE.Group(), u = { g, ruedas: [] };
  const rueda = (x, y, z, r, c = '#2b2b3a', grosor = .06) => { const w = grupo(g, x, y, z); const t = malla(geo('toro', r, grosor, 8, 24), c, 0, 0, 0, w); t.rotation.y = Math.PI / 2; for (let i = 0; i < 4; i++) { const ra = malla(geo('cil', .015, .015, r * 2, 4), '#dddddd', 0, 0, 0, w); ra.rotation.x = i * Math.PI / 4; } u.ruedas.push(w); return w; };
  if (id === 'bici') {
    rueda(0, .45, .75, .42); rueda(0, .45, -.75, .42);
    const rosa = mat('#ff7fb0', { brillo: 80 });
    const m = (a, b) => { const v = new THREE.Vector3().subVectors(b, a); const c = malla(geo('cil', .04, .04, 1, 8), rosa, 0, 0, 0, g); c.position.copy(a).add(b).multiplyScalar(.5); c.scale.y = v.length(); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize()); };
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    m(V(0, .45, -.75), V(0, 1.05, -.15)); m(V(0, 1.05, -.15), V(0, .5, .1)); m(V(0, .5, .1), V(0, .45, -.75)); m(V(0, 1.05, -.15), V(0, 1.15, .6)); m(V(0, .5, .1), V(0, 1.15, .6)); m(V(0, 1.15, .6), V(0, .45, .75));
    malla(geo('caja', .25, .08, .4), '#ffffff', 0, 1.12, -.2, g);
    malla(geo('cil', .03, .03, .7, 6), '#ffffff', 0, 1.3, .62, g).rotation.z = Math.PI / 2;
    const ca = grupo(g, 0, 1.1, .95); malla(geo('cil', .22, .18, .25, 12, true), mat('#f3d9a4', { doble: true }), 0, 0, 0, ca); for (let i = 0; i < 4; i++) malla(geo('esf', .07, 6, 5), ['#ff8fb8', '#fff3a3', '#ffffff', '#ffd1e6'][i], Math.sin(i * 1.6) * .1, .12, Math.cos(i * 1.6) * .1, ca);
    u.asiento = 1.16; u.pose = 'pedalea'; u.zPersona = -.2;
  } else if (id === 'moto') {
    rueda(0, .42, .9, .38, '#2b2b3a', .11); rueda(0, .42, -.9, .38, '#2b2b3a', .11);
    const cu = malla(geo('esf', 1, 18, 12), mat('#ff6fa3', { brillo: 100 }), 0, .85, .1, g); cu.scale.set(.32, .3, .9);
    malla(geo('caja', .32, .12, .7), '#2b2b3a', 0, 1.1, -.3, g);
    malla(geo('cil', .03, .03, .8, 6), '#dddddd', 0, 1.35, .75, g).rotation.z = Math.PI / 2;
    malla(geo('cil', .04, .04, .7, 6), '#dddddd', 0, 1, .82, g).rotation.x = -.4;
    malla(geo('esf', .12, 10, 8), matLuz('#fff8d6', .7), 0, 1.15, 1.02, g, false);
    malla(geo('cil', .06, .08, .5, 8), '#bbbbbb', .2, .55, -.7, g).rotation.x = Math.PI / 2;
    u.asiento = 1.18; u.pose = 'maneja'; u.zPersona = -.25;
  } else if (id === 'carruaje') {
    const oro = mat('#ffd34d', { brillo: 100, spec: 0x997700 });
    for (const [x, z, r] of [[-.95, -.9, .6], [.95, -.9, .6], [-.95, .9, .45], [.95, .9, .45]]) { const w = rueda(x, r, z, r, '#ffd34d', .07); }
    const caja = grupo(g, 0, 1.55, 0);
    const cu = malla(geo('esf', 1, 24, 14, 0, Math.PI * 2, Math.PI * .42, Math.PI * .58), mat('#ffffff', { brillo: 60, doble: true }), 0, 0, 0, caja); cu.scale.set(.95, .9, 1.15);
    malla(geo('toro', .94, .06, 8, 32), oro, 0, .22, 0, caja).rotation.x = Math.PI / 2;
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; malla(geo('esf', .07, 8, 6), mat('#ffd1e4', { brillo: 80 }), Math.sin(a) * .93, .05, Math.cos(a) * 1.08, caja); }
    for (const [x, z] of [[-.75, -.85], [.75, -.85], [-.75, .85], [.75, .85]]) malla(geo('cil', .04, .04, 1.6, 6), oro, x, 1, z, caja);
    const techo = malla(geo('esf', 1, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat('#ffd1e4', { brillo: 50 }), 0, 1.75, 0, caja); techo.scale.set(.95, .45, 1.15);
    malla(geo('toro', .94, .05, 6, 30), oro, 0, 1.76, 0, caja).rotation.x = Math.PI / 2;
    malla(geo('esf', .16, 12, 10), oro, 0, 2.25, 0, caja);
    malla(geo('caja', 1.3, .1, 2.2), oro, 0, .62, 0, g);
    // Poni blanco
    const po = grupo(g, 0, 0, 2.3); u.poni = po;
    const b = '#ffffff';
    malla(geo('esf', 1, 16, 12), b, 0, 1.15, 0, po).scale.set(.38, .38, .65);
    const cue = grupo(po, 0, 1.4, .5); cue.rotation.x = -.6; malla(geo('cil', .16, .22, .7, 12), b, 0, .3, 0, cue);
    const ca = grupo(po, 0, 1.95, .75); malla(geo('esf', 1, 14, 10), b, 0, 0, 0, ca).scale.set(.2, .22, .34); malla(geo('esf', .03, 6, 5), '#2b1f33', .14, .06, .12, ca); malla(geo('esf', .03, 6, 5), '#2b1f33', -.14, .06, .12, ca);
    for (const s of [-1, 1]) malla(geo('cono', .06, .16, 6), b, s * .1, .22, -.08, ca);
    for (let i = 0; i < 6; i++) malla(geo('esf', .1, 8, 6), '#ff9fcf', 0, 1.95 - i * .12, .55 - i * .1, po);
    malla(geo('esf', .12, 8, 6), '#ff9fcf', 0, 1.15, -.68, po).scale.y = 2;
    u.patas = [];
    for (const [x, z] of [[-.2, .4], [.2, .4], [-.2, -.4], [.2, -.4]]) { const pa = grupo(po, x, .95, z); malla(geo('cil', .07, .06, .9, 8), b, 0, -.45, 0, pa); malla(geo('cil', .08, .08, .1, 8), '#ffd34d', 0, -.9, 0, pa); u.patas.push(pa); }
    u.asiento = 1.25; u.pose = 'sentada'; u.zPersona = 0;
  } else if (id === 'patines') {
    u.pose = 'patina'; u.asiento = .12; u.zPersona = 0; u.patines = true;
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return u;
}
function crearPatin() {
  const g = new THREE.Group();
  malla(geo('caja', .2, .06, .42), '#ff8fb8', 0, 0, 0, g);
  for (const z of [-.14, .14]) for (const x of [-.06, .06]) { const r = malla(geo('cil', .045, .045, .04, 10), '#ffffff', x, -.06, z, g); r.rotation.z = Math.PI / 2; }
  return g;
}

/* =========================================================
   ESCENOGRAFÍA DEL MUNDO
   ========================================================= */
function arbolAlgodon(c = '#ffb3d9', h = 2.4) {
  const g = new THREE.Group();
  malla(geo('cil', .16, .22, h, 10), new THREE.MeshLambertMaterial({ map: texRayas('#ffffff', '#ff8fb8', 4) }), 0, h / 2, 0, g);
  const n = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) { const r = .7 + Math.random() * .5; malla(geo('ico', 1, 2), c, (Math.random() - .5) * 1.4, h + (Math.random() - .3) * .9, (Math.random() - .5) * 1.4, g).scale.setScalar(r); }
  return g;
}
function paletaGigante(c1 = '#ff6fa3', h = 3) {
  const g = new THREE.Group();
  malla(geo('cil', .08, .08, h, 8), '#ffffff', 0, h / 2, 0, g);
  const d = malla(geo('cil', 1.1, 1.1, .3, 28), new THREE.MeshPhongMaterial({ map: texEspiral(c1, '#ffffff'), shininess: 90 }), 0, h + .9, 0, g);
  d.rotation.x = Math.PI / 2;
  return g;
}
function bastonGigante(h = 4) {
  const g = new THREE.Group();
  const m = new THREE.MeshLambertMaterial({ map: texRayas('#ffffff', '#ff4d6d', 4) });
  malla(geo('cil', .25, .25, h, 14), m, 0, h / 2, 0, g);
  malla(geo('toro', .6, .25, 10, 18, Math.PI), m, .6, h, 0, g);
  return g;
}
function gomitaProp(c, r = .6) { return malla(geo('esf', r, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(c, { brillo: 80, op: .92 }), 0, 0, 0); }
function cupcakeHongo(c = '#ffb3d9', s = 1) {
  const g = new THREE.Group();
  malla(geo('cil', .7, .5, .8, 16), '#9ad7ff', 0, .4, 0, g);
  for (let i = 0; i < 3; i++) malla(geo('toro', .62 - i * .17, .2, 10, 20), c, 0, .9 + i * .25, 0, g).rotation.x = Math.PI / 2;
  malla(geo('esf', .16, 10, 8), mat('#ff3b5c', { brillo: 90 }), 0, 1.6, 0, g);
  g.scale.setScalar(s);
  return g;
}
function arbolGalleta() {
  const g = new THREE.Group();
  malla(geo('cil', .2, .3, 2.2, 10), '#8a5a3c', 0, 1.1, 0, g);
  const copa = grupo(g, 0, 2.6, 0); g.userData.copa = copa;
  const gal = mat('#c98a4b');
  for (let i = 0; i < 7; i++) { const c = malla(geo('cil', .55, .55, .16, 20), gal, (Math.random() - .5) * 1.6, (Math.random() - .3) * 1.2, (Math.random() - .5) * 1.6, copa); c.rotation.set(Math.random() * 1.5, Math.random() * 3, Math.random() * 1.5); for (let k = 0; k < 4; k++) malla(geo('esf', .06, 6, 5), '#4a2a1a', Math.sin(k * 1.7) * .3, .09, Math.cos(k * 1.7) * .3, c, false); }
  malla(geo('ico', 1, 1), '#7bd389', 0, 0, 0, copa).scale.set(1.1, .9, 1.1);
  return g;
}
function rocaCaramelo() {
  const g = new THREE.Group();
  const cols = ['#ffb347', '#ff7eb6', '#9ce3c4', '#c9a7ff'];
  for (let i = 0; i < 3; i++) { const r = malla(geo('dode', .7 - i * .15), mat(cols[(Math.random() * 4) | 0], { brillo: 120, op: .88, spec: 0xffffff }), (i - 1) * .7, .5 - i * .1, (Math.random() - .5) * .5, g); r.rotation.set(Math.random() * 3, Math.random() * 3, 0); }
  return g;
}
function cristalAzucar() {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) { const c = malla(geo('octa', .45), mat(i % 2 ? '#ffffff' : '#ffd1ea', { brillo: 150, op: .8, spec: 0xffffff, em: 0x221122 }), (Math.random() - .5) * 1, .5, (Math.random() - .5) * 1, g); c.scale.set(.6, 1.6 + Math.random(), .6); c.rotation.set((Math.random() - .5) * .6, Math.random() * 3, (Math.random() - .5) * .6); }
  return g;
}
function arbustoGomita() {
  const g = new THREE.Group();
  malla(geo('ico', 1, 1), '#6fcf7f', 0, .6, 0, g).scale.set(1.1, .8, 1.1);
  const cols = ['#ff6b9a', '#ffd23f', '#9b7bff', '#ff9f43', '#7fd3ff'];
  for (let i = 0; i < 9; i++) { const a = i * 2.3; malla(geo('esf', .16, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(cols[i % 5], { brillo: 90 }), Math.sin(a) * .8, .55 + (i % 3) * .25, Math.cos(a) * .8, g); }
  return g;
}
function planta(tipo) {
  const g = new THREE.Group();
  const v = '#5fbf6f';
  if (tipo === 'trigo') { for (let i = 0; i < 9; i++) { const x = (i % 3 - 1) * .3, z = ((i / 3 | 0) - 1) * .3; malla(geo('cil', .02, .02, 1.1, 4), '#d9b44a', x, .55, z, g); malla(geo('esf', 1, 6, 5), '#f0c75e', x, 1.15, z, g).scale.set(.05, .16, .05); } }
  else if (tipo === 'maiz') { for (let i = 0; i < 3; i++) { const x = (i - 1) * .4; malla(geo('cil', .05, .06, 2, 6), v, x, 1, 0, g); const h = malla(geo('esf', 1, 6, 5), v, x + .15, 1.2, 0, g); h.scale.set(.3, .04, .1); h.rotation.z = -.5; malla(geo('esf', 1, 8, 6), '#ffd23f', x + .1, 1.3, .08, g).scale.set(.08, .18, .08); } }
  else {
    malla(geo('ico', 1, 1), v, 0, .45, 0, g).scale.set(.6, .45, .6);
    const fr = { tomatillo: ['#a8e06a', .1], tomate: ['#ff4d4d', .11], chile: ['#e8262f', .07], fresa: ['#ff3b5c', .09] }[tipo] || ['#ff4d4d', .1];
    for (let i = 0; i < 7; i++) { const a = i * 2.1; const f = malla(geo('esf', fr[1], 8, 6), mat(fr[0], { brillo: 70 }), Math.sin(a) * .5, .35 + (i % 3) * .18, Math.cos(a) * .5, g); if (tipo === 'chile') f.scale.set(1, 2.2, 1); }
  }
  return g;
}
function gallinero() {
  const g = new THREE.Group();
  malla(geo('caja', 1.6, 1.2, 1.3), '#f6d6b8', 0, .6, 0, g);
  const t = malla(geo('cono', 1.3, .8, 4), '#ff8fb8', 0, 1.6, 0, g); t.rotation.y = Math.PI / 4;
  malla(geo('caja', .5, .6, .05), '#8a5a3c', 0, .4, .66, g);
  // gallinita
  const ga = grupo(g, .9, 0, .9);
  malla(geo('esf', .25, 12, 10), '#ffffff', 0, .3, 0, ga).scale.set(1, .9, 1.2);
  malla(geo('esf', .15, 10, 8), '#ffffff', 0, .55, .2, ga);
  malla(geo('cono', .04, .1, 5), '#ffb020', 0, .55, .37, ga).rotation.x = Math.PI / 2;
  malla(geo('esf', .06, 6, 5), '#ff3b3b', 0, .7, .2, ga);
  for (const s of [-1, 1]) malla(geo('esf', .02, 5, 4), '#2b1f33', s * .07, .58, .33, ga, false);
  for (let i = 0; i < 3; i++) malla(geo('esf', .09, 8, 6), '#fff4e0', -.4 + i * .2, .1, 1, g).scale.y = 1.3;
  g.userData.gallina = ga;
  return g;
}
function tienda({ techo = '#ff8fb8', muro = '#fff4f8', toldo = ['#ffffff', '#ff8fb8'], letrero = ['Tienda', ''], forma = 'dosaguas' }) {
  const g = new THREE.Group();
  malla(geo('caja', 7, .3, 6), '#ffe9f2', 0, .15, 0, g);
  malla(geo('caja', 6, 3.6, 4.6), muro, 0, 2.1, -.3, g);
  const vit = malla(geo('caja', 3.4, 1.6, .1), matLuz('#fff2c8', .15), -.8, 1.8, 1.98, g, false);
  malla(geo('caja', 3.6, 1.8, .08), '#ffffff', -.8, 1.8, 1.95, g);
  const pu = malla(geo('caja', 1.1, 2.2, .1), '#ffb3cf', 1.9, 1.4, 1.98, g);
  malla(geo('esf', .06, 6, 5), '#ffd34d', 1.6, 1.4, 2.05, g);
  const tol = malla(geo('caja', 6.6, .12, 1.8), new THREE.MeshLambertMaterial({ map: texRayas(toldo[0], toldo[1], 8, false) }), 0, 3.2, 2.5, g);
  tol.rotation.x = .35; tol.material.map.rotation = Math.PI / 2; tol.material.map.center.set(.5, .5);
  for (let i = 0; i < 12; i++) malla(geo('esf', .16, 8, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), toldo[1], -3.1 + i * .56, 2.9, 3.35, g, false);
  if (forma === 'dosaguas') {
    for (const s of [-1, 1]) { const l = malla(geo('caja', 3.8, .3, 5.4), techo, s * 1.6, 4.6, -.3, g); l.rotation.z = -s * .55; }
  } else if (forma === 'cupula') {
    malla(geo('esf', 3.2, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), techo, 0, 3.9, -.3, g).scale.set(1, .6, .8);
    malla(geo('esf', .35, 12, 10), mat('#ff3b5c', { brillo: 90 }), 0, 5.9, -.3, g);
  } else if (forma === 'plano') {
    malla(geo('caja', 6.4, .4, 5), techo, 0, 4.1, -.3, g);
    for (let i = 0; i < 9; i++) malla(geo('esf', .3, 10, 8), '#ffffff', -3 + i * .75, 4.4, 2.2, g);
  }
  const le = new THREE.Mesh(geo('plano', 4.2, 1.3), new THREE.MeshBasicMaterial({ map: texTexto(letrero), transparent: true }));
  le.position.set(0, forma === 'plano' ? 4.95 : 4.4, forma === 'plano' ? 2.25 : 2.1);
  g.add(le); g.userData.letrero = le;
  g.traverse(o => { if (o.isMesh && o !== le) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
function farolCamino() {
  const g = crearObjeto('farol');
  return g;
}
function nube(s = 1) {
  const g = new THREE.Group();
  const m = mat('#ffffff', { op: .92 });
  for (let i = 0; i < 6; i++) malla(geo('ico', 1, 2), m, (i - 2.5) * 1.1, Math.sin(i * 1.3) * .4, (Math.random() - .5) * 1.2, g, false).scale.setScalar(1 + Math.sin(i * 2.1) * .4 + .3);
  g.scale.setScalar(s);
  return g;
}
function cocinita() {
  const g = new THREE.Group();
  malla(geo('caja', 3.4, 1, 1.3), '#ffffff', 0, .5, 0, g);
  malla(geo('caja', 3.5, .1, 1.4), '#ffb3cf', 0, 1.03, 0, g);
  malla(geo('caja', 1.2, .05, 1), '#2b2b3a', -.8, 1.1, 0, g);
  for (const x of [-1.1, -.5]) malla(geo('toro', .18, .03, 6, 16), '#888888', x, 1.14, 0, g).rotation.x = Math.PI / 2;
  const olla = grupo(g, -1.1, 1.14, 0); g.userData.olla = olla;
  malla(geo('cil', .3, .26, .4, 16), mat('#ff8fb8', { brillo: 80 }), 0, .2, 0, olla);
  malla(geo('cil', .27, .27, .02, 16), '#7bd389', 0, .38, 0, olla, false);
  const sart = grupo(g, -.5, 1.16, 0); malla(geo('cil', .28, .24, .08, 16), '#3a3a48', 0, .04, 0, sart); malla(geo('cil', .03, .03, .4, 6), '#3a3a48', .45, .06, 0, sart).rotation.z = Math.PI / 2;
  malla(geo('caja', .6, .5, .6), '#e9e4ee', .9, 1.33, -.2, g);
  for (let i = 0; i < 3; i++) malla(geo('cil', .08, .08, .3, 8), ['#ff6fa3', '#7bd389', '#ffd23f'][i], .2 + i * .25, 1.23, .35, g);
  // sombrilla
  malla(geo('cil', .04, .04, 3, 6), '#ffffff', 1.5, 1.5, .5, g);
  const so = malla(geo('cono', 1.8, .7, 12), new THREE.MeshLambertMaterial({ map: texRayas('#ffffff', '#ff8fb8', 6) }), 1.5, 3.1, .5, g);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
