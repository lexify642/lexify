// Central Attachments store — the Document Library's single source of
// truth. Every file, wherever it enters the app (chat upload, camera
// capture, voice note, drag-drop, paste), becomes exactly one record here.
// "Attach to Case/Task/Calendar/Legal Draft/Documents Library" only ever
// sets a linkedX field on this same record — it never copies the file.
export const MIME_CATEGORIES = ["image", "video", "audio", "pdf", "word", "excel", "powerpoint", "zip", "other"];

export function categoryForFile(file) {
  const type = file.type || "";
  const name = (file.name || "").toLowerCase();
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".doc") || name.endsWith(".docx")) return "word";
  if (name.endsWith(".xls") || name.endsWith(".xlsx")) return "excel";
  if (name.endsWith(".ppt") || name.endsWith(".pptx")) return "powerpoint";
  if (name.endsWith(".zip") || name.endsWith(".rar") || name.endsWith(".7z")) return "zip";
  return "other";
}

export function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const initialAttachments = [];
