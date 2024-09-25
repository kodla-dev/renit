import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { mergeConfig } from 'vite';
import { join, push } from '../../libraries/collect/index.js';
import { isUndefined } from '../../libraries/is/index.js';
import { cssKit, generateStylePattern } from '../compiler/utils/style.js';
import { RAW_EMPTY } from '../define.js';
import { renit } from './plugins.js';

/** The base directory of the current project */
const base = process.cwd();

/** The root directory path. */
let root = 'app';

/** The build directory path. */
let build = 'build';

/** Determines whether the screen should be cleared */
let clearScreen = true;

/** The port number for the app server. */
let appServerPort = 5000;

/** The port number for the api server. */
let apiServerPort = 5001;

/** The port number for the app preview server. */
let appPreviewPort = 5002;

/** The port number for the api preview server. */
let apiPreviewPort = 5003;

/**
 * Application and API server instances.
 *
 * @type {Object}
 */
export let appServer, apiServer;

/**
 * Sets the application server instance.
 *
 * @param {Object} server - The application server instance.
 */
export const setAppServer = server => (appServer = server);

/**
 * Sets the API server instance.
 *
 * @param {Object} server - The API server instance.
 */
export const setApiServer = server => (apiServer = server);

/**
 * Dynamically imports a module from the given path.
 *
 * @param {string} path - The path to the module to import.
 * @returns {Promise<*>} - A promise that resolves to the imported module.
 */
export const file = async path => await import(/* @vite-ignore */ 'file://' + path);

/**
 * Resolves a sequence of paths or path segments into an absolute path.
 *
 * @returns {string} The resolved absolute path.
 */
export function resolve() {
  return path.resolve(...arguments);
}

/**
 * Resolves paths relative to the base and root directories.
 *
 * @returns {string} The resolved path.
 */
export function src() {
  return resolve(base, root, ...arguments);
}

/**
 * Resolves the path to the build directory.
 *
 * @returns {string} The resolved build directory path.
 */
const buildDir = () => resolve(base, build);

/** Path to the main configuration file (renit.config.js) */
const configPath = resolve(base, './renit.config.js');

/** Reads and returns the content of the index.html file as a string. */
export const getIndexHtml = () => fs.readFileSync(src('index.html'), 'utf-8');

/** Path to the index.css file in the source directory */
export const indexCssPath = () => src('index.css');

/** Path to the index.js file in the source directory */
export const indexJsPath = () => src('index.js');

/**
 * Loads and returns the configuration from the renit.config.js file if it exists.
 *
 * @returns {Promise<Object|undefined>} - A promise that resolves to the configuration object or
 * undefined if the file does not exist.
 */
export async function getMainConfig() {
  if (fs.existsSync(configPath)) {
    const config = await file(configPath);
    return config.default;
  }
}

/**
 * Adjusts settings based on the provided configuration.
 *
 * @param {Object} mainConfig - The main configuration object.
 */
function solveMain(mainConfig) {
  if (mainConfig.root) {
    root = mainConfig.root;
    mainConfig.root = src();
  }
  if (mainConfig?.vite?.root) {
    root = mainConfig.vite.root;
    mainConfig.vite.root = mainConfig.root = src();
  }
  if (!isUndefined(mainConfig.clearScreen)) clearScreen = mainConfig.clearScreen;
  if (!isUndefined(mainConfig?.vite?.clearScreen)) clearScreen = mainConfig.vite.clearScreen;
  if (mainConfig?.app?.server?.port) appServerPort = mainConfig.app.server.port;
  if (mainConfig?.app?.preview?.port) appPreviewPort = mainConfig.app.preview.port;
  if (mainConfig?.api?.server?.port) apiServerPort = mainConfig.api.server.port;
  if (mainConfig?.vite?.build?.outDir) {
    build = mainConfig.vite.build.outDir;
    mainConfig.vite.build.outDir = buildDir();
  }
  return mainConfig;
}

/**
 * Provides default CSS options for the framework.
 *
 * @returns {Object} The default CSS configuration options.
 */
const defaultCSSOptions = () => ({
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
});

/**
 * Returns the default configuration for the application and Vite.
 *
 * @returns {Object} The default configuration object.
 */
const getDefaultConfig = (main, type, command, render) => {
  let SERVER_PORT;
  let PREVIEW_PORT;

  if (type == 'app') {
    SERVER_PORT = appServerPort;
    PREVIEW_PORT = appPreviewPort;
  } else if (type == 'api') {
    SERVER_PORT = apiServerPort;
    PREVIEW_PORT = apiPreviewPort;
  }

  const config = {
    root: src(),
    clearScreen,
    app: {
      generate: render,
      css: defaultCSSOptions(),
      server: {
        port: SERVER_PORT,
      },
      preview: {
        port: PREVIEW_PORT,
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
        port: apiServerPort,
      },
    },
    vite: {
      root: src(),
      clearScreen,
      configFile: false,
      envDir: base,
      envPrefix: 'NIT_',
      resolve: {
        alias: {
          '@config': src('config'),
          '@controller': src('controller'),
          '@language': src('language'),
          '@page': src('pages'),
        },
        extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.nit'],
      },
      define: {
        'import.meta.env.API': type == 'api' ? true : false,
        'import.meta.env.APP': type == 'app' ? true : false,
        'import.meta.env.SERVER': type == 'app' && render == 'ssr' ? true : false,
        'import.meta.env.CLIENT': type == 'app' && render == 'csr' ? true : false,
      },
      plugins: [],
      css: {
        transformer: 'lightningcss',
        lightningcss: true,
      },
      build: {
        outDir: buildDir(),
        emptyOutDir: true,
        cssMinify: 'lightningcss',
      },
      server: {
        port: SERVER_PORT,
        hmr: {
          port: 5004,
        },
        preTransformRequests: false,
      },
      preview: {
        port: PREVIEW_PORT,
      },
    },
    _: { type, command, render },
  };

  if (type == 'app' && main.api != false) {
    config.vite.server.proxy = {
      '/api': `http://localhost:${config.api.server.port}`,
    };
  }

  if (type == 'api') {
    config.vite.server.hmr.port = 5005;
  }

  if (render == 'ssr') {
    config.vite.server.middlewareMode = true;
    config.vite.appType = 'custom';
  }

  if (type == 'app' && command == 'build' && render == 'csr') {
    config.vite.build.manifest = true;
    config.vite.build.outDir = resolve(base, build, 'client');
  }

  if (type == 'app' && command == 'build' && render == 'ssr') {
    config.vite.build.ssr = indexJsPath();
    config.vite.build.minify = 'esbuild';
    config.vite.build.outDir = resolve(base, build, 'server');
  }

  if (type == 'api' && command == 'build') {
    config.vite.build.ssr = indexJsPath();
    config.vite.build.minify = 'esbuild';
    config.vite.build.outDir = resolve(base, build, 'api');
  }

  return config;
};

/**
 * Retrieves and merges the main configuration with default configuration options.
 *
 * @returns {Promise<Object>} A promise that resolves to the merged configuration object.
 */
export async function getOptions(type, command, render) {
  const mainConfig = solveMain(await getMainConfig());
  const defaultConfig = getDefaultConfig(mainConfig, type, command, render);
  const config = mergeConfig(defaultConfig, mainConfig);
  if (type == 'app') {
    config.vite.css.lightningcss = cssKit(config.app);
  }
  config.vite.plugins.push(renit(config));
  return config;
}

let srcCache;

/**
 * Removes the root directory from the given path.
 *
 * @param {string} id - The path to modify.
 * @returns {string} The path without the root directory.
 */
export function removeRoot(id) {
  id = path.normalize(id);
  if (!srcCache) srcCache = src();
  return id.replace(srcCache, RAW_EMPTY).substring(1);
}

/**
 * Removes the specified directory and logs the result to the console.
 *
 * @param {string} dir - The directory path relative to the base directory.
 */
export async function removeDir(dir, clearScreen) {
  if (clearScreen) console.clear();
  const p = path.resolve(base, dir);
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
    out('The build folder has been cleaned.');
  } else {
    out.error('There is no build folder to clean.');
  }
}

export function fixError(error) {
  return error;
}

/**
 * Generates functions for colorizing console output using ANSI escape codes.
 */
export const color = Object.fromEntries(
  Object.entries({ red: 31, green: 32, yellow: 33, blue: 34, magenta: 35, cyan: 36, gray: 90,
    bold: 1, italic: 3, underline: 4
  }).map(([k, c]) => [k, m => `\u001b[${c}m${m}\u001b[${c >= 30 ? 39 : 0}m`])
); // prettier-ignore

// A green arrow symbol for console output.
export const arrow = color.green('➜ ');
export const success = color.green('✓');
export const fault = color.red('✗');

/**
 * Outputs messages to the console.
 */
export function out() {
  console.log(success, ...arguments);
}

/**
 * Outputs error messages to the console.
 */
out.error = function () {
  console.error(fault, ...arguments);
};

/**
 * Logs application and API URLs to the console.
 *
 * @param {Object} options - Configuration options.
 */
export function printUrls(options) {
  const { bold, blue, gray, magenta, cyan, yellow } = color;
  if (options.clearScreen) console.clear(); // Clear the console for a clean output

  const app = `http://localhost:${options.app.server.port}/`; // Application URL
  let api;
  if (options.api) api = `http://localhost:${options.api.server.port}/`; // API URL

  let text = [];

  if (options._.render == 'csr') push('CSR', text);
  if (options._.render == 'ssr') push('SSR + CSR', text);
  if (api) push('API', text);

  const pkg = JSON.parse(fs.readFileSync(new URL('../../../package.json', import.meta.url)));
  const version = pkg.version;

  // Log the Renit framework information
  console.log(bold(blue('Renit ')) + gray(version), gray('-'), magenta(join(' + ', text)), '\n');

  // Log the application URL
  console.log(arrow, `${bold('app')}:`, cyan(app));

  if (api) {
    // Log the API URLs
    console.log(arrow, `${bold('api')}:`, cyan(app + 'api'), gray('or'), cyan(api));
  }

  console.log(arrow, `${gray('press')} ${bold(gray('h + enter'))} ${gray('to show help')}`); // prettier-ignore

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const start =
    process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open';

  rl.on('line', input => {
    let command = input.trim().toLowerCase();
    if (command === 'h') {
      console.log('');
      console.log(yellow(bold('Shortcuts')));
      console.log(`${gray('press')} ${bold(gray('r + enter'))} ${gray('to restart the app server')}`); // prettier-ignore
      if (api) {
        console.log(`${gray('press')} ${bold(gray('a + enter'))} ${gray('to restart the api server')}`); // prettier-ignore
      }
      console.log(`${gray('press')} ${bold(gray('u + enter'))} ${gray('to show server urls')}`); // prettier-ignore
      console.log(`${gray('press')} ${bold(gray('o + enter'))} ${gray('to open in browser')}`); // prettier-ignore
      console.log(`${gray('press')} ${bold(gray('c + enter'))} ${gray('to clear console')}`); // prettier-ignore
      console.log(`${gray('press')} ${bold(gray('q + enter'))} ${gray('to quit')}`); // prettier-ignore
    } else if (command === 'r') {
      if (options.clearScreen) console.clear();
      if (appServer) appServer.restart();
    } else if (command === 'u') {
      console.log('');
      console.log(yellow(bold('Server URLs')));
      console.log(arrow, `${bold('app')}:`, cyan(app));
      if (api) console.log(arrow, `${bold('api')}:`, cyan(app + 'api'), gray('or'), cyan(api));
    } else if (command === 'o') {
      exec(start + ' ' + app);
    } else if (command === 'c') {
      console.clear();
    } else if (command === 'q') {
      if (options.clearScreen) console.clear();
      if (appServer) appServer.close();
      rl.close();
      process.exit();
    }
  });
}
