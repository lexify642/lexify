// Legal Drafts / Legal Formats directory — mock data shaped so it can later
// be swapped for a real database/API without changing any component code.
// Every category (and every affidavit sub-type) carries a `translations`
// object keyed by language id, so switching language changes ALL visible
// content, not just a badge. `downloadUrl`/`previewUrl` are real fields on
// every downloadable item — placeholders today, wired to the actual
// download/preview actions, not faked.

export const LANGUAGES = [
  { id: "english", label: "English" },
  { id: "hindi", label: "Hindi" },
  { id: "marathi", label: "Marathi" },
  { id: "gujarati", label: "Gujarati" },
];

// Native-script names, used only *inside* translated sentences (e.g. "12
// drafts available in हिंदी") — the language selector buttons themselves
// stay in English per the reference design.
export const NATIVE_LANGUAGE_NAMES = { english: "English", hindi: "हिंदी", marathi: "मराठी", gujarati: "ગુજરાતી" };

const ALL_LANGUAGES = LANGUAGES.map((l) => l.id);

export const PRACTICE_AREAS = [
  "Civil Law",
  "Criminal Law",
  "Corporate Law",
  "Family Law",
  "Property Law",
  "Employment Law",
  "Tax Law",
  "Arbitration",
  "Commercial Law",
  "Banking & Finance",
  "Intellectual Property",
  "Consumer Law",
];

// Practice-area filter option labels also change with the selected language;
// the canonical English string above stays the filtering key.
export const PRACTICE_AREA_TRANSLATIONS = {
  "Civil Law": { english: "Civil Law", hindi: "दीवानी कानून", marathi: "दिवाणी कायदा", gujarati: "સિવિલ કાયદો" },
  "Criminal Law": { english: "Criminal Law", hindi: "आपराधिक कानून", marathi: "फौजदारी कायदा", gujarati: "ફોજદારી કાયદો" },
  "Corporate Law": { english: "Corporate Law", hindi: "कॉर्पोरेट कानून", marathi: "कॉर्पोरेट कायदा", gujarati: "કોર્પોરેટ કાયદો" },
  "Family Law": { english: "Family Law", hindi: "पारिवारिक कानून", marathi: "कौटुंबिक कायदा", gujarati: "કૌટુંબિક કાયદો" },
  "Property Law": { english: "Property Law", hindi: "संपत्ति कानून", marathi: "मालमत्ता कायदा", gujarati: "મિલકત કાયદો" },
  "Employment Law": { english: "Employment Law", hindi: "रोजगार कानून", marathi: "नोकरी कायदा", gujarati: "રોજગાર કાયદો" },
  "Tax Law": { english: "Tax Law", hindi: "कर कानून", marathi: "कर कायदा", gujarati: "કર કાયદો" },
  Arbitration: { english: "Arbitration", hindi: "मध्यस्थता", marathi: "लवाद", gujarati: "આર્બિટ્રેશન" },
  "Commercial Law": { english: "Commercial Law", hindi: "वाणिज्यिक कानून", marathi: "वाणिज्यिक कायदा", gujarati: "વ્યાપારી કાયદો" },
  "Banking & Finance": { english: "Banking & Finance", hindi: "बैंकिंग एवं वित्त", marathi: "बँकिंग व वित्त", gujarati: "બેંકિંગ અને ફાઇનાન્સ" },
  "Intellectual Property": { english: "Intellectual Property", hindi: "बौद्धिक संपदा", marathi: "बौद्धिक संपदा", gujarati: "બૌદ્ધિક સંપત્તિ" },
  "Consumer Law": { english: "Consumer Law", hindi: "उपभोक्ता कानून", marathi: "ग्राहक कायदा", gujarati: "ગ્રાહક કાયદો" },
};

export function translatePracticeArea(practiceArea, language) {
  return PRACTICE_AREA_TRANSLATIONS[practiceArea]?.[language] ?? practiceArea;
}

// Central translation dictionary for every piece of UI chrome — no strings
// scattered through components. Functions are used wherever the sentence
// needs to interpolate a count/name (word order differs by language, so a
// single English template can't just be re-used with swapped nouns).
export const UI_TRANSLATIONS = {
  english: {
    pageTitle: "Legal Drafts Directory",
    pageSubtitle: "Browse ready-to-use legal draft formats by category, practice area and language.",
    searchPlaceholder: "Search legal drafts, agreements, affidavits, notices...",
    allPracticeAreas: "All practice areas",
    countLabel: (count, lang) => `${count} draft categor${count === 1 ? "y" : "ies"} available in ${lang}.`,
    noResultsTitle: "No legal drafts found",
    noResultsBody: "Try a different search term, language or practice area.",
    directory: "Directory",
    backToDirectory: "Back to Directory",
    practiceArea: "Practice Area",
    languagesAvailable: "Language(s) available",
    download: "Download",
    preview: "Preview",
    close: "Close",
    downloadButton: (name) => `Download ${name}`,
    genericSearchPlaceholder: (name) => `Search ${name} formats...`,
    noMatchingFormats: "No matching formats",
    tryDifferentSearch: "Try a different search term.",
    previewNote: "Preview will display the actual document once a document source is connected.",
    notFound: (slug) => `No legal draft category found for "${slug}".`,
  },
  hindi: {
    pageTitle: "कानूनी ड्राफ्ट निर्देशिका",
    pageSubtitle: "श्रेणी, अभ्यास क्षेत्र और भाषा के अनुसार तैयार कानूनी ड्राफ्ट प्रारूप ब्राउज़ करें।",
    searchPlaceholder: "कानूनी ड्राफ्ट, समझौते, शपथपत्र, नोटिस आदि खोजें...",
    allPracticeAreas: "सभी अभ्यास क्षेत्र",
    countLabel: (count, lang) => `${lang} में उपलब्ध ${count} ड्राफ्ट श्रेणियाँ।`,
    noResultsTitle: "कोई कानूनी ड्राफ्ट नहीं मिला",
    noResultsBody: "कोई भिन्न खोज शब्द, भाषा या अभ्यास क्षेत्र आज़माएँ।",
    directory: "निर्देशिका",
    backToDirectory: "निर्देशिका पर वापस जाएँ",
    practiceArea: "अभ्यास क्षेत्र",
    languagesAvailable: "उपलब्ध भाषाएँ",
    download: "डाउनलोड करें",
    preview: "पूर्वावलोकन",
    close: "बंद करें",
    downloadButton: (name) => `${name} डाउनलोड करें`,
    genericSearchPlaceholder: (name) => `${name} खोजें...`,
    noMatchingFormats: "कोई मेल खाता प्रारूप नहीं मिला",
    tryDifferentSearch: "कोई भिन्न खोज शब्द आज़माएँ।",
    previewNote: "दस्तावेज़ स्रोत जुड़ने के बाद यहाँ वास्तविक दस्तावेज़ का पूर्वावलोकन दिखाई देगा।",
    notFound: (slug) => `"${slug}" के लिए कोई कानूनी ड्राफ्ट श्रेणी नहीं मिली।`,
  },
  marathi: {
    pageTitle: "कायदेशीर मसुदा निर्देशिका",
    pageSubtitle: "श्रेणी, सराव क्षेत्र व भाषेनुसार तयार कायदेशीर मसुदा नमुने पहा.",
    searchPlaceholder: "कायदेशीर मसुदे, करार, प्रतिज्ञापत्र, नोटिस इत्यादी शोधा...",
    allPracticeAreas: "सर्व सराव क्षेत्र",
    countLabel: (count, lang) => `${lang} मध्ये उपलब्ध ${count} मसुदा श्रेण्या.`,
    noResultsTitle: "कोणतेही कायदेशीर मसुदे आढळले नाहीत",
    noResultsBody: "वेगळा शोध शब्द, भाषा किंवा सराव क्षेत्र वापरून पहा.",
    directory: "निर्देशिका",
    backToDirectory: "निर्देशिकेकडे परत जा",
    practiceArea: "सराव क्षेत्र",
    languagesAvailable: "उपलब्ध भाषा",
    download: "डाउनलोड करा",
    preview: "पूर्वावलोकन",
    close: "बंद करा",
    downloadButton: (name) => `${name} डाउनलोड करा`,
    genericSearchPlaceholder: (name) => `${name} शोधा...`,
    noMatchingFormats: "जुळणारे नमुने आढळले नाहीत",
    tryDifferentSearch: "वेगळा शोध शब्द वापरून पहा.",
    previewNote: "दस्तऐवज स्रोत जोडल्यानंतर येथे प्रत्यक्ष दस्तऐवजाचे पूर्वावलोकन दिसेल.",
    notFound: (slug) => `"${slug}" साठी कोणतीही कायदेशीर मसुदा श्रेणी आढळली नाही.`,
  },
  gujarati: {
    pageTitle: "કાનૂની ડ્રાફ્ટ ડિરેક્ટરી",
    pageSubtitle: "કેટેગરી, પ્રેક્ટિસ ક્ષેત્ર અને ભાષા પ્રમાણે તૈયાર કાનૂની ડ્રાફ્ટ ફોર્મેટ બ્રાઉઝ કરો.",
    searchPlaceholder: "કાનૂની ડ્રાફ્ટ, કરાર, સોગંદનામા, નોટિસ વગેરે શોધો...",
    allPracticeAreas: "બધા પ્રેક્ટિસ ક્ષેત્રો",
    countLabel: (count, lang) => `${lang} માં ઉપલબ્ધ ${count} ડ્રાફ્ટ કેટેગરી.`,
    noResultsTitle: "કોઈ કાનૂની ડ્રાફ્ટ મળ્યા નથી",
    noResultsBody: "અલગ શોધ શબ્દ, ભાષા અથવા પ્રેક્ટિસ ક્ષેત્ર અજમાવો.",
    directory: "ડિરેક્ટરી",
    backToDirectory: "ડિરેક્ટરી પર પાછા જાઓ",
    practiceArea: "પ્રેક્ટિસ ક્ષેત્ર",
    languagesAvailable: "ઉપલબ્ધ ભાષાઓ",
    download: "ડાઉનલોડ કરો",
    preview: "પૂર્વાવલોકન",
    close: "બંધ કરો",
    downloadButton: (name) => `${name} ડાઉનલોડ કરો`,
    genericSearchPlaceholder: (name) => `${name} શોધો...`,
    noMatchingFormats: "કોઈ મેળ ખાતું ફોર્મેટ મળ્યું નથી",
    tryDifferentSearch: "અલગ શોધ શબ્દ અજમાવો.",
    previewNote: "દસ્તાવેજ સ્ત્રોત જોડાયા પછી અહીં વાસ્તવિક દસ્તાવેજનું પૂર્વાવલોકન દેખાશે.",
    notFound: (slug) => `"${slug}" માટે કોઈ કાનૂની ડ્રાફ્ટ કેટેગરી મળી નથી.`,
  },
};

export function t(language, key, ...args) {
  const dict = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.english;
  const entry = dict[key] ?? UI_TRANSLATIONS.english[key];
  return typeof entry === "function" ? entry(...args) : entry;
}

// Affidavit is the one category with a real sub-directory today — the
// pattern (a `subTypes` array) is generic, so any other category can grow
// one later without a schema change.
const AFFIDAVIT_SUB_TYPES = [
  {
    id: "general",
    translations: {
      english: { name: "General Affidavit" },
      hindi: { name: "सामान्य शपथपत्र" },
      marathi: { name: "सर्वसाधारण प्रतिज्ञापत्र" },
      gujarati: { name: "સામાન્ય સોગંદનામું" },
    },
    downloadUrl: "/documents/affidavit/general.pdf",
    previewUrl: "/documents/affidavit/general.pdf",
  },
  {
    id: "name-change",
    translations: {
      english: { name: "Affidavit for Name Change" },
      hindi: { name: "नाम परिवर्तन के लिए शपथपत्र" },
      marathi: { name: "नाव बदलण्यासाठी प्रतिज्ञापत्र" },
      gujarati: { name: "નામ બદલવા માટેનું સોગંદનામું" },
    },
    downloadUrl: "/documents/affidavit/name-change.pdf",
    previewUrl: "/documents/affidavit/name-change.pdf",
  },
  {
    id: "address-proof",
    translations: {
      english: { name: "Affidavit for Address Proof" },
      hindi: { name: "पता प्रमाण के लिए शपथपत्र" },
      marathi: { name: "पत्ता पुराव्यासाठी प्रतिज्ञापत्र" },
      gujarati: { name: "સરનામાના પુરાવા માટેનું સોગંદનામું" },
    },
    downloadUrl: "/documents/affidavit/address-proof.pdf",
    previewUrl: "/documents/affidavit/address-proof.pdf",
  },
  {
    id: "date-of-birth",
    translations: {
      english: { name: "Affidavit for Date of Birth" },
      hindi: { name: "जन्म तिथि के लिए शपथपत्र" },
      marathi: { name: "जन्मतारखेसाठी प्रतिज्ञापत्र" },
      gujarati: { name: "જન્મ તારીખ માટેનું સોગંદનામું" },
    },
    downloadUrl: "/documents/affidavit/date-of-birth.pdf",
    previewUrl: "/documents/affidavit/date-of-birth.pdf",
  },
  {
    id: "income",
    translations: {
      english: { name: "Affidavit for Income" },
      hindi: { name: "आय के लिए शपथपत्र" },
      marathi: { name: "उत्पन्नासाठी प्रतिज्ञापत्र" },
      gujarati: { name: "આવક માટેનું સોગંદનામું" },
    },
    downloadUrl: "/documents/affidavit/income.pdf",
    previewUrl: "/documents/affidavit/income.pdf",
  },
  {
    id: "marriage",
    translations: {
      english: { name: "Affidavit for Marriage" },
      hindi: { name: "विवाह के लिए शपथपत्र" },
      marathi: { name: "विवाहासाठी प्रतिज्ञापत्र" },
      gujarati: { name: "લગ્ન માટેનું સોગંદનામું" },
    },
    downloadUrl: "/documents/affidavit/marriage.pdf",
    previewUrl: "/documents/affidavit/marriage.pdf",
  },
  {
    id: "divorce",
    translations: {
      english: { name: "Affidavit for Divorce" },
      hindi: { name: "तलाक के लिए शपथपत्र" },
      marathi: { name: "घटस्फोटासाठी प्रतिज्ञापत्र" },
      gujarati: { name: "છૂટાછેડા માટેનું સોગંદનામું" },
    },
    downloadUrl: "/documents/affidavit/divorce.pdf",
    previewUrl: "/documents/affidavit/divorce.pdf",
  },
  {
    id: "lost-documents",
    translations: {
      english: { name: "Affidavit for Lost Documents" },
      hindi: { name: "खोए हुए दस्तावेज़ के लिए शपथपत्र" },
      marathi: { name: "हरवलेल्या कागदपत्रांसाठी प्रतिज्ञापत्र" },
      gujarati: { name: "ખોવાયેલા દસ્તાવેજો માટેનું સોગંદનામું" },
    },
    downloadUrl: "/documents/affidavit/lost-documents.pdf",
    previewUrl: "/documents/affidavit/lost-documents.pdf",
  },
  {
    id: "correction-of-name",
    translations: {
      english: { name: "Affidavit for Correction of Name" },
      hindi: { name: "नाम सुधार के लिए शपथपत्र" },
      marathi: { name: "नाव दुरुस्तीसाठी प्रतिज्ञापत्र" },
      gujarati: { name: "નામ સુધારણા માટેનું સોગંદનામું" },
    },
    downloadUrl: "/documents/affidavit/correction-of-name.pdf",
    previewUrl: "/documents/affidavit/correction-of-name.pdf",
  },
  {
    id: "educational-purpose",
    translations: {
      english: { name: "Affidavit for Educational Purpose" },
      hindi: { name: "शैक्षणिक प्रयोजन के लिए शपथपत्र" },
      marathi: { name: "शैक्षणिक प्रयोजनासाठी प्रतिज्ञापत्र" },
      gujarati: { name: "શૈક્ષણિક હેતુ માટેનું સોગંદનામું" },
    },
    downloadUrl: "/documents/affidavit/educational-purpose.pdf",
    previewUrl: "/documents/affidavit/educational-purpose.pdf",
  },
  {
    id: "passport",
    translations: {
      english: { name: "Affidavit for Passport" },
      hindi: { name: "पासपोर्ट के लिए शपथपत्र" },
      marathi: { name: "पासपोर्टसाठी प्रतिज्ञापत्र" },
      gujarati: { name: "પાસપોર્ટ માટેનું સોગંદનામું" },
    },
    downloadUrl: "/documents/affidavit/passport.pdf",
    previewUrl: "/documents/affidavit/passport.pdf",
  },
  {
    id: "gst",
    translations: {
      english: { name: "Affidavit for GST" },
      hindi: { name: "GST के लिए शपथपत्र" },
      marathi: { name: "GST साठी प्रतिज्ञापत्र" },
      gujarati: { name: "GST માટેનું સોગંદનામું" },
    },
    downloadUrl: "/documents/affidavit/gst.pdf",
    previewUrl: "/documents/affidavit/gst.pdf",
  },
  {
    id: "income-tax",
    translations: {
      english: { name: "Affidavit for Income Tax" },
      hindi: { name: "आयकर के लिए शपथपत्र" },
      marathi: { name: "आयकरासाठी प्रतिज्ञापत्र" },
      gujarati: { name: "આવકવેરા માટેનું સોગંદનામું" },
    },
    downloadUrl: "/documents/affidavit/income-tax.pdf",
    previewUrl: "/documents/affidavit/income-tax.pdf",
  },
  {
    id: "company",
    translations: {
      english: { name: "Affidavit for Company" },
      hindi: { name: "कंपनी के लिए शपथपत्र" },
      marathi: { name: "कंपनीसाठी प्रतिज्ञापत्र" },
      gujarati: { name: "કંપની માટેનું સોગંદનામું" },
    },
    downloadUrl: "/documents/affidavit/company.pdf",
    previewUrl: "/documents/affidavit/company.pdf",
  },
  {
    id: "property",
    translations: {
      english: { name: "Affidavit for Property" },
      hindi: { name: "संपत्ति के लिए शपथपत्र" },
      marathi: { name: "मालमत्तेसाठी प्रतिज्ञापत्र" },
      gujarati: { name: "મિલકત માટેનું સોગંદનામું" },
    },
    downloadUrl: "/documents/affidavit/property.pdf",
    previewUrl: "/documents/affidavit/property.pdf",
  },
  {
    id: "court-proceedings",
    translations: {
      english: { name: "Affidavit for Court Proceedings" },
      hindi: { name: "न्यायालयीन कार्यवाही के लिए शपथपत्र" },
      marathi: { name: "न्यायालयीन कार्यवाहीसाठी प्रतिज्ञापत्र" },
      gujarati: { name: "કોર્ટની કાર્યવાહી માટેનું સોગંદનામું" },
    },
    downloadUrl: "/documents/affidavit/court-proceedings.pdf",
    previewUrl: "/documents/affidavit/court-proceedings.pdf",
  },
  {
    id: "bail",
    translations: {
      english: { name: "Affidavit for Bail" },
      hindi: { name: "जमानत के लिए शपथपत्र" },
      marathi: { name: "जामिनासाठी प्रतिज्ञापत्र" },
      gujarati: { name: "જામીન માટેનું સોગંદનામું" },
    },
    downloadUrl: "/documents/affidavit/bail.pdf",
    previewUrl: "/documents/affidavit/bail.pdf",
  },
  {
    id: "undertaking",
    translations: {
      english: { name: "Affidavit of Undertaking" },
      hindi: { name: "वचनबद्धता का शपथपत्र" },
      marathi: { name: "हमीपत्र" },
      gujarati: { name: "બાંહેધરીનું સોગંદનામું" },
    },
    downloadUrl: "/documents/affidavit/undertaking.pdf",
    previewUrl: "/documents/affidavit/undertaking.pdf",
  },
  {
    id: "no-objection",
    translations: {
      english: { name: "Affidavit of No Objection" },
      hindi: { name: "अनापत्ति का शपथपत्र" },
      marathi: { name: "ना हरकत प्रतिज्ञापत्र" },
      gujarati: { name: "ના વાંધા પ્રમાણપત્ર માટેનું સોગંદનામું" },
    },
    downloadUrl: "/documents/affidavit/no-objection.pdf",
    previewUrl: "/documents/affidavit/no-objection.pdf",
  },
  {
    id: "relationship",
    translations: {
      english: { name: "Affidavit of Relationship" },
      hindi: { name: "संबंध का शपथपत्र" },
      marathi: { name: "नातेसंबंधाचे प्रतिज्ञापत्र" },
      gujarati: { name: "સંબંધનું સોગંદનામું" },
    },
    downloadUrl: "/documents/affidavit/relationship.pdf",
    previewUrl: "/documents/affidavit/relationship.pdf",
  },
];

export const LEGAL_DRAFT_CATEGORIES = [
  {
    id: "affidavit",
    slug: "affidavit",
    languages: ALL_LANGUAGES,
    practiceArea: "Civil Law",
    translations: {
      english: {
        name: "Affidavit Format",
        description: "Download Affidavit formats in India — civil, criminal, income tax, marriage, company & more.",
      },
      hindi: {
        name: "शपथपत्र प्रारूप",
        description: "भारत में दीवानी, आपराधिक, आयकर, विवाह, कंपनी आदि के लिए शपथपत्र प्रारूप डाउनलोड करें।",
      },
      marathi: {
        name: "प्रतिज्ञापत्र नमुना",
        description: "दिवाणी, फौजदारी, आयकर, विवाह, कंपनी इत्यादींसाठी भारतातील प्रतिज्ञापत्राचे नमुने डाउनलोड करा.",
      },
      gujarati: {
        name: "સોગંદનામું ફોર્મેટ",
        description: "ભારતમાં સિવિલ, ફોજદારી, આવકવેરા, લગ્ન, કંપની વગેરે માટે સોગંદનામાના ફોર્મેટ ડાઉનલોડ કરો.",
      },
    },
    searchPlaceholder: {
      english: "Search Affidavit Format formats...",
      hindi: "शपथपत्र प्रारूप खोजें...",
      marathi: "प्रतिज्ञापत्राचे नमुने शोधा...",
      gujarati: "સોગંદનામાના ફોર્મેટ શોધો...",
    },
    subTypes: AFFIDAVIT_SUB_TYPES,
  },
  {
    id: "agreement",
    slug: "agreement",
    languages: ALL_LANGUAGES,
    practiceArea: "Commercial Law",
    downloadUrl: "/documents/agreement.pdf",
    previewUrl: "/documents/agreement.pdf",
    translations: {
      english: {
        name: "Agreement Format",
        description: "Download Agreement format in India — sale, rent, partnership, loan, franchise & service agreements.",
      },
      hindi: {
        name: "करार प्रारूप",
        description: "भारत में करार प्रारूप डाउनलोड करें — विक्रय, किराया, साझेदारी, ऋण, फ्रैंचाइज़ी और सेवा करार।",
      },
      marathi: {
        name: "करार नमुना",
        description: "भारतातील करार नमुना डाउनलोड करा — विक्री, भाडे, भागीदारी, कर्ज, फ्रँचायझी व सेवा करार.",
      },
      gujarati: {
        name: "કરાર ફોર્મેટ",
        description: "ભારતમાં કરાર ફોર્મેટ ડાઉનલોડ કરો — વેચાણ, ભાડું, ભાગીદારી, લોન, ફ્રેન્ચાઇઝી અને સેવા કરાર.",
      },
    },
  },
  {
    id: "appeal",
    slug: "appeal",
    languages: ["english", "hindi"],
    practiceArea: "Civil Law",
    downloadUrl: "/documents/appeal.pdf",
    previewUrl: "/documents/appeal.pdf",
    translations: {
      english: {
        name: "Appeal Format",
        description: "Download professionally drafted Appeal formats, including Civil Appeal and Criminal Appeal formats.",
      },
      hindi: {
        name: "अपील प्रारूप",
        description: "व्यावसायिक रूप से तैयार अपील प्रारूप डाउनलोड करें, जिसमें दीवानी अपील और आपराधिक अपील प्रारूप शामिल हैं।",
      },
      marathi: {
        name: "अपील नमुना",
        description: "व्यावसायिकरित्या तयार केलेले अपील नमुने डाउनलोड करा, ज्यात दिवाणी अपील व फौजदारी अपील नमुन्यांचा समावेश आहे.",
      },
      gujarati: {
        name: "અપીલ ફોર્મેટ",
        description: "વ્યવસાયિક રીતે તૈયાર કરેલા અપીલ ફોર્મેટ ડાઉનલોડ કરો, જેમાં સિવિલ અપીલ અને ફોજદારી અપીલ ફોર્મેટનો સમાવેશ થાય છે.",
      },
    },
  },
  {
    id: "appointment",
    slug: "appointment",
    languages: ALL_LANGUAGES,
    practiceArea: "Employment Law",
    downloadUrl: "/documents/appointment.pdf",
    previewUrl: "/documents/appointment.pdf",
    translations: {
      english: {
        name: "Appointment",
        description: "Download Appointment Letter format in India for employees, managers, directors & consultants.",
      },
      hindi: {
        name: "नियुक्ति पत्र",
        description: "कर्मचारियों, प्रबंधकों, निदेशकों और सलाहकारों के लिए भारत में नियुक्ति पत्र प्रारूप डाउनलोड करें।",
      },
      marathi: {
        name: "नियुक्ती पत्र",
        description: "कर्मचारी, व्यवस्थापक, संचालक व सल्लागारांसाठी भारतातील नियुक्ती पत्र नमुना डाउनलोड करा.",
      },
      gujarati: {
        name: "નિમણૂક પત્ર",
        description: "કર્મચારીઓ, મેનેજરો, ડિરેક્ટરો અને સલાહકારો માટે ભારતમાં નિમણૂક પત્ર ફોર્મેટ ડાઉનલોડ કરો.",
      },
    },
  },
  {
    id: "apprenticeship-agreement",
    slug: "apprenticeship-agreement",
    languages: ["english", "hindi", "marathi"],
    practiceArea: "Employment Law",
    downloadUrl: "/documents/apprenticeship-agreement.pdf",
    previewUrl: "/documents/apprenticeship-agreement.pdf",
    translations: {
      english: {
        name: "Apprenticeship Agreement",
        description: "Download Apprenticeship Agreement format in India under Apprentices Act 1961 — minor & major apprentices.",
      },
      hindi: {
        name: "शिक्षुता करार",
        description: "प्रशिक्षु अधिनियम 1961 के तहत भारत में शिक्षुता करार प्रारूप डाउनलोड करें — नाबालिग और वयस्क प्रशिक्षु।",
      },
      marathi: {
        name: "शिकाऊ उमेदवारी करार",
        description: "प्रशिक्षणार्थी अधिनियम 1961 अंतर्गत भारतातील शिकाऊ उमेदवारी करार नमुना डाउनलोड करा — अल्पवयीन व सज्ञान प्रशिक्षणार्थी.",
      },
      gujarati: {
        name: "તાલીમાર્થી કરાર",
        description: "એપ્રેન્ટિસ અધિનિયમ 1961 હેઠળ ભારતમાં તાલીમાર્થી કરાર ફોર્મેટ ડાઉનલોડ કરો — સગીર અને પુખ્ત તાલીમાર્થીઓ.",
      },
    },
  },
  {
    id: "arbitration",
    slug: "arbitration",
    languages: ALL_LANGUAGES,
    practiceArea: "Arbitration",
    downloadUrl: "/documents/arbitration.pdf",
    previewUrl: "/documents/arbitration.pdf",
    translations: {
      english: {
        name: "Arbitration",
        description: "Download Arbitration format in India under Arbitration & Conciliation Act 1996 — agreements & clauses.",
      },
      hindi: {
        name: "मध्यस्थता",
        description: "मध्यस्थता एवं सुलह अधिनियम 1996 के तहत भारत में मध्यस्थता प्रारूप डाउनलोड करें — करार और शर्तें।",
      },
      marathi: {
        name: "लवाद",
        description: "लवाद व सामोपचार अधिनियम 1996 अंतर्गत भारतातील लवाद नमुना डाउनलोड करा — करार व कलमे.",
      },
      gujarati: {
        name: "આર્બિટ્રેશન",
        description: "આર્બિટ્રેશન અને સમાધાન અધિનિયમ 1996 હેઠળ ભારતમાં આર્બિટ્રેશન ફોર્મેટ ડાઉનલોડ કરો — કરાર અને કલમો.",
      },
    },
  },
  {
    id: "arbitration-agreement-notice",
    slug: "arbitration-agreement-notice",
    languages: ["english", "hindi"],
    practiceArea: "Arbitration",
    downloadUrl: "/documents/arbitration-agreement-notice.pdf",
    previewUrl: "/documents/arbitration-agreement-notice.pdf",
    translations: {
      english: {
        name: "Arbitration Agreement & Notice",
        description: "Download Arbitration Agreement & Notice formats in India under Section 7 & 21 of the Arbitration Act.",
      },
      hindi: {
        name: "मध्यस्थता करार एवं सूचना",
        description: "मध्यस्थता अधिनियम की धारा 7 और 21 के तहत भारत में मध्यस्थता करार एवं सूचना प्रारूप डाउनलोड करें।",
      },
      marathi: {
        name: "लवाद करार व नोटीस",
        description: "लवाद अधिनियमाच्या कलम 7 व 21 अंतर्गत भारतातील लवाद करार व नोटीस नमुने डाउनलोड करा.",
      },
      gujarati: {
        name: "આર્બિટ્રેશન કરાર અને નોટિસ",
        description: "આર્બિટ્રેશન અધિનિયમની કલમ 7 અને 21 હેઠળ ભારતમાં આર્બિટ્રેશન કરાર અને નોટિસ ફોર્મેટ ડાઉનલોડ કરો.",
      },
    },
  },
  {
    id: "arbitration-petitions-court-applications",
    slug: "arbitration-petitions-court-applications",
    languages: ["english"],
    practiceArea: "Arbitration",
    downloadUrl: "/documents/arbitration-petitions-court-applications.pdf",
    previewUrl: "/documents/arbitration-petitions-court-applications.pdf",
    translations: {
      english: {
        name: "Arbitration Petitions & Court Applications",
        description: "Download Arbitration Petitions & Court Applications in India — Section 9, 11, 16, 17, 34 & 36.",
      },
      hindi: {
        name: "मध्यस्थता याचिकाएं एवं न्यायालयीन आवेदन",
        description: "भारत में मध्यस्थता याचिकाएं एवं न्यायालयीन आवेदन डाउनलोड करें — धारा 9, 11, 16, 17, 34 और 36।",
      },
      marathi: {
        name: "लवाद याचिका व न्यायालयीन अर्ज",
        description: "भारतातील लवाद याचिका व न्यायालयीन अर्ज डाउनलोड करा — कलम 9, 11, 16, 17, 34 व 36.",
      },
      gujarati: {
        name: "આર્બિટ્રેશન અરજીઓ અને કોર્ટ અરજીઓ",
        description: "ભારતમાં આર્બિટ્રેશન અરજીઓ અને કોર્ટ અરજીઓ ડાઉનલોડ કરો — કલમ 9, 11, 16, 17, 34 અને 36.",
      },
    },
  },
  {
    id: "assignment-deed",
    slug: "assignment-deed",
    languages: ["english", "hindi", "gujarati"],
    practiceArea: "Intellectual Property",
    downloadUrl: "/documents/assignment-deed.pdf",
    previewUrl: "/documents/assignment-deed.pdf",
    translations: {
      english: {
        name: "Assignment Deed",
        description: "Download Assignment Deed format in India — debt, copyright, patent, trademark, lease & more.",
      },
      hindi: {
        name: "समनुदेशन विलेख",
        description: "भारत में समनुदेशन विलेख प्रारूप डाउनलोड करें — ऋण, कॉपीराइट, पेटेंट, ट्रेडमार्क, पट्टा और अधिक।",
      },
      marathi: {
        name: "हक्क हस्तांतरण पत्र",
        description: "भारतातील हक्क हस्तांतरण पत्र नमुना डाउनलोड करा — कर्ज, कॉपीराइट, पेटंट, ट्रेडमार्क, भाडेपट्टा व अधिक.",
      },
      gujarati: {
        name: "સોંપણી ખત",
        description: "ભારતમાં સોંપણી ખત ફોર્મેટ ડાઉનલોડ કરો — દેવું, કોપીરાઇટ, પેટન્ટ, ટ્રેડમાર્ક, ભાડાપટ્ટો અને વધુ.",
      },
    },
  },
  {
    id: "bail-application",
    slug: "bail-application",
    languages: ALL_LANGUAGES,
    practiceArea: "Criminal Law",
    downloadUrl: "/documents/bail-application.pdf",
    previewUrl: "/documents/bail-application.pdf",
    translations: {
      english: {
        name: "Bail Application",
        description: "Download Bail Application formats in India — regular, anticipatory & interim bail applications.",
      },
      hindi: {
        name: "जमानत आवेदन",
        description: "भारत में जमानत आवेदन प्रारूप डाउनलोड करें — नियमित, अग्रिम एवं अंतरिम जमानत आवेदन।",
      },
      marathi: {
        name: "जामीन अर्ज",
        description: "भारतातील जामीन अर्ज नमुने डाउनलोड करा — नियमित, अटकपूर्व व अंतरिम जामीन अर्ज.",
      },
      gujarati: {
        name: "જામીન અરજી",
        description: "ભારતમાં જામીન અરજી ફોર્મેટ ડાઉનલોડ કરો — નિયમિત, અગ્રિમ અને વચગાળાની જામીન અરજીઓ.",
      },
    },
  },
  {
    id: "partnership-deed",
    slug: "partnership-deed",
    languages: ALL_LANGUAGES,
    practiceArea: "Corporate Law",
    downloadUrl: "/documents/partnership-deed.pdf",
    previewUrl: "/documents/partnership-deed.pdf",
    translations: {
      english: {
        name: "Partnership Deed",
        description: "Download Partnership Deed format in India — general, LLP, family & limited partnerships.",
      },
      hindi: {
        name: "साझेदारी विलेख",
        description: "भारत में साझेदारी विलेख प्रारूप डाउनलोड करें — सामान्य, एलएलपी, पारिवारिक एवं सीमित साझेदारी।",
      },
      marathi: {
        name: "भागीदारी करारनामा",
        description: "भारतातील भागीदारी करारनामा नमुना डाउनलोड करा — सर्वसाधारण, एलएलपी, कौटुंबिक व मर्यादित भागीदारी.",
      },
      gujarati: {
        name: "ભાગીદારી ખત",
        description: "ભારતમાં ભાગીદારી ખત ફોર્મેટ ડાઉનલોડ કરો — સામાન્ય, એલએલપી, પારિવારિક અને મર્યાદિત ભાગીદારી.",
      },
    },
  },
  {
    id: "sale-deed",
    slug: "sale-deed",
    languages: ALL_LANGUAGES,
    practiceArea: "Property Law",
    downloadUrl: "/documents/sale-deed.pdf",
    previewUrl: "/documents/sale-deed.pdf",
    translations: {
      english: {
        name: "Sale Deed",
        description: "Download Sale Deed format in India for property, vehicle, business and movable/immovable assets.",
      },
      hindi: {
        name: "विक्रय विलेख",
        description: "संपत्ति, वाहन, व्यवसाय एवं चल/अचल परिसंपत्तियों के लिए भारत में विक्रय विलेख प्रारूप डाउनलोड करें।",
      },
      marathi: {
        name: "विक्रीपत्र",
        description: "मालमत्ता, वाहन, व्यवसाय व जंगम/स्थावर मालमत्तेसाठी भारतातील विक्रीपत्र नमुना डाउनलोड करा.",
      },
      gujarati: {
        name: "વેચાણ ખત",
        description: "મિલકત, વાહન, વ્યવસાય અને જંગમ/સ્થાવર મિલકત માટે ભારતમાં વેચાણ ખત ફોર્મેટ ડાઉનલોડ કરો.",
      },
    },
  },
  {
    id: "rent-agreement",
    slug: "rent-agreement",
    languages: ALL_LANGUAGES,
    practiceArea: "Property Law",
    downloadUrl: "/documents/rent-agreement.pdf",
    previewUrl: "/documents/rent-agreement.pdf",
    translations: {
      english: {
        name: "Rent Agreement",
        description: "Download Rent Agreement format in India — residential, commercial & leave and license agreements.",
      },
      hindi: {
        name: "किराया करार",
        description: "भारत में किराया करार प्रारूप डाउनलोड करें — आवासीय, वाणिज्यिक एवं लीव एंड लाइसेंस करार।",
      },
      marathi: {
        name: "भाडे करार",
        description: "भारतातील भाडे करार नमुना डाउनलोड करा — निवासी, व्यावसायिक व लीव्ह अँड लायसन्स करार.",
      },
      gujarati: {
        name: "ભાડા કરાર",
        description: "ભારતમાં ભાડા કરાર ફોર્મેટ ડાઉનલોડ કરો — રહેણાંક, વ્યાપારી અને લીવ એન્ડ લાયસન્સ કરાર.",
      },
    },
  },
  {
    id: "employment-agreement",
    slug: "employment-agreement",
    languages: ALL_LANGUAGES,
    practiceArea: "Employment Law",
    downloadUrl: "/documents/employment-agreement.pdf",
    previewUrl: "/documents/employment-agreement.pdf",
    translations: {
      english: {
        name: "Employment Agreement",
        description: "Download Employment Agreement format in India covering probation, confidentiality & termination.",
      },
      hindi: {
        name: "रोजगार करार",
        description: "परिवीक्षा, गोपनीयता एवं समाप्ति को कवर करने वाला भारत में रोजगार करार प्रारूप डाउनलोड करें।",
      },
      marathi: {
        name: "नोकरी करार",
        description: "प्रोबेशन, गोपनीयता व सेवासमाप्ती समाविष्ट असलेला भारतातील नोकरी करार नमुना डाउनलोड करा.",
      },
      gujarati: {
        name: "રોજગાર કરાર",
        description: "પ્રોબેશન, ગોપનીયતા અને સેવા સમાપ્તિને આવરી લેતું ભારતમાં રોજગાર કરાર ફોર્મેટ ડાઉનલોડ કરો.",
      },
    },
  },
  {
    id: "nda",
    slug: "nda",
    languages: ["english", "hindi"],
    practiceArea: "Corporate Law",
    downloadUrl: "/documents/nda.pdf",
    previewUrl: "/documents/nda.pdf",
    translations: {
      english: {
        name: "Non-Disclosure Agreement (NDA)",
        description: "Download NDA formats in India — unilateral, mutual & multi-party confidentiality agreements.",
      },
      hindi: {
        name: "गोपनीयता करार (एनडीए)",
        description: "भारत में एनडीए प्रारूप डाउनलोड करें — एकतरफा, पारस्परिक एवं बहु-पक्षीय गोपनीयता करार।",
      },
      marathi: {
        name: "गोपनीयता करार (एनडीए)",
        description: "भारतातील एनडीए नमुने डाउनलोड करा — एकतर्फी, परस्पर व बहु-पक्षीय गोपनीयता करार.",
      },
      gujarati: {
        name: "બિન-જાહેરાત કરાર (એનડીએ)",
        description: "ભારતમાં એનડીએ ફોર્મેટ ડાઉનલોડ કરો — એકતરફી, પરસ્પર અને બહુ-પક્ષીય ગોપનીયતા કરાર.",
      },
    },
  },
  {
    id: "power-of-attorney",
    slug: "power-of-attorney",
    languages: ALL_LANGUAGES,
    practiceArea: "Property Law",
    downloadUrl: "/documents/power-of-attorney.pdf",
    previewUrl: "/documents/power-of-attorney.pdf",
    translations: {
      english: {
        name: "Power of Attorney",
        description: "Download Power of Attorney formats in India — general, special & durable power of attorney.",
      },
      hindi: {
        name: "मुख्तारनामा",
        description: "भारत में मुख्तारनामा प्रारूप डाउनलोड करें — सामान्य, विशेष एवं स्थायी मुख्तारनामा।",
      },
      marathi: {
        name: "कुलमुखत्यारपत्र",
        description: "भारतातील कुलमुखत्यारपत्र नमुने डाउनलोड करा — सर्वसाधारण, विशेष व कायमस्वरूपी कुलमुखत्यारपत्र.",
      },
      gujarati: {
        name: "મુખત્યારનામું",
        description: "ભારતમાં મુખત્યારનામું ફોર્મેટ ડાઉનલોડ કરો — સામાન્ય, ખાસ અને કાયમી મુખત્યારનામું.",
      },
    },
  },
  {
    id: "legal-notice",
    slug: "legal-notice",
    languages: ALL_LANGUAGES,
    practiceArea: "Civil Law",
    downloadUrl: "/documents/legal-notice.pdf",
    previewUrl: "/documents/legal-notice.pdf",
    translations: {
      english: {
        name: "Legal Notice",
        description: "Download Legal Notice formats in India — recovery, defamation, eviction & cheque bounce notices.",
      },
      hindi: {
        name: "कानूनी सूचना",
        description: "भारत में कानूनी सूचना प्रारूप डाउनलोड करें — वसूली, मानहानि, बेदखली एवं चेक बाउंस सूचनाएं।",
      },
      marathi: {
        name: "कायदेशीर नोटीस",
        description: "भारतातील कायदेशीर नोटीस नमुने डाउनलोड करा — वसुली, बदनामी, बेदखली व धनादेश न वटणे यासंबंधी नोटीस.",
      },
      gujarati: {
        name: "કાનૂની નોટિસ",
        description: "ભારતમાં કાનૂની નોટિસ ફોર્મેટ ડાઉનલોડ કરો — વસૂલાત, બદનક્ષી, હકાલપટ્ટી અને ચેક બાઉન્સ નોટિસ.",
      },
    },
  },
  {
    id: "will",
    slug: "will",
    languages: ["english", "hindi", "marathi"],
    practiceArea: "Property Law",
    downloadUrl: "/documents/will.pdf",
    previewUrl: "/documents/will.pdf",
    translations: {
      english: {
        name: "Will",
        description: "Download Will format in India — registered and unregistered wills, codicils & testamentary documents.",
      },
      hindi: {
        name: "वसीयत",
        description: "भारत में वसीयत प्रारूप डाउनलोड करें — पंजीकृत एवं अपंजीकृत वसीयत, संहिताएं एवं वसीयती दस्तावेज़।",
      },
      marathi: {
        name: "मृत्युपत्र",
        description: "भारतातील मृत्युपत्र नमुना डाउनलोड करा — नोंदणीकृत व अनोंदणीकृत मृत्युपत्रे, पुरवणी व मृत्युपत्रीय दस्तऐवज.",
      },
      gujarati: {
        name: "વસિયતનામું",
        description: "ભારતમાં વસિયતનામું ફોર્મેટ ડાઉનલોડ કરો — નોંધાયેલ અને ન નોંધાયેલ વસિયતનામા, કોડિસિલ અને વસિયતી દસ્તાવેજો.",
      },
    },
  },
  {
    id: "gift-deed",
    slug: "gift-deed",
    languages: ["english", "hindi", "gujarati"],
    practiceArea: "Property Law",
    downloadUrl: "/documents/gift-deed.pdf",
    previewUrl: "/documents/gift-deed.pdf",
    translations: {
      english: {
        name: "Gift Deed",
        description: "Download Gift Deed format in India for movable and immovable property between relatives.",
      },
      hindi: {
        name: "उपहार विलेख",
        description: "रिश्तेदारों के बीच चल एवं अचल संपत्ति के लिए भारत में उपहार विलेख प्रारूप डाउनलोड करें।",
      },
      marathi: {
        name: "भेटपत्र",
        description: "नातेवाईकांमधील जंगम व स्थावर मालमत्तेसाठी भारतातील भेटपत्र नमुना डाउनलोड करा.",
      },
      gujarati: {
        name: "ભેટ ખત",
        description: "સંબંધીઓ વચ્ચે જંગમ અને સ્થાવર મિલકત માટે ભારતમાં ભેટ ખત ફોર્મેટ ડાઉનલોડ કરો.",
      },
    },
  },
  {
    id: "lease-agreement",
    slug: "lease-agreement",
    languages: ALL_LANGUAGES,
    practiceArea: "Property Law",
    downloadUrl: "/documents/lease-agreement.pdf",
    previewUrl: "/documents/lease-agreement.pdf",
    translations: {
      english: {
        name: "Lease Agreement",
        description: "Download Lease Agreement format in India — commercial, industrial & long-term lease deeds.",
      },
      hindi: {
        name: "पट्टा करार",
        description: "भारत में पट्टा करार प्रारूप डाउनलोड करें — वाणिज्यिक, औद्योगिक एवं दीर्घकालिक पट्टा विलेख।",
      },
      marathi: {
        name: "भाडेपट्टा करार",
        description: "भारतातील भाडेपट्टा करार नमुना डाउनलोड करा — व्यावसायिक, औद्योगिक व दीर्घकालीन भाडेपट्टा दस्तऐवज.",
      },
      gujarati: {
        name: "લીઝ કરાર",
        description: "ભારતમાં લીઝ કરાર ફોર્મેટ ડાઉનલોડ કરો — વ્યાપારી, ઔદ્યોગિક અને લાંબા ગાળાના લીઝ ખત.",
      },
    },
  },
  {
    id: "mou",
    slug: "mou",
    languages: ["english", "hindi"],
    practiceArea: "Commercial Law",
    downloadUrl: "/documents/mou.pdf",
    previewUrl: "/documents/mou.pdf",
    translations: {
      english: {
        name: "Memorandum of Understanding (MoU)",
        description: "Download MoU format in India for business collaborations, joint ventures & partnerships.",
      },
      hindi: {
        name: "समझौता ज्ञापन (एमओयू)",
        description: "व्यावसायिक सहयोग, संयुक्त उद्यम एवं साझेदारी के लिए भारत में एमओयू प्रारूप डाउनलोड करें।",
      },
      marathi: {
        name: "सामंजस्य करार (एमओयू)",
        description: "व्यावसायिक सहयोग, संयुक्त उपक्रम व भागीदारीसाठी भारतातील एमओयू नमुना डाउनलोड करा.",
      },
      gujarati: {
        name: "સમજૂતી કરાર (એમઓયુ)",
        description: "ભારતમાં વ્યાપારી સહયોગ, સંયુક્ત સાહસો અને ભાગીદારી માટે એમઓયુ ફોર્મેટ ડાઉનલોડ કરો.",
      },
    },
  },
  {
    id: "loan-agreement",
    slug: "loan-agreement",
    languages: ALL_LANGUAGES,
    practiceArea: "Banking & Finance",
    downloadUrl: "/documents/loan-agreement.pdf",
    previewUrl: "/documents/loan-agreement.pdf",
    translations: {
      english: {
        name: "Loan Agreement",
        description: "Download Loan Agreement format in India — personal, business & secured/unsecured loan deeds.",
      },
      hindi: {
        name: "ऋण करार",
        description: "भारत में ऋण करार प्रारूप डाउनलोड करें — व्यक्तिगत, व्यावसायिक एवं प्रतिभूत/अप्रतिभूत ऋण विलेख।",
      },
      marathi: {
        name: "कर्ज करार",
        description: "भारतातील कर्ज करार नमुना डाउनलोड करा — वैयक्तिक, व्यावसायिक व तारण/विनातारण कर्ज दस्तऐवज.",
      },
      gujarati: {
        name: "લોન કરાર",
        description: "ભારતમાં લોન કરાર ફોર્મેટ ડાઉનલોડ કરો — વ્યક્તિગત, વ્યાપારી અને સુરક્ષિત/અસુરક્ષિત લોન ખત.",
      },
    },
  },
  {
    id: "divorce-petition",
    slug: "divorce-petition",
    languages: ["english", "hindi", "marathi"],
    practiceArea: "Family Law",
    downloadUrl: "/documents/divorce-petition.pdf",
    previewUrl: "/documents/divorce-petition.pdf",
    translations: {
      english: {
        name: "Divorce Petition",
        description: "Download Divorce Petition formats in India — mutual consent & contested divorce petitions.",
      },
      hindi: {
        name: "तलाक याचिका",
        description: "भारत में तलाक याचिका प्रारूप डाउनलोड करें — आपसी सहमति एवं विवादित तलाक याचिकाएं।",
      },
      marathi: {
        name: "घटस्फोट याचिका",
        description: "भारतातील घटस्फोट याचिका नमुने डाउनलोड करा — परस्पर संमती व वादग्रस्त घटस्फोट याचिका.",
      },
      gujarati: {
        name: "છૂટાછેડા અરજી",
        description: "ભારતમાં છૂટાછેડા અરજી ફોર્મેટ ડાઉનલોડ કરો — પરસ્પર સંમતિ અને વિવાદિત છૂટાછેડા અરજીઓ.",
      },
    },
  },
  {
    id: "consumer-complaint",
    slug: "consumer-complaint",
    languages: ALL_LANGUAGES,
    practiceArea: "Consumer Law",
    downloadUrl: "/documents/consumer-complaint.pdf",
    previewUrl: "/documents/consumer-complaint.pdf",
    translations: {
      english: {
        name: "Consumer Complaint",
        description: "Download Consumer Complaint format in India under the Consumer Protection Act, 2019.",
      },
      hindi: {
        name: "उपभोक्ता शिकायत",
        description: "उपभोक्ता संरक्षण अधिनियम, 2019 के तहत भारत में उपभोक्ता शिकायत प्रारूप डाउनलोड करें।",
      },
      marathi: {
        name: "ग्राहक तक्रार",
        description: "ग्राहक संरक्षण अधिनियम, 2019 अंतर्गत भारतातील ग्राहक तक्रार नमुना डाउनलोड करा.",
      },
      gujarati: {
        name: "ગ્રાહક ફરિયાદ",
        description: "ગ્રાહક સુરક્ષા અધિનિયમ, 2019 હેઠળ ભારતમાં ગ્રાહક ફરિયાદ ફોર્મેટ ડાઉનલોડ કરો.",
      },
    },
  },
  {
    id: "writ-petition",
    slug: "writ-petition",
    languages: ["english"],
    practiceArea: "Civil Law",
    downloadUrl: "/documents/writ-petition.pdf",
    previewUrl: "/documents/writ-petition.pdf",
    translations: {
      english: {
        name: "Writ Petition",
        description: "Download Writ Petition format in India — habeas corpus, mandamus, certiorari & quo warranto.",
      },
      hindi: {
        name: "रिट याचिका",
        description: "भारत में रिट याचिका प्रारूप डाउनलोड करें — बंदी प्रत्यक्षीकरण, परमादेश, उत्प्रेषण एवं अधिकार पृच्छा।",
      },
      marathi: {
        name: "रिट याचिका",
        description: "भारतातील रिट याचिका नमुना डाउनलोड करा — बंदी प्रत्यक्षीकरण, परमादेश, उत्प्रेषण व अधिकार पृच्छा.",
      },
      gujarati: {
        name: "રિટ અરજી",
        description: "ભારતમાં રિટ અરજી ફોર્મેટ ડાઉનલોડ કરો — હેબિયસ કોર્પસ, મેન્ડમસ, સર્શિયોરરી અને ક્વો વોરંટો.",
      },
    },
  },
  {
    id: "plaint",
    slug: "plaint",
    languages: ["english", "hindi"],
    practiceArea: "Civil Law",
    downloadUrl: "/documents/plaint.pdf",
    previewUrl: "/documents/plaint.pdf",
    translations: {
      english: {
        name: "Plaint",
        description: "Download Plaint format in India for filing a civil suit under the Code of Civil Procedure, 1908.",
      },
      hindi: {
        name: "वाद पत्र",
        description: "सिविल प्रक्रिया संहिता, 1908 के तहत दीवानी वाद दायर करने हेतु भारत में वाद पत्र प्रारूप डाउनलोड करें।",
      },
      marathi: {
        name: "फिर्याद अर्ज",
        description: "दिवाणी प्रक्रिया संहिता, 1908 अंतर्गत दिवाणी दावा दाखल करण्यासाठी भारतातील फिर्याद अर्ज नमुना डाउनलोड करा.",
      },
      gujarati: {
        name: "ફરિયાદ અરજી",
        description: "સિવિલ પ્રોસિજર કોડ, 1908 હેઠળ સિવિલ દાવો દાખલ કરવા માટે ભારતમાં ફરિયાદ અરજી ફોર્મેટ ડાઉનલોડ કરો.",
      },
    },
  },
  {
    id: "written-statement",
    slug: "written-statement",
    languages: ["english", "hindi"],
    practiceArea: "Civil Law",
    downloadUrl: "/documents/written-statement.pdf",
    previewUrl: "/documents/written-statement.pdf",
    translations: {
      english: {
        name: "Written Statement",
        description: "Download Written Statement format in India for filing a defence to a civil suit.",
      },
      hindi: {
        name: "लिखित बयान",
        description: "दीवानी वाद के प्रतिवाद हेतु भारत में लिखित बयान प्रारूप डाउनलोड करें।",
      },
      marathi: {
        name: "लेखी जबाब",
        description: "दिवाणी दाव्याला बचाव सादर करण्यासाठी भारतातील लेखी जबाब नमुना डाउनलोड करा.",
      },
      gujarati: {
        name: "લેખિત નિવેદન",
        description: "સિવિલ દાવાનો બચાવ દાખલ કરવા માટે ભારતમાં લેખિત નિવેદન ફોર્મેટ ડાઉનલોડ કરો.",
      },
    },
  },
];

export function getCategoryBySlug(slug) {
  return LEGAL_DRAFT_CATEGORIES.find((c) => c.slug === slug) ?? null;
}

export function categoryName(category, language) {
  return category.translations[language]?.name ?? category.translations.english.name;
}

export function categoryDescription(category, language) {
  return category.translations[language]?.description ?? category.translations.english.description;
}

export function subTypeName(subType, language) {
  return subType.translations[language]?.name ?? subType.translations.english.name;
}
