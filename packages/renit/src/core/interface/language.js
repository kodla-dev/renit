import { pipe } from '../../helpers/index.js';
import { filter, map, sort, split } from '../../libraries/collect/index.js';
import { length } from '../../libraries/math/index.js';
import { lower } from '../../libraries/string/index.js';

/**
 * Parses the "Accept-Language" string into an array of language objects.
 *
 * @param {string} acceptLanguages - Accepted languages string.
 * @returns {Array<Object>} Parsed language objects sorted by quality.
 */
function languagesParser(acceptLanguages) {
  return pipe(
    acceptLanguages || '',
    split(','),
    map(item => {
      const [lang, qValue] = split(';q=', item);
      const [code, region, script] = split('-', lang.trim());
      return {
        code,
        region: region || null,
        script: script || null,
        quality: qValue ? parseFloat(qValue) : 1.0,
      };
    }),
    filter(item => item.code),
    sort((a, b) => b.quality - a.quality)
  );
}

/**
 * Selects the best matching language from supported ones.
 *
 * @param {Array<string>} supportedLanguages - Supported languages.
 * @param {string} acceptLanguage - Accepted language string.
 * @param {Object} [options={}] - Matching options.
 * @param {boolean} [options.loose=false] - Allow partial matches.
 * @returns {string|null} Best matching language or null.
 */
export function pickLanguage(supportedLanguages, acceptLanguage, options = {}) {
  if (!length(supportedLanguages) || !acceptLanguage) return null;
  acceptLanguage = languagesParser(acceptLanguage);
  const supported = map(lang => {
    const [code, region, script] = split('-', lang);
    return { code, region: region || null, script: script || null };
  }, supportedLanguages);
  for (let i = 0; i < length(acceptLanguage); i++) {
    const lang = acceptLanguage[i];
    const langCode = lower(lang.code);
    const langRegion = lang.region ? lower(lang.region) : lang.region;
    const langScript = lang.script ? lower(lang.script) : lang.script;
    for (let j = 0; j < length(supported); j++) {
      const supportedCode = lower(supported[j].code);
      const supportedScript = supported[j].script
        ? lower(supported[j].script)
        : supported[j].script;
      const supportedRegion = supported[j].region
        ? lower(supported[j].region)
        : supported[j].region;
      if (
        langCode === supportedCode &&
        (options.loose || !langScript || langScript === supportedScript) &&
        (options.loose || !langRegion || langRegion === supportedRegion)
      ) {
        return supportedLanguages[j];
      }
    }
  }
}
