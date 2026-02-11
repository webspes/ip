const translations: Record<string, Record<string, string>> = {
  en: {
    "header.title": "IP Address",
    "header.subtitle": "Visitor Identity",
    "header.authorized": "Authorized Access",
    "error.title": "Connection Error",
    "error.description": "Unable to verify your IP address.",
    "form.title": "AI Name Generator",
    "form.description": "Describe your project and let AI check domain availability for you.",
    "form.topic.label": "Instructions / Topic",
    "form.topic.placeholder": "e.g., A minimalist coffee shop for developers in Oslo...",
    "form.count.label": "How many names? (1-100)",
    "form.submit": "Generate Names",
    "form.loading": "Generating & Checking Domains...",
    "results.title": "Results",
    "results.available": "Available",
    "results.taken": "Taken",
    "server.title": "Server Identity",
  },
  no: {
    "header.title": "IP-adresse",
    "header.subtitle": "Besøkendes identitet",
    "header.authorized": "Autorisert tilgang",
    "error.title": "Tilkoblingsfeil",
    "error.description": "Kunne ikke verifisere IP-adressen din.",
    "form.title": "AI Navnegenerator",
    "form.description": "Beskriv prosjektet ditt og la AI sjekke domenetilgjengelighet for deg.",
    "form.topic.label": "Instruksjoner / Tema",
    "form.topic.placeholder": "f.eks. En minimalistisk kaffebar for utviklere i Oslo...",
    "form.count.label": "Hvor mange navn? (1-100)",
    "form.submit": "Generer navn",
    "form.loading": "Genererer og sjekker domener...",
    "results.title": "Resultater",
    "results.available": "Ledig",
    "results.taken": "Opptatt",
    "server.title": "Serverens identitet",
  },
};

const aliasMaps: Record<string, string> = {
  nb: "no",
  nn: "no",
};

function detectLanguage(): string {
  const lang = navigator.language?.split("-")[0] || "en";
  if (translations[lang]) return lang;
  if (aliasMaps[lang]) return aliasMaps[lang];
  return "en";
}

const currentLang = detectLanguage();

export function t(key: string): string {
  return translations[currentLang]?.[key] || translations["en"]?.[key] || key;
}
