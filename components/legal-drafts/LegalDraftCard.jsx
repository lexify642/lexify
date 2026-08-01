"use client";

import Link from "next/link";
import { LANGUAGES } from "@/data/legalDrafts";

const LANGUAGE_LABELS = Object.fromEntries(LANGUAGES.map((l) => [l.id, l.label]));

export default function LegalDraftCard({ category, activeLanguage }) {
  const languageLabel = LANGUAGE_LABELS[activeLanguage] ?? LANGUAGE_LABELS[category.languages[0]];

  return (
    <Link href={`/legal-drafts/${category.slug}`} className="card template-card legal-draft-card">
      <div className="template-icon legal-draft-icon">❐</div>
      <h3>{category.name}</h3>
      <p>{category.description}</p>
      <div className="legal-draft-footer">
        <span className="badge blue">{languageLabel}</span>
        <span className="link">Directory →</span>
      </div>
    </Link>
  );
}
