import * as THREE from 'three';
import { GOLD, INK, LAPIS, TURQUOISE } from './materials';

/**
 * Textures painted at runtime on canvases, so the game ships no image files yet.
 * Numbers are drawn LTR with Persian digits; words stay in the DOM UI.
 */
const FONT = 'Vazirmatn, Tahoma, sans-serif';
export const hex = (n: number): string => '#' + n.toString(16).padStart(6, '0');

export function canvasTexture(
  w: number,
  h: number,
  draw: (g: CanvasRenderingContext2D, w: number, h: number) => void,
  repeat?: [number, number],
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

/** Eight-point star, the basic unit of girih tilework. */
export function star8(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string): void {
  g.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    const rr = i % 2 ? r * 0.55 : r;
    g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  g.closePath();
  g.fillStyle = fill;
  g.fill();
}

/** Pointed Persian arch outline (for windows and iwan gates). */
export function archPath(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  g.beginPath();
  g.moveTo(x, y + h);
  g.lineTo(x, y + h * 0.42);
  g.quadraticCurveTo(x, y + h * 0.08, x + w / 2, y);
  g.quadraticCurveTo(x + w, y + h * 0.08, x + w, y + h * 0.42);
  g.lineTo(x + w, y + h);
  g.closePath();
}

/** Sidewalk tile: one calm star per tile with soft grout. */
export function tileTexture(repeat: [number, number]): THREE.CanvasTexture {
  return canvasTexture(
    256,
    256,
    (g, w, h) => {
      g.fillStyle = '#f4e6c8';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = '#d9c59c';
      g.lineWidth = 6;
      g.strokeRect(3, 3, w - 6, h - 6);
      star8(g, 128, 128, 84, hex(TURQUOISE));
      star8(g, 128, 128, 70, '#f4e6c8');
      star8(g, 128, 128, 52, hex(TURQUOISE));
      star8(g, 128, 128, 22, hex(GOLD));
    },
    repeat,
  );
}

/** Facade: wall color, tile frieze, two lapis arch windows framed in gold. */
export function facadeTexture(wall: number, repeatY: number): THREE.CanvasTexture {
  return canvasTexture(
    256,
    256,
    (g, w, h) => {
      g.fillStyle = hex(wall);
      g.fillRect(0, 0, w, h);
      g.fillStyle = hex(TURQUOISE);
      g.fillRect(0, 0, w, 34);
      for (let x = 16; x < w; x += 32) star8(g, x, 17, 11, hex(GOLD));
      g.fillStyle = hex(GOLD);
      g.fillRect(0, 34, w, 4);
      for (const x of [28, 148]) {
        archPath(g, x, 70, 80, 150);
        g.fillStyle = hex(GOLD);
        g.fill();
        archPath(g, x + 7, 78, 66, 142);
        g.fillStyle = hex(LAPIS);
        g.fill();
        g.strokeStyle = hex(INK);
        g.lineWidth = 3;
        g.stroke();
      }
    },
    [2, repeatY],
  );
}

/** Gate panel shaped as an iwan arch, tinted good/bad, with the operation. */
export function gateTexture(text: string, color: number): THREE.CanvasTexture {
  const c = new THREE.Color(color);
  const rgba = `rgba(${(c.r * 255) | 0},${(c.g * 255) | 0},${(c.b * 255) | 0},0.88)`;
  return canvasTexture(256, 192, (g, w, h) => {
    archPath(g, 10, 6, w - 20, h - 12);
    g.fillStyle = hex(GOLD);
    g.fill();
    archPath(g, 22, 18, w - 44, h - 24);
    g.fillStyle = rgba;
    g.fill();
    g.strokeStyle = hex(INK);
    g.lineWidth = 4;
    g.stroke();
    drawNumber(g, text, w / 2, h * 0.62, 76);
  });
}

/** Curling "Chinese cloud" band, a classic miniature sky motif. */
export function cloudTexture(): THREE.CanvasTexture {
  return canvasTexture(256, 128, (g) => {
    g.lineWidth = 5;
    g.strokeStyle = hex(GOLD);
    g.fillStyle = '#fffaf0';
    const blobs = [
      [60, 80, 30],
      [100, 60, 36],
      [148, 64, 34],
      [190, 82, 28],
      [125, 88, 30],
    ] as const;
    for (const [x, y, r] of blobs) {
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    for (const [x, y, r] of blobs) {
      g.beginPath();
      g.arc(x, y, r, Math.PI * 1.05, Math.PI * 1.95);
      g.stroke();
    }
    g.beginPath();
    for (let a = 0; a < Math.PI * 3.2; a += 0.15) g.lineTo(128 + Math.cos(a) * a * 3.4, 74 + Math.sin(a) * a * 3.4);
    g.stroke();
  });
}

export function drawNumber(g: CanvasRenderingContext2D, text: string, x: number, y: number, size: number): void {
  g.direction = 'ltr';
  g.font = `900 ${size}px ${FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.lineWidth = size * 0.14;
  g.strokeStyle = hex(INK);
  g.strokeText(text, x, y);
  g.fillStyle = '#fff8ea';
  g.fillText(text, x, y);
}
