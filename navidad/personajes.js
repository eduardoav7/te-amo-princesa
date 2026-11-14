/* Personajes de Lalito y Brittani: cabezotas redondas, ojitos de punto, naricita redonda y sonrisa grande */
const PJ = (() => {
  const INK = '#3d2b41', PIEL = '#f6c9a8', PIEL_S = '#e9ae88', PELO_EL = '#1b1820', PELO_ELLA = '#5a3322', PELO_ELLA_S = '#43241a';
  const L = (d, c, w = 2.4) => `<path d="${d}" fill="${c}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
  const linea = (d, w = 2.4, c = INK) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

  // ---------- Caras ----------
  // Ojitos grandes y brillantes
  const ojo = (x, y, r, pest) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.22}" fill="#2b1f33"/>
      <ellipse cx="${x}" cy="${y + r * .55}" rx="${r * .62}" ry="${r * .38}" fill="#6b4a7a" opacity=".7"/>
      <circle cx="${x + r * .38}" cy="${y - r * .45}" r="${r * .42}" fill="#fff"/><circle cx="${x - r * .35}" cy="${y + r * .35}" r="${r * .18}" fill="#fff"/>
      ${pest ? `<path d="M${x + pest * r * .92} ${y - r * .5} q${pest * 3} -1 ${pest * 5} -4 M${x + pest * r * .98} ${y - r * .05} q${pest * 3} 0 ${pest * 5.4} -1.6" fill="none" stroke="#2b1f33" stroke-width="1.7" stroke-linecap="round"/>` : ''}`;
  const ojoFeliz = (x, y, pest) => `${linea(`M${x - 6} ${y + 1} Q${x} ${y - 7} ${x + 6} ${y + 1}`, 2.8, '#2b1f33')}${pest ? linea(`M${x + pest * 6} ${y} l${pest * 3.6} -3`, 1.8, '#2b1f33') : ''}`;
  const rubor = (x, y, rx) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx * .6}" fill="#ff9fb2" opacity=".6"/><path d="M${x - rx * .45} ${y - 1} l2 -2.4 M${x - rx * .05} ${y - 1} l2 -2.4" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>`;
  function caraEl(gesto) {
    const ojos = gesto === 'feliz' ? ojoFeliz(-13, -150, 0) + ojoFeliz(15, -150, 0) : ojo(-13, -151, 5.6, 0) + ojo(15, -151, 5.6, 0);
    const boca = gesto === 'canta'
      ? `<ellipse class="pj-boca" cx="1" cy="-127" rx="6" ry="5" fill="#c4505f" stroke="${INK}" stroke-width="2"/><ellipse cx="1" cy="-124.5" rx="3.4" ry="1.8" fill="#ff8fa3"/>`
      : `<path d="M-8 -129 Q1 -120 10 -129" fill="#c4505f" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>`;
    return `
      <ellipse cx="-38" cy="-146" rx="6.5" ry="9" fill="${PIEL}" stroke="${INK}" stroke-width="2.2"/>
      <ellipse cx="39" cy="-146" rx="6.5" ry="9" fill="${PIEL}" stroke="${INK}" stroke-width="2.2"/>
      <path d="M0 -194 C25 -194 39 -177 39 -152 C39 -127 25 -106 0 -104 C-25 -106 -39 -127 -39 -152 C-39 -177 -25 -194 0 -194 Z" fill="${PIEL}" stroke="${INK}" stroke-width="2.4"/>
      <g transform="scale(.86 1)">${L('M-46 -152 Q-50 -200 0 -198 Q44 -200 47 -156 Q40 -176 22 -178 Q26 -168 14 -170 Q4 -186 -12 -176 Q-26 -184 -32 -170 Q-42 -168 -46 -152 Z', PELO_EL)}</g>
      ${linea('M-22 -186 Q-8 -193 8 -190', 2.6, '#4a4458')}
      ${linea('M-19 -163 q6 -3 11 -1 M9 -164 q6 -2 11 1', 2)}
      ${ojos}
      <ellipse cx="1" cy="-138" rx="4" ry="3" fill="${PIEL_S}"/>
      ${boca}
      ${rubor(-24, -133, 7.5)}${rubor(26, -133, 7.5)}`;
  }
  function caraElla(gesto) {
    const ojos = gesto === 'feliz' ? ojoFeliz(-12, -117, -1) + ojoFeliz(12, -117, 1)
      : gesto === 'triste' ? ojo(-12, -117, 6, -1) + ojo(12, -117, 6, 1) + linea('M-19 -129 Q-12 -131 -6 -134 M19 -129 Q12 -131 6 -134', 2) + `<path d="M-17 -112 q5 2 10 0 M7 -112 q5 2 10 0" stroke="#bfe3ff" stroke-width="2" fill="none" opacity=".9"/>`
      : ojo(-12, -118, 6, -1) + ojo(12, -118, 6, 1);
    const boca = gesto === 'triste' ? linea('M-6 -95 Q0 -100 6 -95', 2.2) : `<path d="M-6 -98 Q0 -91 6 -98" fill="#c4505f" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
    return `
      <ellipse cx="-34" cy="-114" rx="5.5" ry="8.5" fill="${PIEL}" stroke="${INK}" stroke-width="2.1"/>
      <ellipse cx="34" cy="-114" rx="5.5" ry="8.5" fill="${PIEL}" stroke="${INK}" stroke-width="2.1"/>
      <path d="M0 -158 C21 -158 35 -143 35 -120 C35 -98 22 -80 0 -78 C-22 -80 -35 -98 -35 -120 C-35 -143 -21 -158 0 -158 Z" fill="${PIEL}" stroke="${INK}" stroke-width="2.4"/>
      <g transform="scale(.84 1)">${L('M-43 -112 Q-46 -162 0 -162 Q46 -162 43 -112 Q38 -134 22 -140 Q8 -132 -10 -136 Q-28 -140 -36 -128 Q-42 -122 -43 -112 Z', PELO_ELLA)}</g>
      ${linea('M-20 -150 Q-6 -158 10 -155', 2.6, '#8a5a40')}
      ${ojos}
      <ellipse cx="0" cy="-106" rx="3.2" ry="2.4" fill="${PIEL_S}"/>
      ${boca}
      ${rubor(-21, -103, 7)}${rubor(21, -103, 7)}`;
  }
  const peloAtras = () => L('M-34 -140 Q-44 -118 -42 -90 Q-41 -70 -36 -62 Q-29 -57 -22 -64 L22 -64 Q29 -57 36 -62 Q41 -70 42 -90 Q44 -118 34 -140 Q0 -164 -34 -140 Z', PELO_ELLA);
  const monio = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s}) rotate(-12)">${L('M0 0 L-10 -7 L-10 7 Z M0 0 L10 -7 L10 7 Z', '#d7263d', 1.8)}<circle r="3.4" fill="#d7263d" stroke="${INK}" stroke-width="1.6"/></g>`;
  const brazo = (d, color, x, y, mano = PIEL) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="6" fill="${mano}" stroke="${INK}" stroke-width="2.2"/>`;
  // Pantuflas de gatito (en el cuento: la zapatilla de cristal tiene forma de gatito)
  function pantufla(x, cristal) {
    const f = cristal ? 'rgba(200,232,255,.75)' : '#f6ecd6', b = cristal ? '#7fb8e6' : INK;
    return `<g transform="translate(${x} 0)">
      <path d="M-15 0 Q-17 -14 -8 -15 L-6 -22 L-1 -15 L3 -15 L8 -22 L10 -14 Q17 -12 15 0 Z" fill="${f}" stroke="${b}" stroke-width="2" stroke-linejoin="round"/>
      ${cristal ? `<path d="M-10 -10 q3 -3 6 -2" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/>` : ''}
      <path d="M-4 -8 q1.5 -2 3 0 M3 -8 q1.5 -2 3 0" fill="none" stroke="${cristal ? '#4b8cc4' : INK}" stroke-width="1.4" stroke-linecap="round"/>
      <ellipse cx="-8" cy="-5" rx="2.4" ry="1.4" fill="#f29bb0" opacity=".7"/><ellipse cx="9" cy="-5" rx="2.4" ry="1.4" fill="#f29bb0" opacity=".7"/>
      <path d="M0 -4 l-1.4 1.4 h2.8 Z" fill="${cristal ? '#4b8cc4' : '#e98fa5'}"/></g>`;
  }

  // ---------- Lalito ----------
  function el(traje = 'principe', gesto = 'sonrie', op = {}) {
    let cuerpo;
    if (traje === 'casual') {
      cuerpo = `
        ${L('M-22 -50 L-24 -8 L-4 -8 L0 -34 L4 -8 L24 -8 L22 -50 Z', '#3b5577')}
        ${linea('M-12 -40 l-1 30 M12 -40 l1 30', 1.2, '#2c4260')}
        ${L('M-30 -2 Q-30 -12 -4 -12 L-2 0 Z', '#1d1d24')}${L('M30 -2 Q30 -12 4 -12 L2 0 Z', '#1d1d24')}
        ${linea('M-28 -1 H-3 M28 -1 H3', 2.6, '#f4f4f4')}
        ${L('M-34 -102 Q-40 -76 -34 -46 Q0 -40 34 -46 Q40 -76 34 -102 Q0 -110 -34 -102 Z', '#1f1f27')}
        ${linea('M0 -104 V-44', 1.8, '#9aa0aa')}${linea('M-10 -106 L0 -96 L10 -106', 2, '#9aa0aa')}
        ${op.sinBrazos ? '' : brazo('M-32 -96 Q-44 -74 -38 -52', '#1f1f27', -38, -50) + brazo('M32 -96 Q44 -74 38 -52', '#1f1f27', 38, -50)}
        ${linea('M-38 -88 L-42 -64 M-34 -90 L-39 -64 M38 -88 L42 -64 M34 -90 L39 -64', 1.6, '#e8e8e8')}`;
    } else {
      // Príncipe: casaca negra con botones y hombreras doradas y banda azul (su color favorito)
      cuerpo = `
        ${L('M-21 -50 L-23 -10 L-4 -10 L0 -34 L4 -10 L23 -10 L21 -50 Z', '#f4f1ea')}
        ${L('M-28 0 Q-28 -14 -4 -14 L-3 0 Z', '#1a1a20')}${L('M28 0 Q28 -14 4 -14 L3 0 Z', '#1a1a20')}
        ${L('M-34 -102 Q-42 -74 -36 -40 Q0 -34 36 -40 Q42 -74 34 -102 Q0 -110 -34 -102 Z', '#17171e')}
        ${L('M-8 -104 L0 -92 L8 -104 Z', '#f4f1ea', 1.6)}
        ${L('M-30 -96 Q-4 -76 24 -44 L32 -50 Q4 -82 -22 -102 Z', '#4f86d8', 1.8)}
        ${[-86, -74, -62, -50].map(y => `<circle cx="-12" cy="${y}" r="2.6" fill="#e9c15a" stroke="${INK}" stroke-width="1"/>`).join('')}
        ${linea('M-36 -42 Q0 -36 36 -42', 2, '#e9c15a')}
        ${L('M-34 -104 Q-48 -104 -48 -94 L-30 -92 Z', '#e9c15a', 1.6)}${L('M34 -104 Q48 -104 48 -94 L30 -92 Z', '#e9c15a', 1.6)}
        ${linea('M-46 -94 v6 M-41 -93 v6 M-36 -92 v6 M46 -94 v6 M41 -93 v6 M36 -92 v6', 1.6, '#e9c15a')}
        ${brazo('M-33 -96 Q-46 -72 -40 -50', '#17171e', -40, -48, '#ffffff')}${brazo('M33 -96 Q46 -72 40 -50', '#17171e', 40, -48, '#ffffff')}`;
    }
    return `<g class="pj-el">${cuerpo}${caraEl(gesto)}${traje === 'principe' ? `<g transform="translate(0 -190)">${L('M-16 4 L-18 -12 L-9 -4 L0 -16 L9 -4 L18 -12 L16 4 Z', '#e9c15a', 1.8)}<circle cx="0" cy="-16" r="2.4" fill="#4f86d8" stroke="${INK}" stroke-width="1"/><circle cx="0" cy="-2" r="2.4" fill="#d7263d" stroke="${INK}" stroke-width="1"/></g>` : ''}</g>`;
  }

  // ---------- Brittani ----------
  function ella(traje = 'gala', gesto = 'feliz', vestido = '#5b8fd6', op = {}) {
    let cuerpo;
    if (traje === 'casual') {
      cuerpo = `
        <rect x="-15" y="-34" width="10" height="30" rx="4" fill="#ecebef" stroke="${INK}" stroke-width="2"/>
        <rect x="5" y="-34" width="10" height="30" rx="4" fill="#ecebef" stroke="${INK}" stroke-width="2"/>
        ${pantufla(-12, false)}${pantufla(13, false)}
        ${L('M-22 -80 Q-28 -56 -36 -34 Q-24 -28 -12 -32 Q0 -28 12 -32 Q24 -28 36 -34 Q28 -56 22 -80 Q0 -86 -22 -80 Z', '#2f5d95')}
        ${linea('M-34 -36 q6 4 12 0 q6 4 12 0 q6 4 12 0 q6 4 12 0 q6 4 12 0', 1.6, '#24497a')}
        <g transform="translate(-8 -66)"><circle r="5.5" fill="#9cc3e8" stroke="${INK}" stroke-width="1.4"/><circle r="2" fill="#c9e0f5"/></g>
        ${op.sinBrazos ? '' : brazo('M-20 -76 Q-24 -60 -2 -58', '#2f5d95', -2, -58) + brazo('M20 -76 Q24 -60 4 -60', '#2f5d95', 4, -60)}`;
    } else {
      // Vestido de gala azul: corpiño, mangas abullonadas, falda amplia con brillitos y zapatillas de cristal de gatito
      cuerpo = `
        ${L('M-14 -78 Q-20 -60 -56 -8 Q-30 0 0 -4 Q30 0 56 -8 Q20 -60 14 -78 Z', vestido)}
        ${L('M-46 -10 Q-22 -2 0 -4 Q22 -2 46 -10 Q38 -40 14 -60 Q8 -40 0 -36 Q-8 -40 -14 -60 Q-38 -40 -46 -10 Z', 'rgba(255,255,255,.28)', 1.4)}
        ${linea('M-54 -8 q8 5 15.4 0 q8 5 15.4 0 q8 5 15.4 0 q8 5 15.4 0 q8 5 15.4 0 q8 5 15.4 0 q8 5 15.4 0', 1.8, '#ffffff')}
        ${pantufla(-12, true)}${pantufla(13, true)}
        ${L('M-16 -82 Q0 -88 16 -82 L14 -62 Q0 -58 -14 -62 Z', vestido)}
        ${L('M-14 -82 Q-28 -88 -28 -74 Q-26 -66 -16 -70 Z', '#b9d4f4', 1.8)}${L('M14 -82 Q28 -88 28 -74 Q26 -66 16 -70 Z', '#b9d4f4', 1.8)}
        <path d="M-10 -82 Q0 -78 10 -82" fill="none" stroke="#fff" stroke-width="1.6"/>
        ${[[-30, -20], [24, -28], [-8, -12], [36, -12], [-40, -8], [10, -44], [-18, -40]].map(([x, y]) => `<path class="pj-brillo" d="M${x} ${y - 3} l1 2 l2 1 l-2 1 l-1 2 l-1 -2 l-2 -1 l2 -1 Z" fill="#fff"/>`).join('')}
        ${brazo('M-24 -74 Q-32 -58 -26 -46', '#f6c9a8', -26, -44, '#ffffff')}${brazo('M24 -74 Q32 -58 26 -46', '#f6c9a8', 26, -44, '#ffffff')}`;
    }
    const tiara = traje === 'gala' ? `<g transform="translate(0 -158)">${L('M-20 2 Q0 -4 20 2 L16 -8 L10 -2 L6 -14 L0 -4 L-6 -14 L-10 -2 L-16 -8 Z', '#dfe8f5', 1.6)}<circle cx="0" cy="-6" r="2.6" fill="#7fb8e6" stroke="${INK}" stroke-width="1"/></g>` : '';
    return `<g class="pj-ella">${peloAtras()}${cuerpo}${caraElla(gesto)}${monio(28, -142)}${tiara}</g>`;
  }
  return { el, ella, pantufla, INK, brazo, PIEL };
})();
