"use client";

import { useRef, useState } from "react";
import { PX_PER_CM } from "./pagination";

// Word-style rulers in centimetres. The white band is the text area; the
// grey ends are the margins. Dragging a margin edge sets custom margins
// (Layout → Margins → Custom) for the whole document.
function useMarginDrag({ value, min, max, scale, sign, onCommit }) {
  const [preview, setPreview] = useState(null);
  const startRef = useRef(null);

  function onPointerDown(event) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    startRef.current = { coord: sign.axis === "x" ? event.clientX : event.clientY, value };
    setPreview(value);
  }
  function onPointerMove(event) {
    if (!startRef.current) return;
    const coord = sign.axis === "x" ? event.clientX : event.clientY;
    const delta = ((coord - startRef.current.coord) / scale) * sign.dir;
    setPreview(Math.round(Math.min(max, Math.max(min, startRef.current.value + delta))));
  }
  function onPointerUp() {
    if (!startRef.current) return;
    startRef.current = null;
    if (preview !== null && preview !== value) onCommit(preview);
    setPreview(null);
  }
  return { current: preview ?? value, handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp } };
}

// Quarter-centimetre ticks measured outward from the margin edge (`origin`),
// numbered every whole centimetre, as Word does.
function Ticks({ length, origin, axis }) {
  const quarter = PX_PER_CM / 4;
  const marks = [];
  const first = -Math.floor(origin / quarter);
  const last = Math.floor((length - origin) / quarter);
  for (let k = first; k <= last; k += 1) {
    const pos = origin + k * quarter;
    const kind = k % 4 === 0 ? " cm" : k % 2 === 0 ? " half" : "";
    marks.push(
      <span key={k} className={`ruler-tick${kind}`} style={axis === "x" ? { left: pos } : { top: pos }}>
        {k % 4 === 0 && k !== 0 ? Math.abs(k / 4) : null}
      </span>
    );
  }
  return marks;
}

export function HorizontalRuler({ width, marginLeft, marginRight, scale, onChangeMargins }) {
  const minText = PX_PER_CM * 2;
  const left = useMarginDrag({ value: marginLeft, min: 0, max: width - marginRight - minText, scale, sign: { axis: "x", dir: 1 }, onCommit: (v) => onChangeMargins({ left: v }) });
  const right = useMarginDrag({ value: marginRight, min: 0, max: width - marginLeft - minText, scale, sign: { axis: "x", dir: -1 }, onCommit: (v) => onChangeMargins({ right: v }) });
  const l = left.current;
  const r = right.current;
  return (
    <div className="ruler ruler-h" style={{ width }} aria-hidden="true">
      <div className="ruler-margin" style={{ left: 0, width: l }} />
      <div className="ruler-margin" style={{ right: 0, width: r }} />
      <div className="ruler-ticks">
        <Ticks length={width} origin={l} axis="x" />
      </div>
      <span className="ruler-handle ruler-handle-x" style={{ left: l }} title="Left margin — drag to adjust" {...left.handlers} />
      <span className="ruler-handle ruler-handle-x" style={{ left: width - r }} title="Right margin — drag to adjust" {...right.handlers} />
    </div>
  );
}

export function VerticalRuler({ pageHeight, pageGap, pageCount, marginTop, marginBottom, scale, onChangeMargins }) {
  const minText = PX_PER_CM * 3;
  const top = useMarginDrag({ value: marginTop, min: 0, max: pageHeight - marginBottom - minText, scale, sign: { axis: "y", dir: 1 }, onCommit: (v) => onChangeMargins({ top: v }) });
  const bottom = useMarginDrag({ value: marginBottom, min: 0, max: pageHeight - marginTop - minText, scale, sign: { axis: "y", dir: -1 }, onCommit: (v) => onChangeMargins({ bottom: v }) });
  const t = top.current;
  const b = bottom.current;
  return (
    <div className="ruler-v-stack" aria-hidden="true">
      {Array.from({ length: pageCount }).map((_, i) => (
        <div key={i} className="ruler ruler-v" style={{ height: pageHeight, marginBottom: i < pageCount - 1 ? pageGap : 0 }}>
          <div className="ruler-margin" style={{ top: 0, height: t }} />
          <div className="ruler-margin" style={{ bottom: 0, height: b }} />
          <div className="ruler-ticks">
            <Ticks length={pageHeight} origin={t} axis="y" />
          </div>
          {i === 0 && (
            <>
              <span className="ruler-handle ruler-handle-y" style={{ top: t }} title="Top margin — drag to adjust" {...top.handlers} />
              <span className="ruler-handle ruler-handle-y" style={{ top: pageHeight - b }} title="Bottom margin — drag to adjust" {...bottom.handlers} />
            </>
          )}
        </div>
      ))}
    </div>
  );
}
