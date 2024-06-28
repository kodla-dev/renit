import { Component } from '../template/component.js';
import { Template } from '../template/index.js';
import attribute from './attribute.js';
import document from './document.js';
import element from './element.js';
import fragment from './fragment.js';
import script from './script.js';
import text from './text.js';

/**
 * A map of compilers for different types of nodes.
 * @type {Object}
 */
const compilers = Object.assign({}, document, fragment, script, element, attribute, text);

/**
 * Recursively processes each node in the AST.
 * @param {Object} parent - Parent node in the AST.
 * @param {Object} node - Current node being processed.
 * @param {Object} template - Template instance.
 * @param {Object} figure - Current figure.
 * @param {Object} options - Compilation options.
 * @returns {*} - Result of the compilation process for the current node.
 */
function next(parent, node, template, figure, options) {
  const path = {
    parent,
    node,
    template,
    figure,
    options,
    compile: (child, subfigure = figure) => next(node, child, template, subfigure, options),
  };

  if (node.type in compilers) {
    return compilers[node.type](path);
  }
}
/**
 * Recursively compiles an AST using the specified compilers.
 * @param {Object} ast - The AST to compile.
 * @param {Object} options - Options to pass to the compilation process.
 * @returns {*} - Result of the compilation process.
 */
export function compile(ast, options) {
  const template = new Template();

  const component = new Component('default', options);
  template.addComponent(component);

  return next(null, ast, template, component, options);
}
