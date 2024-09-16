import fs from 'node:fs';
import { getBaseName, getTemplateName } from '../compiler/utils/file.js';
import { generateId } from '../compiler/utils/index.js';
import { compilerStyle } from '../compiler/utils/style.js';
import { compiler } from '../index.js';
import { fixError, removeRoot } from './utils.js';

/**
 * Vite plugin for Renit framework, handles compilation and hot updates for `.nit` files.
 * @param {Object} options - Configuration options for the Renit plugin.
 * @returns {Array<Object>} An array with a single Vite plugin object.
 */
export function renit(options) {
  let config;
  let cache = {};
  let content = {};
  return [
    {
      name: 'renit',
      enforce: 'pre',

      /**
       * Called once the Vite configuration is resolved.
       * @param {Object} resolvedConfig - The final Vite configuration object.
       */
      async configResolved(resolvedConfig) {
        config = resolvedConfig;
      },

      /**
       * Modifies the index HTML to replace the custom `<renit>` tag.
       * @param {string} html - The original HTML content.
       * @returns {string} - The modified HTML.
       */
      async transformIndexHtml(html) {
        return html.replace(/<renit(.*?)app(.*?)\/>/, `<!--app-->`);
      },

      /**
       * Transforms `.nit` files or `index.css` by compiling the content and handling CSS imports.
       * @param {string} code - The source code of the file being transformed.
       * @param {string} id - The file identifier (path).
       * @param {Object} opts - Additional options, including SSR context.
       * @returns {Object} - The transformation result with the compiled code.
       */
      async transform(code, id, opts) {
        let results = { code: '' };
        let generate = 'csr';
        if (opts?.ssr) generate = 'ssr';

        if (/\.(nit)$/.test(id)) {
          const base = getBaseName(id);
          id = removeRoot(id);
          const template = getTemplateName(id);
          const cssPath = base + '.nit.css';
          let externalStyle = false;

          if (fs.existsSync(cssPath)) {
            const cssContent = await fs.readFileSync(cssPath, 'utf-8');
            if (cssContent.length) {
              externalStyle = cssContent;
            }
          }

          options.app.generate = generate;
          options.app.$.external.style = externalStyle;

          let result;
          try {
            result = compiler(id, code, options.app);
          } catch (error) {
            throw fixError(error);
          }

          if (result.js) results.code += result.js;

          if (result.css) {
            let name = template;
            if (content[name] && content[name].code === result.css) {
              results.code = `\nimport "${content[name].name}";\n` + results.code;
            } else {
              const c = {
                name: name + '_' + generateId() + '.css',
                code: result.css,
              };
              content[name] = c;
              cache[c.name] = content[name];
              results.code = `\nimport "${c.name}";\n` + results.code;
            }
          }

          return results;
        }

        if (/index.css/.test(id)) {
          options.app.component = { file: '', name: '' };
          let cs;
          try {
            cs = compilerStyle(code, options.app);
          } catch (error) {
            throw error;
          }
          if (cs.code && cs.code.length) results.code = cs.code;
          return results;
        }
      },

      /**
       * Handles hot updates for `.nit` and `.css` files.
       * @param {Object} param - Destructure the object with file and server info.
       */
      handleHotUpdate({ file, server }) {
        if (/\.(nit).(css)$/.test(file)) {
          file = file.replace('.css', '');
          server.moduleGraph.invalidateModule(server.moduleGraph.getModuleById(file));
          server.ws.send({
            type: 'full-reload',
            path: file,
          });
        }
        if (/index.css/.test(file)) {
          server.moduleGraph.fileToModulesMap.forEach((modules, filePath) => {
            if (filePath.endsWith('.nit')) {
              modules.forEach(module => {
                server.moduleGraph.invalidateModule(module);
              });
            }
          });
          server.ws.send({
            type: 'full-reload',
          });
        }
      },

      /**
       * Resolves the cached files.
       * @param {string} name - The name of the file to resolve.
       * @returns {string|null} - The resolved file code or null if not found.
       */
      async resolveId(name) {
        if (cache[name]) return name;
        return null;
      },

      /**
       * Loads the cached code for a file.
       * @param {string} id - The identifier (path) of the file.
       * @returns {string|null} - The cached file content or null if not found.
       */
      load(id) {
        if (cache[id]) {
          return cache[id].code;
        }
        return null;
      },
    },
  ];
}
