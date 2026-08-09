// Same Blob(html, "application/msword") technique already used by
// PartnershipDeedEngine.jsx and components/draft/exportUtils.js —
// generalized here for a full draft version's real TipTap contentJson
// instead of a fixed deed/clause-list shape. Word opens this natively.
import { generateHTML } from "@tiptap/html";
import { editorExtensions } from "./extensions";

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function draftWordHtml(draft, version) {
  const body = generateHTML(version.contentJson, editorExtensions);
  const header = draft.headerHtml ? `<div style="color:#666;font-size:11px;border-bottom:1px solid #ccc;margin-bottom:12px;">${draft.headerHtml}</div>` : "";
  const footer = draft.footerHtml ? `<div style="color:#666;font-size:11px;border-top:1px solid #ccc;margin-top:12px;">${draft.footerHtml}</div>` : "";
  return `<html><head><meta charset="utf-8"></head><body>${header}${body}${footer}</body></html>`;
}

export function exportDraftAsWord(draft, version, filename) {
  const html = draftWordHtml(draft, version);
  const safeTitle = (draft.title || "draft").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  downloadBlob(new Blob(["﻿", html], { type: "application/msword" }), filename || `${safeTitle}-${version.label}.doc`);
}
