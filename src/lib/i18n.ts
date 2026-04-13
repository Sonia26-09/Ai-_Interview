import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslations from "../locales/en.json";
import hiTranslations from "../locales/hi.json";
import esTranslations from "../locales/es.json";

// We bundle translations directly for instant load without suspense for settings
const resources = {
    en: {
        translation: enTranslations
    },
    hi: {
        translation: hiTranslations
    },
    es: {
        translation: esTranslations
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: "en", // default language
        fallbackLng: "en",
        interpolation: {
            escapeValue: false // react already safes from xss
        }
    });

export default i18n;
