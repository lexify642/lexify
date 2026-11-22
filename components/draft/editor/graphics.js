// SVG builders for Insert → Shapes, Icons and Chart. Each returns an SVG
// data URL that goes into the document as an ordinary (resizable) image,
// the same way Word treats an inserted graphic as a picture — so it
// paginates, prints and exports to .docx like any other image.
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import {
  Scale,
  Gavel,
  FileText,
  Phone,
  Mail,
  Calendar,
  Check,
  X,
  CircleAlert,
  Star,
  User,
  Building2,
  MapPin,
  Clock,
  ArrowRight,
  Shield,
  Lock,
  Landmark,
} from "lucide-react";

export function svgDataUrl(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// ---------------------------------------------------------------- shapes
const STROKE = "#1f2937";

export const SHAPES = [
  { key: "rectangle", label: "Rectangle", width: 160, height: 100, body: (w, h, fill) => `<rect x="2" y="2" width="${w - 4}" height="${h - 4}" fill="${fill}" stroke="${STROKE}" stroke-width="2"/>` },
  { key: "rounded", label: "Rounded Rectangle", width: 160, height: 100, body: (w, h, fill) => `<rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="16" fill="${fill}" stroke="${STROKE}" stroke-width="2"/>` },
  { key: "ellipse", label: "Oval", width: 140, height: 100, body: (w, h, fill) => `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2 - 2}" ry="${h / 2 - 2}" fill="${fill}" stroke="${STROKE}" stroke-width="2"/>` },
  { key: "triangle", label: "Triangle", width: 120, height: 104, body: (w, h, fill) => `<polygon points="${w / 2},2 ${w - 2},${h - 2} 2,${h - 2}" fill="${fill}" stroke="${STROKE}" stroke-width="2"/>` },
  { key: "diamond", label: "Diamond", width: 120, height: 120, body: (w, h, fill) => `<polygon points="${w / 2},2 ${w - 2},${h / 2} ${w / 2},${h - 2} 2,${h / 2}" fill="${fill}" stroke="${STROKE}" stroke-width="2"/>` },
  { key: "arrow", label: "Right Arrow", width: 180, height: 80, body: (w, h, fill) => `<polygon points="2,${h * 0.3} ${w * 0.65},${h * 0.3} ${w * 0.65},2 ${w - 2},${h / 2} ${w * 0.65},${h - 2} ${w * 0.65},${h * 0.7} 2,${h * 0.7}" fill="${fill}" stroke="${STROKE}" stroke-width="2"/>` },
  { key: "line", label: "Line", width: 240, height: 12, body: (w, h) => `<line x1="2" y1="${h / 2}" x2="${w - 2}" y2="${h / 2}" stroke="${STROKE}" stroke-width="2"/>` },
  { key: "star", label: "Star", width: 120, height: 116, body: (w, h, fill) => `<polygon points="${starPoints(w, h)}" fill="${fill}" stroke="${STROKE}" stroke-width="2"/>` },
];

function starPoints(w, h) {
  const cx = w / 2;
  const cy = h / 2 + 4;
  const outer = Math.min(w, h) / 2 - 2;
  const inner = outer * 0.45;
  const pts = [];
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 ? inner : outer;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

export function shapeImage(key, fill = "#ede9f6") {
  const shape = SHAPES.find((s) => s.key === key) || SHAPES[0];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${shape.width}" height="${shape.height}" viewBox="0 0 ${shape.width} ${shape.height}">${shape.body(shape.width, shape.height, fill)}</svg>`;
  return { src: svgDataUrl(svg), alt: shape.label, width: shape.width, height: shape.height };
}

// ---------------------------------------------------------------- icons
export const ICONS = [
  { key: "scale", label: "Scales of justice", Icon: Scale },
  { key: "gavel", label: "Gavel", Icon: Gavel },
  { key: "landmark", label: "Court building", Icon: Landmark },
  { key: "file", label: "Document", Icon: FileText },
  { key: "shield", label: "Shield", Icon: Shield },
  { key: "lock", label: "Confidential", Icon: Lock },
  { key: "user", label: "Person", Icon: User },
  { key: "building", label: "Company", Icon: Building2 },
  { key: "phone", label: "Phone", Icon: Phone },
  { key: "mail", label: "Email", Icon: Mail },
  { key: "pin", label: "Location", Icon: MapPin },
  { key: "calendar", label: "Calendar", Icon: Calendar },
  { key: "clock", label: "Clock", Icon: Clock },
  { key: "check", label: "Check", Icon: Check },
  { key: "x", label: "Cross", Icon: X },
  { key: "alert", label: "Alert", Icon: CircleAlert },
  { key: "star", label: "Star", Icon: Star },
  { key: "arrow", label: "Arrow", Icon: ArrowRight },
];

// Renders a lucide icon into a detached element to read its SVG markup.
export function iconImage(key, color = "#1f2937", size = 64) {
  const entry = ICONS.find((i) => i.key === key) || ICONS[0];
  const host = document.createElement("div");
  const root = createRoot(host);
  flushSync(() => root.render(createElement(entry.Icon, { size, color, strokeWidth: 1.75 })));
  const svgEl = host.querySelector("svg");
  svgEl?.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svgEl?.removeAttribute("class");
  const svg = host.innerHTML;
  root.unmount();
  return { src: svgDataUrl(svg), alt: entry.label, width: size, height: size };
}

// ---------------------------------------------------------------- charts
const CHART_COLORS = ["#5e2b9d", "#2a78b6", "#d97706", "#16a34a", "#dc2626", "#0891b2", "#9333ea", "#64748b"];

function esc(text) {
  return String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

// rows: [{ label, value }]; type: "bar" | "column" | "line" | "pie"
export function chartImage({ title, type, rows }) {
  const W = 520;
  const H = 320;
  const data = rows.filter((r) => r.label !== "" && Number.isFinite(Number(r.value))).map((r) => ({ label: String(r.label), value: Number(r.value) }));
  const font = 'font-family="Arial, sans-serif"';
  let body = "";
  const top = title ? 44 : 20;

  if (type === "pie") {
    const total = data.reduce((s, d) => s + Math.max(0, d.value), 0) || 1;
    const cx = 170;
    const cy = top + (H - top) / 2 - 6;
    const r = Math.min(130, (H - top) / 2 - 16);
    let angle = -Math.PI / 2;
    data.forEach((d, i) => {
      const slice = (Math.max(0, d.value) / total) * Math.PI * 2;
      const x1 = cx + r * Math.cos(angle);
      const y1 = cy + r * Math.sin(angle);
      angle += slice;
      const x2 = cx + r * Math.cos(angle);
      const y2 = cy + r * Math.sin(angle);
      const large = slice > Math.PI ? 1 : 0;
      const color = CHART_COLORS[i % CHART_COLORS.length];
      body += data.length === 1
        ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>`
        : `<path d="M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${large} 1 ${x2.toFixed(1)},${y2.toFixed(1)} Z" fill="${color}" stroke="#fff" stroke-width="1.5"/>`;
      const ly = top + 10 + i * 22;
      body += `<rect x="330" y="${ly}" width="12" height="12" fill="${color}"/><text x="350" y="${ly + 11}" ${font} font-size="12" fill="#1f2937">${esc(d.label)} (${Math.round((Math.max(0, d.value) / total) * 100)}%)</text>`;
    });
  } else {
    const left = 52;
    const right = W - 16;
    const bottom = H - 44;
    const max = Math.max(1, ...data.map((d) => d.value));
    const niceMax = Math.ceil(max / Math.pow(10, Math.floor(Math.log10(max)))) * Math.pow(10, Math.floor(Math.log10(max)));
    for (let t = 0; t <= 4; t += 1) {
      const v = (niceMax / 4) * t;
      const y = bottom - ((bottom - top) * t) / 4;
      body += `<line x1="${left}" y1="${y}" x2="${right}" y2="${y}" stroke="#e5e7eb"/><text x="${left - 8}" y="${y + 4}" ${font} font-size="11" fill="#6b7280" text-anchor="end">${+v.toFixed(2)}</text>`;
    }
    const slot = (right - left) / Math.max(1, data.length);
    const pts = [];
    data.forEach((d, i) => {
      const x = left + slot * i;
      const hgt = ((bottom - top) * Math.max(0, d.value)) / niceMax;
      if (type === "line") {
        pts.push(`${(x + slot / 2).toFixed(1)},${(bottom - hgt).toFixed(1)}`);
      } else {
        body += `<rect x="${(x + slot * 0.18).toFixed(1)}" y="${(bottom - hgt).toFixed(1)}" width="${(slot * 0.64).toFixed(1)}" height="${hgt.toFixed(1)}" fill="${CHART_COLORS[0]}" rx="2"/>`;
      }
      body += `<text x="${(x + slot / 2).toFixed(1)}" y="${bottom + 18}" ${font} font-size="11" fill="#374151" text-anchor="middle">${esc(d.label.length > 14 ? `${d.label.slice(0, 13)}…` : d.label)}</text>`;
    });
    if (type === "line" && pts.length) {
      body += `<polyline points="${pts.join(" ")}" fill="none" stroke="${CHART_COLORS[0]}" stroke-width="2.5"/>`;
      pts.forEach((p) => {
        const [x, y] = p.split(",");
        body += `<circle cx="${x}" cy="${y}" r="3.5" fill="${CHART_COLORS[0]}"/>`;
      });
    }
    body += `<line x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}" stroke="#9ca3af"/>`;
  }

  const heading = title ? `<text x="${W / 2}" y="28" ${font} font-size="16" font-weight="bold" fill="#111827" text-anchor="middle">${esc(title)}</text>` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#ffffff"/>${heading}${body}</svg>`;
  return { src: svgDataUrl(svg), alt: title ? `Chart: ${title}` : "Chart", width: W, height: H };
}

// Rasterises an SVG data URL to PNG (Word can't show SVG without a PNG
// fallback, so .docx export swaps them).
export function svgToPngDataUrl(src, width, height) {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const w = width || img.naturalWidth || 300;
      const h = height || img.naturalHeight || 150;
      const canvas = document.createElement("canvas");
      canvas.width = w * 2;
      canvas.height = h * 2;
      const ctx = canvas.getContext("2d");
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// A file the user picked → data URL (Insert → Pictures).
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function imageSize(src) {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 300, height: 200 });
    img.src = src;
  });
}
