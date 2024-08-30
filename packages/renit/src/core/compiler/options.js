import { generateStylePattern } from './utils/style.js';

const defaultOptions = {
  // Defines the default generation mode for the application.
  generate: 'csr',

  // Configuration settings for CSS.
  css: {
    // Function to generate style pattern based on options.
    pattern: options => generateStylePattern(options),

    // Specifies how CSS should be compiled.
    compile: 'external', // injected - external

    // Configuration for CSS hashing.
    hash: {
      min: 1, // Minimum length of the hash.
      max: 6, // Maximum length of the hash.
    },

    // Enables or disables CSS color support.
    colors: true,

    // Enables or disables CSS nesting support.
    nesting: true,
  },

  // Special settings
  $: {
    external: {
      style: false,
    },
  },
};

export default defaultOptions;
