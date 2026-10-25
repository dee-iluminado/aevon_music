export const APP_NAME = "AEVON Music";
export const APP_DESCRIPTION =
  "AEVON Music is a free, minimalist music streaming web app powered by the JioSaavn catalog. Search, stream and download high-quality songs across English, Spanish, French, Italian, Amharic, Brazilian and more.";

export const DEFAULT_BASE = "https://shnwazdev-jiosaavn-apii.vercel.app";
export const FALLBACK_BASE = "https://saavn.dev";

export const SAAVN_BASE = process.env.SAAVN_API_BASE || DEFAULT_BASE;
export const SAAVN_FALLBACK_BASE = process.env.SAAVN_API_BASE_2 || FALLBACK_BASE;

export const ALLOWED_MEDIA_HOSTS = [
  "c.saavncdn.com",
  "aac.saavncdn.com",
  "cdna.saavncdn.com",
  "aac.saavncdn.io",
  "hls.saavncdn.com",
  "cdns-preview.dzcdn.net",
  "cdns.dzcdn.net",
];

export interface LanguageOption {
  label: string;
  value: string;
  /** Search query used by the Browse tile. Defaults to the label. */
  query?: string;
}

export const LANGUAGES: LanguageOption[] = [
  { label: "English", value: "english" },
  { label: "Spanish", value: "spanish", query: "Spanish songs" },
  { label: "French", value: "french", query: "French songs" },
  { label: "Italian", value: "italian", query: "Italian" },
  { label: "Amharic", value: "amharic", query: "Amharic songs" },
  { label: "Brazil", value: "brazil", query: "Brazilian" },
];

export const QUICK_SEARCHES = [
  "English",
  "Pop",
  "Hip Hop",
  "Punjabi",
  "Lofi",
  "Romantic",
  "Party",
  "Sleep",
];
