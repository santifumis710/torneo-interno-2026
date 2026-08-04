import sharp from "sharp";

const SIZE = 256; // lado del PNG cuadrado de salida
const THRESHOLD = 42; // distancia de color para considerar "mismo fondo"
const CORNER_AGREE = 55; // si las esquinas difieren más que esto, no es un fondo plano

type Rgb = { r: number; g: number; b: number };

function dist(a: Rgb, b: Rgb): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

/**
 * Quita el fondo plano de una imagen: detecta el color de las esquinas y, si son
 * consistentes, vuelve transparentes las regiones de ese color conectadas a los
 * bordes (flood-fill), sin tocar zonas internas del mismo color.
 */
async function removeFlatBackground(input: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const px = (x: number, y: number) => (y * w + x) * 4;
  const colorAt = (x: number, y: number): Rgb => {
    const i = px(x, y);
    return { r: data[i], g: data[i + 1], b: data[i + 2] };
  };

  const corners = [colorAt(0, 0), colorAt(w - 1, 0), colorAt(0, h - 1), colorAt(w - 1, h - 1)];
  const cornerAlphas = [data[px(0, 0) + 3], data[px(w - 1, 0) + 3], data[px(0, h - 1) + 3], data[px(w - 1, h - 1) + 3]];

  // Si las esquinas ya son transparentes, no hay fondo que sacar.
  if (cornerAlphas.every((a) => a < 32)) return input;

  // Si las esquinas no concuerdan, no es un fondo plano: no tocamos nada.
  let maxDiff = 0;
  for (let i = 0; i < corners.length; i++)
    for (let j = i + 1; j < corners.length; j++) maxDiff = Math.max(maxDiff, dist(corners[i], corners[j]));
  if (maxDiff > CORNER_AGREE) return input;

  const bg: Rgb = {
    r: Math.round(corners.reduce((s, c) => s + c.r, 0) / 4),
    g: Math.round(corners.reduce((s, c) => s + c.g, 0) / 4),
    b: Math.round(corners.reduce((s, c) => s + c.b, 0) / 4),
  };

  // Flood-fill desde todos los píxeles del borde.
  const visited = new Uint8Array(w * h);
  const stack: number[] = [];
  const pushIfBg = (x: number, y: number) => {
    const idx = y * w + x;
    if (visited[idx]) return;
    visited[idx] = 1;
    if (dist(colorAt(x, y), bg) <= THRESHOLD) {
      data[idx * 4 + 3] = 0; // transparente
      stack.push(idx);
    }
  };
  for (let x = 0; x < w; x++) {
    pushIfBg(x, 0);
    pushIfBg(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    pushIfBg(0, y);
    pushIfBg(w - 1, y);
  }
  while (stack.length) {
    const idx = stack.pop()!;
    const x = idx % w;
    const y = (idx / w) | 0;
    if (x > 0) pushIfBg(x - 1, y);
    if (x < w - 1) pushIfBg(x + 1, y);
    if (y > 0) pushIfBg(x, y - 1);
    if (y < h - 1) pushIfBg(x, y + 1);
  }

  return sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

/** Normaliza un logo: quita fondo plano y devuelve un PNG cuadrado uniforme. */
export async function normalizeLogo(input: Buffer): Promise<Buffer> {
  const cleaned = await removeFlatBackground(input);
  return sharp(cleaned)
    .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}
