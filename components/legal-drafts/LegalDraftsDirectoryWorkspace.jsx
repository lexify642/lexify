"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LANGUAGES,
  NATIVE_LANGUAGE_NAMES,
  PRACTICE_AREAS,
  LEGAL_DRAFT_CATEGORIES,
  categoryName,
  categoryDescription,
  translatePracticeArea,
  t,
} from "@/data/legalDrafts";
import LegalDraftCard from "./LegalDraftCard";

const LANGUAGE_IDS = LANGUAGES.map((l) => l.id);

export default function LegalDraftsDirectoryWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlLanguage = searchParams.get("language");
  const initialLanguage = LANGUAGE_IDS.includes(urlLanguage) ? urlLanguage : "english";

  const [language, setLanguage] = useState(initialLanguage);
  const [search, setSearch] = useState("");
  const [practiceArea, setPracticeArea] = useState("");

  // Single source of truth for the selected language, persisted to the URL
  // (same useSearchParams/router.replace pattern already used by
  // CaseResearchWorkspace) so it survives navigating into a category page.
  function handleLanguageChange(next) {
    setLanguage(next);
    router.replace(`/legal-drafts${next !== "english" ? `?language=${next}` : ""}`, { scroll: false });
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return LEGAL_DRAFT_CATEGORIES.filter((c) => {
      if (!c.languages.includes(language)) return false;
      if (practiceArea && c.practiceArea !== practiceArea) return false;
      if (term) {
        const name = categoryName(c, language).toLowerCase();
        const desc = categoryDescription(c, language).toLowerCase();
        if (!(name.includes(term) || desc.includes(term))) return false;
      }
      return true;
    });
  }, [language, search, practiceArea]);

  const nativeLanguageLabel = NATIVE_LANGUAGE_NAMES[language];

  return (
    <div className="page">
      <div className="heading-row">
        <div>
          <h1 className="page-title">{t(language, "pageTitle")}</h1>
          <p className="page-subtitle">{t(language, "pageSubtitle")}</p>
        </div>
      </div>

      <div className="language-select">
        {LANGUAGES.map((l) => (
          <button
            key={l.id}
            type="button"
            className={`language-btn${language === l.id ? " active" : ""}`}
            onClick={() => handleLanguageChange(l.id)}
          >
            {l.label}
          </button>
        ))}
      </div>

      <section className="card">
        <div className="library-controls">
          <div className="search">
            <span>⌕</span>
            <input placeholder={t(language, "searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={practiceArea} onChange={(e) => setPracticeArea(e.target.value)} aria-label={t(language, "practiceArea")}>
            <option value="">{t(language, "allPracticeAreas")}</option>
            {PRACTICE_AREAS.map((p) => (
              <option key={p} value={p}>
                {translatePracticeArea(p, language)}
              </option>
            ))}
          </select>
        </div>
        <p className="library-summary">{t(language, "countLabel", filtered.length, nativeLanguageLabel)}</p>
      </section>

      {filtered.length ? (
        <div className="legal-draft-grid">
          {filtered.map((c) => (
            <LegalDraftCard category={c} language={language} key={c.id} />
          ))}
        </div>
      ) : (
        <div className="no-cases">
          <b>{t(language, "noResultsTitle")}</b>
          <span>{t(language, "noResultsBody")}</span>
        </div>
      )}
    </div>
  );
}
