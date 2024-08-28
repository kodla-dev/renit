import { generateStyle } from './utils/style.js';

const defaultOptions = {
  // Defines the default generation mode for the application.
  generate: 'csr',

  // Configuration settings for CSS.
  css: {
    // Function to generate styles based on options.
    generate: options => generateStyle(options),

    // Specifies how CSS should be compiled.
    compile: 'external',

    // Configuration for CSS hashing.
    hash: {
      min: 1, // Minimum length of the hash.
      max: 6, // Maximum length of the hash.
    },
  },
};

export default defaultOptions;
