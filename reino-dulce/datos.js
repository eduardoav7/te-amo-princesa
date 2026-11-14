/* El Reino de Dulce · datos del juego */
'use strict';

// Iconito de Cheetos (no hay emoji): un churrito naranja con polvito
const ICONO_CHEETOS = `<svg viewBox="0 0 40 40" width="1em" height="1em" style="vertical-align:-.12em"><path d="M8 26c-3-6 3-12 9-9 4-6 13-4 13 3 5 1 6 9 0 11-5 4-12 3-15-1-4 2-8 0-7-4z" fill="#ff8a1e" stroke="#c4560a" stroke-width="2"/><g fill="#ffc46b"><circle cx="15" cy="22" r="1.6"/><circle cx="23" cy="19" r="1.4"/><circle cx="27" cy="27" r="1.6"/><circle cx="18" cy="29" r="1.3"/></g></svg>`;

const ITEMS = {
  // Materiales de construcción
  galleta:   { n: 'Galleta', e: '🍪', t: 'material' },
  caramelo:  { n: 'Caramelo', e: '🍬', t: 'material' },
  chocolate: { n: 'Chocolate', e: '🍫', t: 'material' },
  azucar:    { n: 'Azúcar mágica', e: '✨', t: 'material' },
  gomita:    { n: 'Gomitas', e: '🫐', t: 'material' },
  // Ingredientes
  tomatillo: { n: 'Tomate verde', e: '🟢', t: 'ingrediente' },
  tomate:    { n: 'Jitomate', e: '🍅', t: 'ingrediente' },
  chile:     { n: 'Chile', e: '🌶️', t: 'ingrediente' },
  trigo:     { n: 'Trigo', e: '🌾', t: 'ingrediente' },
  maiz:      { n: 'Maíz', e: '🌽', t: 'ingrediente' },
  fresa:     { n: 'Fresa', e: '🍓', t: 'ingrediente' },
  huevo:     { n: 'Huevo', e: '🥚', t: 'ingrediente' },
  carne:     { n: 'Carne para milanesa', e: '🥩', t: 'ingrediente', precio: 8 },
  queso:     { n: 'Queso', e: '🧀', t: 'ingrediente', precio: 6 },
  crema:     { n: 'Crema', e: '🥛', t: 'ingrediente', precio: 5 },
  pan:       { n: 'Pan molido', e: '🍞', t: 'ingrediente', precio: 3 },
};

// Comida que se cocina
const RECETAS = [
  { id: 'spaghetti', n: 'Spaghetti en salsa verde con milanesa', e: '🍝', fav: true, venta: 70,
    pide: { trigo: 2, huevo: 2, tomatillo: 3, chile: 1, crema: 1, carne: 1, pan: 1 },
    pasos: ['Hirviendo la pasta…', 'Licuando la salsa verde…', 'Empanizando la milanesa…', '¡Emplatando con amor!'] },
  { id: 'pizza', n: 'Pizza de queso', e: '🍕', fav: true, venta: 45,
    pide: { trigo: 2, tomate: 2, queso: 2 },
    pasos: ['Amasando…', 'Poniendo salsa y queso…', 'Al horno…'] },
  { id: 'cheetos', n: 'Cheetos caseros', e: ICONO_CHEETOS, fav: true, venta: 28,
    pide: { maiz: 3, queso: 1, chile: 1 },
    pasos: ['Moliendo el maíz…', 'Inflando los churritos…', 'Polvito de queso…'] },
  { id: 'dulces', n: 'Dulces de fresa', e: '🍬', fav: true, venta: 18,
    pide: { fresa: 2, azucar: 2 },
    pasos: ['Derritiendo azúcar…', 'Formando dulcecitos…'] },
  { id: 'pastel', n: 'Pastel de fresas', e: '🍰', venta: 60,
    pide: { trigo: 2, huevo: 2, azucar: 2, fresa: 2, crema: 1 },
    pasos: ['Batiendo…', 'Horneando…', 'Decorando con fresas…'] },
  { id: 'galletas', n: 'Galletas con chispas', e: '🍪', venta: 24,
    pide: { trigo: 1, huevo: 1, azucar: 1, chocolate: 1 },
    pasos: ['Mezclando…', 'Al horno…'] },
  { id: 'chocolatito', n: 'Chocolate calientito', e: '☕', venta: 20,
    pide: { chocolate: 2, crema: 1, azucar: 1 },
    pasos: ['Calentando la leche…', 'Derritiendo el chocolate…'] },
  { id: 'elote', n: 'Elote con queso y chile', e: '🌽', venta: 22,
    pide: { maiz: 2, crema: 1, queso: 1, chile: 1 },
    pasos: ['Cociendo el elote…', 'Untando crema y queso…'] },
];

// Casas (de normalita hasta el castillo)
const CASAS = [
  { id: 'galleta', n: 'Casita de Galleta', e: '🏠', pide: { galleta: 12, azucar: 4 }, monedas: 0, tam: 4.2,
    d: 'Pequeñita y calientita, con betún blanco en el techo.' },
  { id: 'caramelo', n: 'Cabaña de Caramelo', e: '🛖', pide: { galleta: 16, caramelo: 12, gomita: 6 }, monedas: 40, tam: 4.8,
    d: 'Columnas de bastón de dulce y techo de gomitas.' },
  { id: 'chocolate', n: 'Casa de Chocolate', e: '🏡', pide: { galleta: 22, chocolate: 20, caramelo: 10, azucar: 8 }, monedas: 120, tam: 5.4,
    d: 'Dos pisos, balcón y chimenea de chocolate.' },
  { id: 'pastel', n: 'Mansión de Pastel', e: '🎂', pide: { galleta: 30, chocolate: 24, azucar: 26, gomita: 16 }, monedas: 300, tam: 6,
    d: 'Una mansión de tres pisos de pastel con fresas y velitas.' },
  { id: 'castillo', n: 'Castillo de Dulce', e: '🏰', pide: { galleta: 50, caramelo: 40, chocolate: 40, azucar: 40, gomita: 30 }, monedas: 800, tam: 6.6,
    d: 'Torres, banderitas y un portón dorado. Un castillo para mi princesa.' },
];

// Mueblería
const MUEBLES = [
  { id: 'cama', n: 'Cama con dosel', e: '🛏️', precio: 70 },
  { id: 'sofa', n: 'Sofá esponjoso', e: '🛋️', precio: 55 },
  { id: 'mesa', n: 'Mesa con sillas', e: '🍽️', precio: 45 },
  { id: 'lampara', n: 'Lámpara de pie', e: '💡', precio: 20 },
  { id: 'alfombra', n: 'Alfombra redonda', e: '⭕', precio: 15 },
  { id: 'librero', n: 'Librero', e: '📚', precio: 35 },
  { id: 'tele', n: 'Tele', e: '📺', precio: 80 },
  { id: 'tocador', n: 'Tocador con espejo', e: '🪞', precio: 50 },
  { id: 'cuadro', n: 'Cuadro de nosotros', e: '🖼️', precio: 15 },
  { id: 'maceta', n: 'Planta en maceta', e: '🪴', precio: 12 },
  { id: 'piano', n: 'Piano', e: '🎹', precio: 140 },
  { id: 'peluche', n: 'Osito de peluche', e: '🧸', precio: 25 },
];

// Bazar de decoración (jardín y Navidad)
const DECOR = [
  { id: 'arbolnav', n: 'Árbol de Navidad', e: '🎄', precio: 40 },
  { id: 'esferas', n: 'Esferas (caja de 6)', e: '🔴', precio: 10, consumible: true },
  { id: 'luces', n: 'Series de luces', e: '✨', precio: 15, consumible: true },
  { id: 'estrella', n: 'Estrella para la punta', e: '⭐', precio: 20, consumible: true },
  { id: 'regalos', n: 'Regalitos', e: '🎁', precio: 15 },
  { id: 'monito', n: 'Muñeco de nieve', e: '⛄', precio: 25 },
  { id: 'banca', n: 'Banca de jardín', e: '🪑', precio: 20 },
  { id: 'farol', n: 'Farol de paleta', e: '🏮', precio: 15 },
  { id: 'columpio', n: 'Columpio', e: '🎠', precio: 50 },
  { id: 'arco', n: 'Arco de flores', e: '🌸', precio: 35 },
  { id: 'fuente', n: 'Fuente de fresa', e: '⛲', precio: 80 },
  { id: 'cerca', n: 'Cerquita de bastón', e: '🍭', precio: 8 },
];

// Florería: semillas
const FLORES = [
  { id: 'rosa', n: 'Rosa', e: '🌹', precio: 5, c: '#ff5c8a', c2: '#e23d6d' },
  { id: 'tulipan', n: 'Tulipán', e: '🌷', precio: 5, c: '#ff9ec7', c2: '#f06aa6' },
  { id: 'girasol', n: 'Girasol', e: '🌻', precio: 6, c: '#ffd23f', c2: '#8a5a2b' },
  { id: 'margarita', n: 'Margarita', e: '🌼', precio: 4, c: '#ffffff', c2: '#ffcc33' },
  { id: 'lila', n: 'Lirio lila', e: '💐', precio: 7, c: '#c7a3ff', c2: '#9b6bf0' },
  { id: 'algodon', n: 'Flor de algodón de azúcar', e: '🌸', precio: 10, c: '#ffc2e2', c2: '#b8e2ff' },
];

// Boutique
const ROPA = {
  top: [
    { id: 'blusaRosa', n: 'Blusa rosa', precio: 0, c: '#ff9ec2' },
    { id: 'blusaBlanca', n: 'Blusa blanca', precio: 20, c: '#fbf7f4' },
    { id: 'sudaderaLila', n: 'Sudadera lila', precio: 35, c: '#c3a6f2' },
    { id: 'sueterNav', n: 'Suéter navideño', precio: 45, c: '#d7263d', c2: '#ffffff' },
    { id: 'vestidoFresa', n: 'Vestido de fresas', precio: 60, c: '#ff6f91', vestido: 'corto', c2: '#ffffff' },
    { id: 'vestidoPrincesa', n: 'Vestido de princesa', precio: 150, c: '#bfe0ff', vestido: 'largo', c2: '#ffffff' },
    { id: 'vestidoGala', n: 'Vestido de gala rosa', precio: 160, c: '#ffb3d1', vestido: 'largo', c2: '#ffe08a' },
  ],
  abajo: [
    { id: 'jeans', n: 'Jeans', precio: 0, c: '#5b7fc4', largo: true },
    { id: 'faldaRosa', n: 'Falda rosa', precio: 20, c: '#ff7fb0', falda: true },
    { id: 'faldaTablas', n: 'Falda de tablas', precio: 30, c: '#8f6fd6', falda: true },
    { id: 'short', n: 'Short de mezclilla', precio: 20, c: '#7aa0dd' },
    { id: 'pantBlanco', n: 'Pantalón blanco', precio: 25, c: '#f4f1ea', largo: true },
  ],
  zapatos: [
    { id: 'tenis', n: 'Tenis blancos', precio: 0, c: '#ffffff' },
    { id: 'flats', n: 'Flats rosas', precio: 15, c: '#ff8fb8' },
    { id: 'botas', n: 'Botas cafés', precio: 30, c: '#8a5a3c' },
    { id: 'cristal', n: 'Zapatillas de cristal', precio: 90, c: '#d8f1ff', brillo: true },
  ],
  acc: [
    { id: 'nada', n: 'Sin accesorio', precio: 0 },
    { id: 'mono', n: 'Moño rosa', precio: 10, c: '#ff6fa3' },
    { id: 'diadema', n: 'Diadema de flores', precio: 20, c: '#ffd1e6' },
    { id: 'gorroNav', n: 'Gorro navideño', precio: 25, c: '#d7263d' },
    { id: 'sombrero', n: 'Sombrero de sol', precio: 30, c: '#f3d9a4' },
    { id: 'corona', n: 'Corona', precio: 120, c: '#ffd34d' },
  ],
  peinado: [
    { id: 'suelto', n: 'Suelto', precio: 0 },
    { id: 'coleta', n: 'Coleta', precio: 10 },
    { id: 'chongo', n: 'Chonguito', precio: 10 },
    { id: 'trenzas', n: 'Trenzas', precio: 15 },
  ],
};
const ROPA_CATS = [['top', '👚 Arriba'], ['abajo', '👖 Abajo'], ['zapatos', '👟 Zapatos'], ['acc', '🎀 Accesorio'], ['peinado', '💇‍♀️ Peinado']];

// Concesionaria
const VEHICULOS = [
  { id: 'patines', n: 'Patines', e: '🛼', precio: 60, vel: 1.4 },
  { id: 'bici', n: 'Bici rosita', e: '🚲', precio: 160, vel: 1.75 },
  { id: 'moto', n: 'Moto', e: '🏍️', precio: 650, vel: 2.6 },
  { id: 'carruaje', n: 'Carruaje', e: '🎠', precio: 1400, vel: 2.2 },
];

// Metas con notitas de Lalito
const METAS = [
  { id: 'm1', n: 'Recoge 6 galletas en el Bosque de Galleta', premio: 20, nota: 'Mi Brittybee trabajadora 💞 Ya vas juntando para tu casita.' },
  { id: 'm2', n: 'Construye tu primera casa', premio: 40, nota: 'Te la construí con mis propias manos, princesa. Algún día será de verdad 💞' },
  { id: 'm3', n: 'Cocina tu spaghetti en salsa verde con milanesa', premio: 40, nota: 'Tu platillo favorito… y algún día te lo voy a preparar yo en persona 💞' },
  { id: 'm4', n: 'Vende 3 comidas en el Mercado', premio: 30, nota: 'La mejor chef del Reino de Dulce. Todos quieren tu comida 💞' },
  { id: 'm5', n: 'Planta una flor y riégala', premio: 20, nota: 'Así como cuidas tus flores, yo te quiero cuidar a ti siempre 💞' },
  { id: 'm6', n: 'Estrena un outfit en la Boutique', premio: 25, nota: 'Te ves preciosa con todo, pero así te ves todavía más 💞' },
  { id: 'm7', n: 'Compra tu primer mueble', premio: 25, nota: 'Nuestra casita se va llenando de cosas bonitas 💞' },
  { id: 'm8', n: 'Pon un árbol de Navidad con esferas', premio: 40, nota: 'Nuestra primera Navidad juntos. Ya quiero que llegue 💞' },
  { id: 'm9', n: 'Consigue tu primer vehículo', premio: 50, nota: '¡Ahora sí, a pasear por todo el reino! 💞' },
  { id: 'm10', n: 'Construye el Castillo de Dulce', premio: 300, nota: 'Te prometí un castillo y aquí está. Eres y siempre serás mi princesa 💞' },
];

const PRECIO_SEMILLA_REGALO = 0;
