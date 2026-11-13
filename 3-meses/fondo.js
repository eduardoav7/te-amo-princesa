// Corazoncitos rosas y brillitos azules flotando suavecito
(() => {
  const c = document.getElementById('fondo'); if (!c || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const x = c.getContext('2d'); let W, H, P = [];
  function tam() { const r = devicePixelRatio || 1; W = innerWidth; H = innerHeight; c.width = W * r; c.height = H * r; x.setTransform(r, 0, 0, r, 0, 0); }
  tam(); addEventListener('resize', tam);
  for (let i = 0; i < 34; i++) P.push({ x: Math.random() * W, y: Math.random() * H, s: 4 + Math.random() * 9, v: .15 + Math.random() * .35, f: Math.random() * 6, tipo: i % 3 ? 'c' : 'b', c: ['#ffb6cb', '#ff9fbf', '#ffd1df'][i % 3] });
  function cora(px, py, s, col, a) { x.save(); x.globalAlpha = a; x.fillStyle = col; x.beginPath(); x.moveTo(px, py + s * .35); x.bezierCurveTo(px - s, py - s * .4, px - s * .5, py - s * 1.1, px, py - s * .45); x.bezierCurveTo(px + s * .5, py - s * 1.1, px + s, py - s * .4, px, py + s * .35); x.fill(); x.restore(); }
  function brillo(px, py, s, a) { x.save(); x.globalAlpha = a; x.fillStyle = '#a9d0fb'; x.beginPath(); x.moveTo(px, py - s); x.quadraticCurveTo(px, py, px + s, py); x.quadraticCurveTo(px, py, px, py + s); x.quadraticCurveTo(px, py, px - s, py); x.quadraticCurveTo(px, py, px, py - s); x.fill(); x.restore(); }
  let t = 0;
  (function f() { t += .016; x.clearRect(0, 0, W, H);
    for (const p of P) { p.y -= p.v; if (p.y < -20) { p.y = H + 20; p.x = Math.random() * W; } const px = p.x + Math.sin(t + p.f) * 14, a = .35 + .3 * Math.sin(t * 1.5 + p.f);
      if (p.tipo === 'c') cora(px, p.y, p.s, p.c, a); else brillo(px, p.y, p.s * .7, a + .2); }
    requestAnimationFrame(f); })();
})();
