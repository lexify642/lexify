"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Download, Eye } from "lucide-react";
import {
  LANGUAGES,
  categoryDescription,
  categoryName,
  getCategoryBySlug,
  subTypeName,
  t,
  translatePracticeArea,
} from "@/data/legalDrafts";
import PreviewModal from "./PreviewModal";

const LANGUAGE_IDS = LANGUAGES.map((l) => l.id);

// No fake "not connected" message — this is a real click handler wired to a
// real (placeholder-for-now) URL, using the same create-anchor-and-click
// technique as components/calculator/exporters.js's downloadBlob().
function triggerDownload(url) {
  const a = document.createElement("a");
  a.href = url;
  a.download = "";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// Categories with a `subTypes` array (Affidavit today) render as their own
// searchable mini-directory; every other category is a single-document leaf
// with a straightforward detail panel. Same component, driven entirely by
// data — no special-casing "Affidavit" in code. The selected language is
// read from the URL (?language=), the same query-param persistence pattern
// already used by CaseResearchWorkspace, so it survives the click-through
// from the main directory.
export default function LegalDraftCategoryWorkspace({ slug }) {
  const searchParams = useSearchParams();
  const urlLanguage = searchParams.get("language");
  const language = LANGUAGE_IDS.includes(urlLanguage) ? urlLanguage : "english";

  const category = getCategoryBySlug(slug);
  const [search, setSearch] = useState("");
  const [previewItem, setPreviewItem] = useState(null);

  const items = useMemo(() => {
    if (!category?.subTypes) return [];
    return category.subTypes.map((s) => ({
      id: s.id,
      name: subTypeName(s, language),
      downloadUrl: s.downloadUrl,
      previewUrl: s.previewUrl,
    }));
  }, [category, language]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((i) => i.name.toLowerCase().includes(term));
  }, [items, search]);

  if (!category) {
    return (
      <div className="page">
        <div className="empty-inline">{t(language, "notFound", slug)}</div>
      </div>
    );
  }

  const backHref = language !== "english" ? `/legal-drafts?language=${language}` : "/legal-drafts";
  const name = categoryName(category, language);
  const searchPlaceholder = category.subTypes
    ? category.searchPlaceholder?.[language] ?? t(language, "genericSearchPlaceholder", name)
    : null;

  function handleDownload(item) {
    triggerDownload(item.downloadUrl);
  }

  return (
    <div className="page">
      <div className="heading-row">
        <div>
          <p className="eyebrow">LEGAL DRAFTS</p>
          <h1 className="page-title">{name}</h1>
          <p className="page-subtitle">{categoryDescription(category, language)}</p>
        </div>
        <Link className="btn btn-outline" href={backHref}>
          ← {t(language, "backToDirectory")}
        </Link>
      </div>

      {category.subTypes ? (
        <>
          <section className="card">
            <div className="search" style={{ width: "100%" }}>
              <span>⌕</span>
              <input placeholder={searchPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </section>

          {filteredItems.length ? (
            <div className="legal-draft-subtype-grid">
              {filteredItems.map((item) => (
                <div className="legal-draft-subtype-card" key={item.id}>
                  <span>{item.name}</span>
                  <span className="icon-btn-group">
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={t(language, "preview")}
                      title={t(language, "preview")}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewItem(item);
                      }}
                    >
                      <Eye size={17} strokeWidth={1.8} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={t(language, "download")}
                      title={t(language, "download")}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(item);
                      }}
                    >
                      <Download size={17} strokeWidth={1.8} />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-cases">
              <b>{t(language, "noMatchingFormats")}</b>
              <span>{t(language, "tryDifferentSearch")}</span>
            </div>
          )}
        </>
      ) : (
        <section className="card">
          <div className="matter-meta">
            <span>
              <b>{translatePracticeArea(category.practiceArea, language)}</b>
              {t(language, "practiceArea")}
            </span>
            <span>
              <b>{category.languages.length}</b>
              {t(language, "languagesAvailable")}
            </span>
          </div>
          <div className="legal-draft-detail-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() =>
                setPreviewItem({ id: category.id, name, downloadUrl: category.downloadUrl, previewUrl: category.previewUrl })
              }
            >
              <Eye size={16} strokeWidth={2} /> {t(language, "preview")}
            </button>
            <button type="button" className="btn" onClick={() => handleDownload({ downloadUrl: category.downloadUrl })}>
              <Download size={16} strokeWidth={2} /> {t(language, "downloadButton", name)}
            </button>
          </div>
        </section>
      )}

      <PreviewModal
        open={!!previewItem}
        item={previewItem}
        language={language}
        onClose={() => setPreviewItem(null)}
        onDownload={handleDownload}
      />
    </div>
  );
}
