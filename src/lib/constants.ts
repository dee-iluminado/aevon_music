export const APP_NAME = "AEVON Music";
export const APP_DESCRIPTION =
  "AEVON Music is a free, minimalist music streaming web app powered by the JioSaavn catalog. Search, stream and download high-quality songs across Hindi, Punjabi, English, Tamil and more.";

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
}

export const LANGUAGES: LanguageOption[] = [
  { label: "Hindi", value: "hindi" },
  { label: "English", value: "english" },
  { label: "Punjabi", value: "punjabi" },
  { label: "Haryanvi", value: "haryanvi" },
  { label: "Rajasthani", value: "rajasthani" },
  { label: "Tamil", value: "tamil" },
  { label: "Telugu", value: "telugu" },
  { label: "Odia", value: "odia" },
  { label: "Marathi", value: "marathi" },
  { label: "Gujarati", value: "gujarati" },
  { label: "Kannada", value: "kannada" },
  { label: "Malayalam", value: "malayalam" },
  { label: "Bengali", value: "bengali" },
  { label: "Bhojpuri", value: "bhojpuri" },
  { label: "Urdu", value: "urdu" },
];

export const QUICK_SEARCHES = [
  "Arijit Singh",
  "A.R. Rahman",
  "Punjabi",
  "Lofi",
  "Romantic",
  "Party",
  "Bollywood",
  "Sleep",
];
