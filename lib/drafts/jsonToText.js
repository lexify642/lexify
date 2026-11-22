import "server-only";

// Server-safe duplicate of components/draft/editor/extensions.js's
// jsonToText() — deliberately NOT importing that module here, since it
// builds real Tiptap/ProseMirror extension instances as a module-level side
// effect (buildExtensions() runs on import), which is fine in the browser
// but an unnecessary risk to pull into a Route Handler that only needs this
// one pure, self-contained recursive walk over plain JSON.
export function jsonToText(node) {
  if (!node) return "";
  if (node.type === "text") return node.text || "";
  if (node.type === "footnoteRef") return "";
  if (node.type === "referenceField") return node.attrs?.label || "";
  const childText = (node.content || []).map(jsonToText).join("");
  const BLOCK_TYPES = ["paragraph", "legalParagraph", "heading", "legalHeading", "tableCell", "tableHeader", "listItem", "blockquote"];
  return BLOCK_TYPES.includes(node.type) ? `${childText}\n` : childText;
}
