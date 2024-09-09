import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { mergeDeep } from '../../libraries/collect/index.js';
import { getBaseName, getTemplateName } from '../compiler/utils/file.js';
import { generateId } from '../compiler/utils/index.js';
import { compilerStyle, cssKit, generateStylePattern } from '../compiler/utils/style.js';
import { compiler } from '../index.js';

/** The base directory of the current project */
export const baseDir = process.cwd();

/** Path to the main configuration file (renit.config.js) */
export const baseConfigPath = path.resolve(baseDir, './renit.config.js');

/** Path to the source directory */
export const sourceDir = path.resolve(baseDir, './src');

/** Path to the build directory */
export const buildDir = path.resolve(baseDir, './build');

/** Path to the public directory */
export const publicDir = path.resolve(baseDir, './public');

/** Path to the index.html file in the source directory */
export const indexHtmlPath = path.resolve(sourceDir, './index.html');

/** Path to the index.js file in the source directory */
export const indexJsPath = path.resolve(sourceDir, './index.js');

/** Path to the index.css file in the source directory */
export const indexCssPath = path.resolve(sourceDir, './index.css');

/** Path to the config directory within the source directory */
export const configPath = path.resolve(sourceDir, './config');

/** Path to the controllers directory within the source directory */
export const controllersPath = path.resolve(sourceDir, './controllers');

/** Path to the views directory within the source directory */
export const viewsPath = path.resolve(sourceDir, './views');

/**
 * Dynamically imports a module from the given path.
 *
 * @param {string} path - The path to the module to import.
 * @returns {Promise<*>} - A promise that resolves to the imported module.
 */
export const importFile = async path => await import('file://' + path);

/**
 * Reads and returns the content of the index.html file as a string.
 *
 * @returns {string} - The content of the index.html file.
 */
export const getIndexHtml = () => fs.readFileSync(indexHtmlPath, 'utf-8');

/**
 * Generates functions for colorizing console output using ANSI escape codes.
 *
 * @returns {Object} - An object where each key is a color name and the value is a function
 * that wraps a given message in the appropriate ANSI escape codes for that color.
 */
function colors() {
  const codes = { red: 31, green: 32, yellow: 33, blue: 34, magenta: 35, cyan: 36, gray: 90 };
  const fns = {};

  for (const key in codes) {
    fns[key] = msg => `\u001b[${codes[key]}m${msg}\u001b[39m`;
  }
  return fns;
}

// Export an object containing the color functions
export const color = colors();

/**
 * Loads and returns the configuration from the renit.config.js file if it exists.
 *
 * @returns {Promise<Object|undefined>} - A promise that resolves to the configuration object or
 * undefined if the file does not exist.
 */
export async function getConfig() {
  if (fs.existsSync(baseConfigPath)) {
    const config = await importFile(baseConfigPath);
    return config.default;
  }
}

/**
 * Loads and returns the index.js file if it exists.
 *
 * @returns {Promise<Object|undefined>} - A promise that resolves to the exported content of the
 * index.js file or undefined if the file does not exist.
 */
export async function getIndexJs() {
  if (fs.existsSync(indexJsPath)) {
    const index = await importFile(indexJsPath);
    return index.default;
  }
}

/**
 * Removes the specified directory and logs the result to the console.
 *
 * @param {string} dir - The directory path relative to the base directory.
 */
export async function removeDir(dir, clearScreen) {
  if (clearScreen) console.clear();
  const p = path.resolve(baseDir, dir);
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
    console.log(color.green('✓'), 'The build folder has been cleaned.');
  } else {
    console.log(color.red('✗'), 'There is no build folder to clean.');
  }
}

/**
 * Defines configuration options based on provided arguments.
 *
 * @param {string[]} args - Command line arguments.
 * @returns {Promise<Object>} The merged configuration options.
 */
export async function defineOptions(args) {
  // Initialize default options
  const options = {
    base: baseDir,
    root: sourceDir,
    param: {},
    clearScreen: true,
    app: {
      generate: 'csr',
      css: {
        pattern: options => generateStylePattern(options),
        compile: 'external',
        colors: true,
        nesting: true,
        mediaQueries: false,
        selectors: false,
        units: {
          nt: {
            multiplier: 0.25,
            unit: 'rem',
          },
        },
        breakpoints: {
          unit: 'rem',
          sizes: { sm: 40, md: 48, lg: 64, xl: 80, xxl: 96 },
        },
      },
      server: {
        open: true,
        port: 5000,
      },
      preview: {
        open: true,
        port: 5001,
      },
      $: {
        kit: true,
        external: {
          style: false,
        },
      },
    },
    api: {
      server: {
        port: 5002,
      },
    },
  };

  // Configure Vite settings
  options.vite = {
    clearScreen: true,
    configFile: false,
    root: options.root,
    resolve: {
      alias: {
        '@config': configPath,
        '@controllers': controllersPath,
        '@views': viewsPath,
      },
    },
    plugins: [],
    css: {
      transformer: 'lightningcss',
      lightningcss: true,
    },
    build: {
      outDir: buildDir,
      emptyOutDir: true,
      cssMinify: 'lightningcss',
    },
    publicDir,
  };

  // Handle command line parameter
  const param = args[1];
  if (param == '--csr') options.param.csr = true;

  // Merge with external config
  const config = await getConfig();
  mergeDeep(config, options);

  options.vite.clearScreen = options.clearScreen;

  // Configure Vite server settings
  options.vite.server = {
    open: true,
    port: options.app.server.port,
    proxy: {
      '/api': `http://localhost:${options.api.server.port}`,
    },
  };

  // Configure Vite preview settings
  options.vite.preview = {
    open: true,
    port: options.app.preview.port,
  };

  options.vite.plugins = [
    VitePluginRenit(options),
  ];

  options.vite.css.lightningcss = cssKit(options.app);

  return options;
}

/**
 * A Vite plugin for the Renit framework.
 *
 * @returns {Object} The Vite plugin configuration for Renit.
 */
export function VitePluginRenit(options) {
  // Cache for storing generated CSS content
  let cache = {};
  // Content storage for the CSS files associated with specific ids
  let content = {};

  return [
    {
      name: 'renit',
      enforce: 'pre',
      /**
       * Transforms the index HTML file by replacing custom tags with standard tags.
       *
       * @param {string} html - The HTML content to transform.
       * @returns {Promise<string>} The transformed HTML content.
       */
      async transformIndexHtml(html) {
        return html.replace(/<renit(.*?)app(.*?)\/>/, `<!--app-->`);
      },

      /**
       * Transforms `.nit` files by compiling them and handling CSS imports.
       *
       * @param {string} code - The code content to transform.
       * @param {string} id - The id (path) of the module being transformed.
       * @param {Object} transformOptions - Additional options provided by Vite.
       * @returns {Promise<Object>} The transformed code and CSS imports.
       */
      async transform(code, id, transformOptions) {
        let results = { code: '' };
        let generate = 'csr'; // Default to client-side rendering

        // Switch to server-side rendering if specified
        if (transformOptions?.ssr) generate = 'ssr';

        if (/\.(nit)$/.test(id)) {
          const templateName = getTemplateName(id);
          const baseName = getBaseName(id);
          const cssPath = baseName + '.nit.css';
          let externalStyle = false;

          if (fs.existsSync(cssPath)) {
            const cssContent = await fs.readFileSync(cssPath, 'utf-8');
            if (cssContent.length) {
              externalStyle = cssContent;
            }
          }

          options.app.generate = generate;
          options.app.$.external.style = externalStyle;

          // Compile the code using a custom compiler
          let result;
          try {
            result = compiler(id, code, options.app);
          } catch (error) {
            throw error;
          }

          if (result.js) results.code += result.js;

          // Handle CSS generation and imports
          if (result.css) {
            let name = templateName;
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
       * Resolves module ids for CSS imports.
       *
       * @param {string} name - The name of the module to resolve.
       * @returns {Promise<string|null>} The resolved id or null if not found.
       */
      async resolveId(name) {
        if (cache[name]) return name;
        return null;
      },

      /**
       * Loads the cached CSS content.
       *
       * @param {string} id - The id (path) of the module to load.
       * @returns {Promise<string|null>} The loaded content or null if not found.
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

/**
 * Prints the URLs for the application and API, and optionally opens the app in the browser.
 *
 * @param {number} port - The port number for the application.
 * @param {number} apiPort - The port number for the API.
 * @param {string} generate - The generation type (e.g., 'csr' or 'ssr').
 * @param {boolean} [start=false] - Whether to automatically open the app in the browser.
 */
export function printUrls(port, apiPort, clearScreen, generate, start = false) {
  if (clearScreen) console.clear(); // Clear the console for a clean output

  const url = `http://localhost:${port}/`; // Application URL
  const apiUrl = `http://localhost:${apiPort}/`; // API URL

  // Log the Renit framework information
  console.log(color.blue('Renit'), color.gray('-'), color.magenta(generate), '\n');

  // Log the application URL
  console.log(color.green('➜ '), 'app:', color.cyan(url));

  // Log the API URLs
  console.log(
    color.green('➜ '),
    'api:',
    color.cyan(url + 'api'),
    color.gray('or'),
    color.cyan(apiUrl)
  );

  // If 'start' is true, open the application URL in the default browser
  if (start) {
    start =
      process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open';
    exec(start + ' ' + url);
  }
}
