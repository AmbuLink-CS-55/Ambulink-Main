import { I18n } from "i18n-js";
import en from "./en.json";
import si from "./si.json";
import ta from "./ta.json";

const i18n = new I18n({
  en,
  si,
  ta,
});

i18n.locale = "en";
i18n.enableFallback = true;
// i18n.defaultLocale = 'si';

export default i18n;
