// Leitura simples do User-Agent para mostrar "dispositivo, navegador e SO" nas
// sessões — cobre os casos comuns sem precisar de uma biblioteca externa.
export function parseUserAgent(ua: string | null): { device: string; browser: string; os: string } {
  if (!ua) return { device: "Desconhecido", browser: "Desconhecido", os: "Desconhecido" };

  const os = /windows/i.test(ua)
    ? "Windows"
    : /mac os/i.test(ua)
      ? "macOS"
      : /android/i.test(ua)
        ? "Android"
        : /iphone|ipad|ios/i.test(ua)
          ? "iOS"
          : /linux/i.test(ua)
            ? "Linux"
            : "Desconhecido";

  const browser = /edg\//i.test(ua)
    ? "Edge"
    : /chrome\//i.test(ua)
      ? "Chrome"
      : /firefox\//i.test(ua)
        ? "Firefox"
        : /safari\//i.test(ua) && !/chrome/i.test(ua)
          ? "Safari"
          : "Desconhecido";

  const device = /mobile/i.test(ua) ? "Telemóvel" : /tablet|ipad/i.test(ua) ? "Tablet" : "Computador";

  return { device, browser, os };
}
