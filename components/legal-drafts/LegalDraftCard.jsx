"use client";

import Link from "next/link";
import { LANGUAGES, categoryName, categoryDescription, t } from "@/data/legalDrafts";

const LANGUAGE_LABELS = Object.fromEntries(LANGUAGES.map((l) => [l.id, l.label]));

export default function LegalDraftCard({ category, language }) {
  const languageLabel = LANGUAGE_LABELS[language] ?? LANGUAGE_LABELS[category.languages[0]];
  const href =
    language && language !== "english" ? `/legal-drafts/${category.slug}?language=${language}` : `/legal-drafts/${category.slug}`;

  return (
    <Link href={href} className="card template-card legal-draft-card">
      <div className="template-icon legal-draft-icon">❐</div>
      <h3>{categoryName(category, language)}</h3>
      <p>{categoryDescription(category, language)}</p>
      <div className="legal-draft-footer">
        <span className="badge blue">{languageLabel}</span>
        <span className="link">{t(language, "directory")} →</span>
      </div>
    </Link>
  );
}
