const translations: Record<string, Record<string, string>> = {
  en: {
    "header.title": "IP Address",
    "header.subtitle": "Visitor Identity",
    "header.authorized": "Authorized Access",
    "error.title": "Connection Error",
    "error.description": "Unable to verify your IP address.",
    "server.title": "Server Identity",
    "server.outbound": "Outbound IP",
    "server.interfaces": "Network Interfaces",
  },
  no: {
    "header.title": "IP-adresse",
    "header.subtitle": "Besøkendes identitet",
    "header.authorized": "Autorisert tilgang",
    "error.title": "Tilkoblingsfeil",
    "error.description": "Kunne ikke verifisere IP-adressen din.",
    "server.title": "Serverens identitet",
    "server.outbound": "Utgående IP",
    "server.interfaces": "Nettverksgrensesnitt",
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
