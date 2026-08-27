export type LanguageCode =
  | "en"
  | "hi"
  | "bn"
  | "ta"
  | "te"
  | "mr"
  | "gu"
  | "kn"
  | "ml"
  | "pa"
  | "ur"
  | "or"
  | "as"
  | "ne"
  | "si"
  | "es"
  | "ca"
  | "fr"
  | "de"
  | "pt"
  | "it"
  | "nl"
  | "ru"
  | "uk"
  | "pl"
  | "cs"
  | "sk"
  | "hu"
  | "ro"
  | "bg"
  | "hr"
  | "el"
  | "da"
  | "sv"
  | "no"
  | "fi"
  | "tr"
  | "az"
  | "kk"
  | "ka"
  | "hy"
  | "ar"
  | "fa"
  | "he"
  | "id"
  | "ms"
  | "vi"
  | "th"
  | "tl"
  | "my"
  | "km"
  | "lo"
  | "zh"
  | "ja"
  | "ko"
  | "sw"
  | "af"
  | "am"
  | "ha"

export type Language = {
  /** ISO 639-1 code used as the storage value */
  code: LanguageCode
  /** English name, used in prompts ("Respond in {{language}}") */
  name: string
  /** Native-script name, shown to native speakers in the picker */
  nativeName: string
  /** Country flag emoji — picked for the language's most-recognised flag */
  flag: string
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: "en", name: "English",    nativeName: "English",          flag: "🇬🇧" },
  // South Asia
  { code: "hi", name: "Hindi",      nativeName: "हिन्दी",            flag: "🇮🇳" },
  { code: "bn", name: "Bengali",    nativeName: "বাংলা",             flag: "🇧🇩" },
  { code: "ta", name: "Tamil",      nativeName: "தமிழ்",             flag: "🇮🇳" },
  { code: "te", name: "Telugu",     nativeName: "తెలుగు",            flag: "🇮🇳" },
  { code: "mr", name: "Marathi",    nativeName: "मराठी",             flag: "🇮🇳" },
  { code: "gu", name: "Gujarati",   nativeName: "ગુજરાતી",           flag: "🇮🇳" },
  { code: "kn", name: "Kannada",    nativeName: "ಕನ್ನಡ",             flag: "🇮🇳" },
  { code: "ml", name: "Malayalam",  nativeName: "മലയാളം",            flag: "🇮🇳" },
  { code: "pa", name: "Punjabi",    nativeName: "ਪੰਜਾਬੀ",             flag: "🇮🇳" },
  { code: "ur", name: "Urdu",       nativeName: "اُردُو",             flag: "🇵🇰" },
  { code: "or", name: "Odia",       nativeName: "ଓଡ଼ିଆ",              flag: "🇮🇳" },
  { code: "as", name: "Assamese",   nativeName: "অসমীয়া",           flag: "🇮🇳" },
  { code: "ne", name: "Nepali",     nativeName: "नेपाली",             flag: "🇳🇵" },
  { code: "si", name: "Sinhala",    nativeName: "සිංහල",             flag: "🇱🇰" },
  // Western Europe
  { code: "es", name: "Spanish",    nativeName: "Español",           flag: "🇪🇸" },
  { code: "ca", name: "Catalan",    nativeName: "Català",            flag: "🇦🇩" },
  { code: "fr", name: "French",     nativeName: "Français",          flag: "🇫🇷" },
  { code: "de", name: "German",     nativeName: "Deutsch",           flag: "🇩🇪" },
  { code: "pt", name: "Portuguese", nativeName: "Português",         flag: "🇵🇹" },
  { code: "it", name: "Italian",    nativeName: "Italiano",          flag: "🇮🇹" },
  { code: "nl", name: "Dutch",      nativeName: "Nederlands",        flag: "🇳🇱" },
  // Central/Eastern Europe
  { code: "ru", name: "Russian",    nativeName: "Русский",           flag: "🇷🇺" },
  { code: "uk", name: "Ukrainian",  nativeName: "Українська",        flag: "🇺🇦" },
  { code: "pl", name: "Polish",     nativeName: "Polski",            flag: "🇵🇱" },
  { code: "cs", name: "Czech",      nativeName: "Čeština",           flag: "🇨🇿" },
  { code: "sk", name: "Slovak",     nativeName: "Slovenčina",        flag: "🇸🇰" },
  { code: "hu", name: "Hungarian",  nativeName: "Magyar",            flag: "🇭🇺" },
  { code: "ro", name: "Romanian",   nativeName: "Română",            flag: "🇷🇴" },
  { code: "bg", name: "Bulgarian",  nativeName: "Български",         flag: "🇧🇬" },
  { code: "hr", name: "Croatian",   nativeName: "Hrvatski",          flag: "🇭🇷" },
  { code: "el", name: "Greek",      nativeName: "Ελληνικά",          flag: "🇬🇷" },
  // Nordics
  { code: "da", name: "Danish",     nativeName: "Dansk",             flag: "🇩🇰" },
  { code: "sv", name: "Swedish",    nativeName: "Svenska",           flag: "🇸🇪" },
  { code: "no", name: "Norwegian",  nativeName: "Norsk",             flag: "🇳🇴" },
  { code: "fi", name: "Finnish",    nativeName: "Suomi",             flag: "🇫🇮" },
  // Caucasus / Central Asia
  { code: "tr", name: "Turkish",    nativeName: "Türkçe",            flag: "🇹🇷" },
  { code: "az", name: "Azerbaijani",nativeName: "Azərbaycan dili",   flag: "🇦🇿" },
  { code: "kk", name: "Kazakh",     nativeName: "Қазақша",           flag: "🇰🇿" },
  { code: "ka", name: "Georgian",   nativeName: "ქართული",           flag: "🇬🇪" },
  { code: "hy", name: "Armenian",   nativeName: "Հայերեն",           flag: "🇦🇲" },
  // Middle East
  { code: "ar", name: "Arabic",     nativeName: "العربية",           flag: "🇸🇦" },
  { code: "fa", name: "Persian",    nativeName: "فارسی",             flag: "🇮🇷" },
  { code: "he", name: "Hebrew",     nativeName: "עברית",             flag: "🇮🇱" },
  // Southeast Asia
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia",  flag: "🇮🇩" },
  { code: "ms", name: "Malay",      nativeName: "Bahasa Melayu",     flag: "🇲🇾" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt",        flag: "🇻🇳" },
  { code: "th", name: "Thai",       nativeName: "ไทย",                flag: "🇹🇭" },
  { code: "tl", name: "Filipino",   nativeName: "Filipino",          flag: "🇵🇭" },
  { code: "my", name: "Burmese",    nativeName: "မြန်မာ",             flag: "🇲🇲" },
  { code: "km", name: "Khmer",      nativeName: "ខ្មែរ",              flag: "🇰🇭" },
  { code: "lo", name: "Lao",        nativeName: "ລາວ",                flag: "🇱🇦" },
  // East Asia
  { code: "zh", name: "Chinese",    nativeName: "中文",               flag: "🇨🇳" },
  { code: "ja", name: "Japanese",   nativeName: "日本語",             flag: "🇯🇵" },
  { code: "ko", name: "Korean",     nativeName: "한국어",             flag: "🇰🇷" },
  // Africa
  { code: "sw", name: "Swahili",    nativeName: "Kiswahili",         flag: "🇰🇪" },
  { code: "af", name: "Afrikaans",  nativeName: "Afrikaans",         flag: "🇿🇦" },
  { code: "am", name: "Amharic",    nativeName: "አማርኛ",              flag: "🇪🇹" },
  { code: "ha", name: "Hausa",      nativeName: "Hausa",             flag: "🇳🇬" },
]

export const DEFAULT_LANGUAGE: LanguageCode = "en"

const LANGUAGE_BY_CODE = new Map<string, Language>(
  SUPPORTED_LANGUAGES.map((l) => [l.code, l]),
)

export function getLanguage(code: string | null | undefined): Language {
  if (!code) return LANGUAGE_BY_CODE.get(DEFAULT_LANGUAGE)!
  return LANGUAGE_BY_CODE.get(code) ?? LANGUAGE_BY_CODE.get(DEFAULT_LANGUAGE)!
}

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === "string" && LANGUAGE_BY_CODE.has(value)
}

export function normalizeLanguage(value: unknown): LanguageCode {
  return isLanguageCode(value) ? value : DEFAULT_LANGUAGE
}
