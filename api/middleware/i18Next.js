const path = require("path");
const i18next = require("i18next");
const Backend = require("i18next-fs-backend");
const middleware = require("i18next-http-middleware");

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: "en",
    backend: {
      loadPath: path.join(__dirname, "../locales/{{lng}}.json"),
    },
    detection: {
      order: ["querystring", "header"],
      lookupQuerystring: "lang",
      lookupHeader: "accept-language",
    },
  });

module.exports = middleware.handle(i18next);
