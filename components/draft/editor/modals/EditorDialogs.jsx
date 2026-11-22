"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import katex from "katex";
import { collectHeadings } from "../extensions";
import { chartImage, fileToDataUrl, imageSize } from "../graphics";

// Small dialogs behind the Word-style ribbon commands. All share the app's
// existing modal look (case-modal), close on backdrop click or Escape.
function DialogShell({ eyebrow, title, onClose, children, footer, wide }) {
  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="case-modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="case-modal" style={wide ? { width: "min(760px, 100%)" } : undefined} role="dialog" aria-label={title}>
        <div className="modal-head">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

const MAX_IMAGE_WIDTH = 600;

function fitWidth({ width, height }) {
  if (width <= MAX_IMAGE_WIDTH) return { width, height };
  return { width: MAX_IMAGE_WIDTH, height: Math.round((height * MAX_IMAGE_WIDTH) / width) };
}

export function InsertPictureDialog({ onClose, onInsert }) {
  const [src, setSrc] = useState("");
  const [alt, setAlt] = useState("");
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");

  async function onFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpe?g|gif|bmp|svg\+xml|webp)$/.test(file.type)) {
      setError("Choose a PNG, JPG, GIF, BMP, SVG or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Images up to 5 MB can be inserted.");
      return;
    }
    setError("");
    setSrc(await fileToDataUrl(file));
    if (!alt) setAlt(file.name.replace(/\.[^.]+$/, ""));
  }

  async function insert() {
    const finalSrc = src || url.trim();
    if (!finalSrc) {
      setError("Choose an image file or paste an image address.");
      return;
    }
    const size = fitWidth(await imageSize(finalSrc));
    onInsert({ src: finalSrc, alt, ...size });
    onClose();
  }

  return (
    <DialogShell
      eyebrow="INSERT"
      title="Pictures"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn" onClick={insert}>
            Insert
          </button>
        </>
      }
    >
      <div className="form-grid">
        <label className="form-field full">
          From this device
          <input type="file" accept="image/*" onChange={onFile} />
        </label>
        <label className="form-field full">
          Or an image address (https://…)
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/seal.png" disabled={!!src} />
        </label>
        <label className="form-field full">
          Alt text
          <input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe the picture" />
        </label>
        {src && <img src={src} alt="" className="dialog-image-preview" />}
        {error && <p className="form-error full">{error}</p>}
      </div>
    </DialogShell>
  );
}

const CHART_TYPES = [
  { key: "column", label: "Column" },
  { key: "line", label: "Line" },
  { key: "pie", label: "Pie" },
];

export function InsertChartDialog({ onClose, onInsert }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("column");
  const [rows, setRows] = useState([
    { label: "Q1", value: "12" },
    { label: "Q2", value: "19" },
    { label: "Q3", value: "8" },
    { label: "Q4", value: "15" },
  ]);
  const preview = useMemo(() => chartImage({ title, type, rows }), [title, type, rows]);

  function setRow(i, patch) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  return (
    <DialogShell
      eyebrow="INSERT"
      title="Chart"
      wide
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              onInsert(preview);
              onClose();
            }}
          >
            Insert Chart
          </button>
        </>
      }
    >
      <div className="chart-dialog">
        <div className="chart-dialog-form">
          <label className="form-field">
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Hearings per quarter" />
          </label>
          <div className="form-field">
            Chart type
            <div className="segmented">
              {CHART_TYPES.map((t) => (
                <button key={t.key} type="button" className={type === t.key ? "active" : ""} onClick={() => setType(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <table className="chart-data-table">
            <thead>
              <tr>
                <th>Label</th>
                <th>Value</th>
                <th aria-label="Remove" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>
                    <input value={r.label} onChange={(e) => setRow(i, { label: e.target.value })} aria-label={`Label ${i + 1}`} />
                  </td>
                  <td>
                    <input type="number" value={r.value} onChange={(e) => setRow(i, { value: e.target.value })} aria-label={`Value ${i + 1}`} />
                  </td>
                  <td>
                    <button type="button" className="modal-close" onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))} aria-label="Remove row" disabled={rows.length <= 1}>
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="btn btn-outline" onClick={() => setRows((prev) => [...prev, { label: "", value: "" }])} disabled={rows.length >= 12}>
            + Add row
          </button>
        </div>
        <img src={preview.src} alt="Chart preview" className="chart-dialog-preview" />
      </div>
    </DialogShell>
  );
}

const EQUATION_SAMPLES = [
  { label: "Fraction", latex: "\\frac{a}{b}" },
  { label: "Interest", latex: "A = P\\left(1 + \\frac{r}{n}\\right)^{nt}" },
  { label: "Sum", latex: "\\sum_{i=1}^{n} x_i" },
  { label: "Square root", latex: "\\sqrt{x^2 + y^2}" },
  { label: "Percentage", latex: "\\frac{part}{whole} \\times 100\\%" },
];

export function InsertEquationDialog({ initialLatex = "", onClose, onInsert }) {
  const [latex, setLatex] = useState(initialLatex || "\\frac{a}{b}");
  const [display, setDisplay] = useState(false);
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex || " ", { throwOnError: false, displayMode: true });
    } catch {
      return "";
    }
  }, [latex]);

  return (
    <DialogShell
      eyebrow="INSERT"
      title="Equation"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn"
            disabled={!latex.trim()}
            onClick={() => {
              onInsert({ latex: latex.trim(), display });
              onClose();
            }}
          >
            Insert
          </button>
        </>
      }
    >
      <div className="form-grid">
        <div className="form-field full">
          Quick start
          <div className="segmented segmented-wrap">
            {EQUATION_SAMPLES.map((s) => (
              <button key={s.label} type="button" onClick={() => setLatex(s.latex)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <label className="form-field full">
          Equation (LaTeX)
          <textarea rows={3} value={latex} onChange={(e) => setLatex(e.target.value)} spellCheck={false} />
        </label>
        <div className="equation-preview full" dangerouslySetInnerHTML={{ __html: html }} />
        <label className="form-field full" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={display} onChange={(e) => setDisplay(e.target.checked)} />
          On its own line (display equation)
        </label>
      </div>
    </DialogShell>
  );
}

export function BookmarkDialog({ existing, onClose, onAdd, onGoTo, onDelete }) {
  const [name, setName] = useState("");
  const valid = /^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(name);
  const taken = existing.includes(name);
  return (
    <DialogShell
      eyebrow="INSERT"
      title="Bookmark"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn"
            disabled={!valid || taken}
            onClick={() => {
              onAdd(name);
              onClose();
            }}
          >
            Add
          </button>
        </>
      }
    >
      <div className="form-grid">
        <label className="form-field full">
          Bookmark name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. PrayerClause" autoFocus />
          <small>Starts with a letter; letters, numbers and underscores only.</small>
        </label>
        {name && !valid && <p className="form-error full">That name isn&apos;t allowed.</p>}
        {taken && <p className="form-error full">A bookmark with that name already exists.</p>}
        {existing.length > 0 && (
          <div className="full dialog-list">
            {existing.map((b) => (
              <div key={b} className="dialog-list-row">
                <span>{b}</span>
                <span>
                  <button type="button" className="link" onClick={() => onGoTo(b)}>
                    Go to
                  </button>
                  <button type="button" className="link danger-link" onClick={() => onDelete(b)}>
                    Delete
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DialogShell>
  );
}

export function CrossReferenceDialog({ editor, bookmarks, onClose, onInsert }) {
  const headings = useMemo(() => collectHeadings(editor.getJSON()), [editor]);
  const [kind, setKind] = useState(bookmarks.length ? "bookmark" : "heading");
  const [target, setTarget] = useState("");
  const options = kind === "bookmark" ? bookmarks.map((b) => ({ value: b, label: b })) : headings.map((h) => ({ value: h.text, label: `${"  ".repeat(h.level - 1)}${h.text}` }));
  return (
    <DialogShell
      eyebrow="INSERT"
      title="Cross-reference"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn"
            disabled={!target}
            onClick={() => {
              onInsert({ refType: kind, target, label: target });
              onClose();
            }}
          >
            Insert
          </button>
        </>
      }
    >
      <div className="form-grid">
        <label className="form-field">
          Reference type
          <select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value);
              setTarget("");
            }}
          >
            <option value="heading">Heading</option>
            <option value="bookmark">Bookmark</option>
          </select>
        </label>
        <label className="form-field">
          Refer to
          <select value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="">Choose…</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        {!options.length && <p className="form-error full">{kind === "bookmark" ? "Add a bookmark first (Insert → Bookmark)." : "Add a heading first."}</p>}
      </div>
    </DialogShell>
  );
}

export function WordCountDialog({ stats, onClose }) {
  const rows = [
    ["Pages", stats.pages],
    ["Words", stats.words],
    ["Characters (no spaces)", stats.charsNoSpaces],
    ["Characters (with spaces)", stats.chars],
    ["Paragraphs", stats.paragraphs],
  ];
  return (
    <DialogShell
      eyebrow="REVIEW"
      title="Word Count"
      onClose={onClose}
      footer={
        <button type="button" className="btn" onClick={onClose}>
          Close
        </button>
      }
    >
      <table className="word-count-table">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td>{label}</td>
              <td>{value.toLocaleString("en-IN")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {stats.scope === "selection" && <p className="page-subtitle">Counting the selected text only.</p>}
    </DialogShell>
  );
}

const SHORTCUTS = [
  ["Bold / Italic / Underline", "Ctrl+B / Ctrl+I / Ctrl+U"],
  ["Undo / Redo", "Ctrl+Z / Ctrl+Y"],
  ["Save a version now", "Ctrl+S"],
  ["Print", "Ctrl+P"],
  ["Page break", "Ctrl+Enter"],
  ["Align left / centre / right / justify", "Ctrl+L / Ctrl+E / Ctrl+R / Ctrl+J"],
  ["Subscript / Superscript", "Ctrl+, / Ctrl+."],
  ["Strikethrough", "Ctrl+Shift+S"],
  ["Bulleted / numbered list", "Ctrl+Shift+8 / Ctrl+Shift+7"],
  ["Heading 1–3", "Ctrl+Alt+1 … 3"],
  ["Zoom in / out", "Ctrl+Alt+= / Ctrl+Alt+-"],
];

export function ShortcutsDialog({ onClose }) {
  return (
    <DialogShell
      eyebrow="HELP"
      title="Keyboard shortcuts"
      onClose={onClose}
      footer={
        <button type="button" className="btn" onClick={onClose}>
          Close
        </button>
      }
    >
      <table className="word-count-table">
        <tbody>
          {SHORTCUTS.map(([what, keys]) => (
            <tr key={what}>
              <td>{what}</td>
              <td>
                <kbd>{keys}</kbd>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="page-subtitle">On a Mac, use ⌘ instead of Ctrl.</p>
    </DialogShell>
  );
}

export function ImportDocxDialog({ onClose, onImport }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  return (
    <DialogShell
      eyebrow="FILE"
      title="Open a Word document"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="btn"
            disabled={!file || busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await onImport(file);
                onClose();
              } catch (err) {
                setError(err?.message || "That file couldn't be read as a Word document.");
                setBusy(false);
              }
            }}
          >
            {busy ? "Opening…" : "Open as new draft"}
          </button>
        </>
      }
    >
      <div className="form-grid">
        <label className="form-field full">
          Word document (.docx)
          <input
            ref={inputRef}
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setError(f && !/\.docx$/i.test(f.name) ? "Choose a .docx file (Word 2007 or later)." : "");
              setFile(f && /\.docx$/i.test(f.name) ? f : null);
            }}
          />
          <small>Opens as a new draft, so nothing you already have is overwritten. Text, headings, lists, tables, pictures, links and footnotes come across; fonts and colours take the draft&apos;s own design.</small>
        </label>
        {error && <p className="form-error full">{error}</p>}
      </div>
    </DialogShell>
  );
}
