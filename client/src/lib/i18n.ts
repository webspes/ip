const translations: Record<string, Record<string, string>> = {
  en: {
    "meta.title": "What is my IP address? – IPv4, ISP, country and hostname",
    "meta.description": "See your public IP address, ISP/ASN, country and reverse DNS instantly. Also works from the terminal: curl ip.webspes.run.apphost.no",
    "header.title": "IP Address",
    "header.subtitle": "Your public IP address",
    "header.authorized": "Authorized Access",
    "error.title": "Connection Error",
    "error.description": "Unable to verify your IP address.",
    "details.country": "Country",
    "details.network": "Network / ISP",
    "details.hostname": "Hostname (rDNS)",
    "details.version": "IP version",
    "details.unknown": "Unknown",
    "details.none": "None",
    "ipv6.title": "IPv6",
    "ipv6.check": "Check IPv6",
    "ipv6.checking": "Checking …",
    "ipv6.none": "No IPv6 connectivity from your network.",
    "ipv6.note": "This server only has IPv4, so the IPv6 check asks api6.ipify.org from your browser.",
    "browser.title": "Your browser",
    "browser.browser": "Browser",
    "browser.os": "Operating system",
    "browser.language": "Language",
    "browser.screen": "Screen",
    "browser.timezone": "Time zone",
    "terminal.title": "Use from the terminal",
    "terminal.ip": "Just the IP address",
    "terminal.json": "Everything as JSON",
    "terminal.v4": "IPv4 only",
    "server.title": "Server Identity",
    "server.outbound": "Outbound IP",
    "server.interfaces": "Network Interfaces",
    "footer.by": "A free tool from",
    "footer.dbip": "Country and network data: IP Geolocation by DB-IP",
  },
  no: {
    "meta.title": "Hva er IP-adressen min? – IPv4, nettleverandør, land og vertsnavn",
    "meta.description": "Se din offentlige IP-adresse, nettleverandør (ASN), land og reverse DNS med en gang. Virker også fra terminalen: curl ip.webspes.run.apphost.no",
    "header.title": "IP-adresse",
    "header.subtitle": "Din offentlige IP-adresse",
    "header.authorized": "Autorisert tilgang",
    "error.title": "Tilkoblingsfeil",
    "error.description": "Kunne ikke verifisere IP-adressen din.",
    "details.country": "Land",
    "details.network": "Nettverk / leverandør",
    "details.hostname": "Vertsnavn (rDNS)",
    "details.version": "IP-versjon",
    "details.unknown": "Ukjent",
    "details.none": "Ingen",
    "ipv6.title": "IPv6",
    "ipv6.check": "Sjekk IPv6",
    "ipv6.checking": "Sjekker …",
    "ipv6.none": "Nettverket ditt har ikke IPv6.",
    "ipv6.note": "Denne serveren har bare IPv4, så IPv6-sjekken spør api6.ipify.org fra nettleseren din.",
    "browser.title": "Nettleseren din",
    "browser.browser": "Nettleser",
    "browser.os": "Operativsystem",
    "browser.language": "Språk",
    "browser.screen": "Skjerm",
    "browser.timezone": "Tidssone",
    "terminal.title": "Bruk fra terminalen",
    "terminal.ip": "Bare IP-adressen",
    "terminal.json": "Alt som JSON",
    "terminal.v4": "Bare IPv4",
    "server.title": "Serverens identitet",
    "server.outbound": "Utgående IP",
    "server.interfaces": "Nettverksgrensesnitt",
    "footer.by": "Et gratis verktøy fra",
    "footer.dbip": "Land- og nettverksdata: IP Geolocation by DB-IP",
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

export const currentLang = detectLanguage();

export function t(key: string): string {
  return translations[currentLang]?.[key] || translations["en"]?.[key] || key;
}

/** Page language, title and description follow the visitor's language (index.html ships Norwegian). */
export function applyDocumentLanguage(): void {
  document.documentElement.lang = currentLang === "no" ? "nb" : "en";
  document.title = t("meta.title");
  document.querySelector('meta[name="description"]')?.setAttribute("content", t("meta.description"));
}
