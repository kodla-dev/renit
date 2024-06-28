import { parse as parseJs } from 'acorn';
import { simple as walkJs, full as walkJsFull, recursive as walkJsRecursive } from 'acorn-walk';
import { generate as generateJs } from 'astring';
import { generate as generateStyle, parse as parseCss, walk as walkCss } from 'css-tree';
import { clone } from '../../../helpers/index.js';
import {
  each,
  filter,
  has,
  join,
  last,
  map,
  prepend,
  push,
  split,
  unique,
} from '../../../libraries/collect/index.js';
import { isArray, isEmpty, isNull, isString, isUndefined } from '../../../libraries/is/index.js';
import { size } from '../../../libraries/math/index.js';
import { RAW_EMPTY, RAW_WHITESPACE } from '../../define.js';
import { createSource } from '../source.js';
import {
  AttributePattern,
  ProgramPattern,
  RawPattern,
  StringAttributePattern,
  generateStyleHash,
  getExpressions,
  isArrowFunctionExpression,
  isAssignmentExpression,
  isCallExpression,
  isClassSelector,
  isDollarSign,
  isExportNamedDeclaration,
  isExpressionStatement,
  isFunctionExpression,
  isIdSelector,
  isIdentifier,
  isImportDeclaration,
  isLiteral,
  isMemberExpression,
  isPseudoClassSelector,
  isSequenceExpression,
} from './index.js';

/**
 * Array to store global styles.
 * @type {Array}
 */
const globalStyles = [];

/**
 * Converts the provided JavaScript code into an Abstract Syntax Tree (AST).
 * @param {string} code The JavaScript code to convert.
 * @returns {object} The Abstract Syntax Tree (AST) representation of the JavaScript code.
 */
export function javaScriptToAST(code) {
  return parseJs(code, {
    ecmaVersion: 'latest',
    sourceType: 'module',
  });
}

/**
 * Generates JavaScript code from a given AST.
 * @param {Object} ast - The AST from which to generate JavaScript code.
 * @returns {string} - The generated JavaScript code.
 */
export function generateJavaScript(ast) {
  return generateJs(ast);
}

/**
 * Corrects and formats JavaScript code by parsing it into an AST and regenerating the code.
 *
 * @param {string} code - The JavaScript code to correct.
 * @returns {string} - The corrected and formatted JavaScript code.
 */
export function javaScriptSyntaxCorrection(code) {
  return generateJavaScript(javaScriptToAST(code));
}

/**
 * Converts the provided CSS code into an Abstract Syntax Tree (AST).
 * @param {string} code The CSS code to convert.
 * @returns {object} The Abstract Syntax Tree (AST) representation of the CSS code.
 */
export function cssToAST(code) {
  return parseCss(code);
}

/**
 * Generates CSS from an Abstract Syntax Tree (AST).
 * @param {object} ast - The Abstract Syntax Tree (AST) representing CSS.
 * @returns {string} The generated CSS as a string.
 */
export function generateCss(ast) {
  return generateStyle(ast);
}

/**
 * Joins two property names into a single property access string.
 * @param {string} first - The first part of the property name.
 * @param {string} second - The second part of the property name.
 * @param {boolean} computed - Computed property.
 * @returns {string} - The combined property access string.
 */
function joinProperty(first, second, computed) {
  if (computed) {
    return `${first}[${second}]`;
  } else {
    return `${first}.${second}`;
  }
}

/**
 * Compiles a MemberExpression AST node into a string representation.
 * @param {Object} ast - The AST node to compile.
 * @returns {string} - The compiled MemberExpression string.
 */
function compileMemberExpression(ast) {
  if (isMemberExpression(ast.object)) {
    const back = compileMemberExpression(ast.object);
    switch (ast.property.type) {
      case 'Identifier':
        return joinProperty(`${back}`, `${ast.property.name}`, ast.computed);
      case 'Literal':
        return joinProperty(`${back}`, `${ast.property.raw}`, ast.computed);
      case 'MemberExpression':
        return joinProperty(back, compileMemberExpression(ast.property), ast.computed);
    }
  } else if (isIdentifier(ast.object)) {
    const back = ast.object.name;
    switch (ast.property.type) {
      case 'Identifier':
        return joinProperty(`${back}`, `${ast.property.name}`, ast.computed);
      case 'Literal':
        return joinProperty(`${back}`, `${ast.property.raw}`, ast.computed);
      case 'MemberExpression':
        return compileMemberExpression(ast.property);
    }
  }
}

/**
 * Extracts import, export declarations and other code from a JavaScript AST.
 * @param {Object} ast - The AST of the JavaScript code to extract from.
 * @returns {Object} - An object containing ASTs.
 */
export function extractJavaScript(ast) {
  const imports = clone(ProgramPattern);
  const exports = clone(ProgramPattern);
  const others = clone(ProgramPattern);

  each(node => {
    if (isImportDeclaration(node)) {
      push(node, imports.body);
    } else if (isExportNamedDeclaration(node)) {
      push(node, exports.body);
    } else {
      push(node, others.body);
    }
  }, ast.body);

  return { imports, exports, others };
}

/**
 * Parses export declarations from a given AST.
 * @param {Object} ast - The AST to parse export declarations from.
 * @returns {Array} - An array of JavaScript code strings representing the export declarations.
 */
export function parseExports(ast) {
  const declarations = [];
  const variables = [];
  each(node => {
    const nodeDeclarations = node.declaration.declarations;
    if (isArray(nodeDeclarations)) {
      each(declaration => {
        push(declaration.id.name, variables);
        push(generateJavaScript(declaration), declarations);
      }, nodeDeclarations);
    } else {
      const declaration = node.declaration.declarations[0];
      push(declaration.id.name, variables);
      push(generateJavaScript(declaration), declarations);
    }
  }, ast.body);
  return { declarations, variables };
}

/**
 * Finds dependencies in a given AST.
 * @param {Object} ast - The AST to find dependencies in.
 * @param {string} [content] - Optional content to compare against dependencies.
 * @returns {Array} - An array of unique dependencies.
 */
export function findDependencies(ast, content) {
  let dependencies = [];
  const memberExpressions = [];
  let hasParameters = false;
  let isCallee = false;

  // Walk the AST to find dependencies.
  walkJs(ast, {
    CallExpression(node) {
      if (isMemberExpression(node.callee)) isCallee = true;
      each(argument => {
        if (isIdentifier(argument)) push(argument.name, dependencies);
      }, node.arguments);
    },
    ArrowFunctionExpression(node) {
      if (!isEmpty(node.params)) hasParameters = true;
      if (isIdentifier(node.body)) push(node.body.name, dependencies);
    },
    BinaryExpression(node) {
      if (isIdentifier(node.left)) push(node.left.name, dependencies);
      if (isIdentifier(node.right)) push(node.right.name, dependencies);
    },
    ConditionalExpression(node) {
      if (isIdentifier(node.test)) push(node.test.name, dependencies);
    },
    MemberExpression(node) {
      push(compileMemberExpression(node), memberExpressions);
    },
  });

  // If there are member expressions and no parameters,
  // add the last member expression to dependencies.
  if (!isEmpty(memberExpressions) && !hasParameters && !isCallee)
    push(last(memberExpressions), dependencies);

  // If there's only one dependency and it matches the content, clear dependencies.
  if (size(dependencies) == 1 && !isUndefined(content)) {
    const dep = dependencies[0];
    if (dep == content) dependencies = [];
  }

  // Return unique dependencies.
  return unique(dependencies);
}

/**
 * Analyzes a JavaScript expression object and returns details about it.
 *
 * @param {Object} expression - The JavaScript expression object.
 * @returns {Object} An object containing details about the expression.
 */
export function functionExpressionAnalysis(expression) {
  const own = {
    function: null,
    assignment: false,
    identifier: false,
    call: false,
    lambda: false,
    params: [],
    arguments: [],
  };

  switch (expression.type) {
    case 'AssignmentExpression':
      own.assignment = true;
      break;
    case 'Identifier':
      own.identifier = true;
      own.function = expression.name;
      break;
    case 'MemberExpression':
      own.identifier = true;
      own.function = compileMemberExpression(expression);
      break;
    case 'CallExpression':
      own.call = true;
      own.arguments = map(arg => arg.name || arg.raw, expression.arguments);
      if (expression.callee.type == 'MemberExpression') {
        own.function = compileMemberExpression(expression.callee);
      } else {
        own.function = expression.callee.name;
      }
      break;
    case 'ArrowFunctionExpression':
      own.lambda = true;
      own.params = map(arg => arg.name, expression.params);
      if (expression.body.type == 'Identifier') {
        own.function = expression.body.name;
      }
      if (expression.body.type == 'CallExpression') {
        own.call = true;
        own.arguments = map(arg => arg.name || arg.raw, expression.body.arguments);
        if (expression.body.callee.type == 'MemberExpression') {
          own.function = compileMemberExpression(expression.body.callee);
        } else {
          own.function = expression.body.callee.name;
        }
      }
      break;
    default:
      break;
  }

  // Filter out undefined or null values
  own.arguments = filter(own.arguments);
  own.params = filter(own.params);

  return own;
}

/**
 * Updates string literals in the AST with changed styles.
 *
 * @param {Object} ast - The abstract syntax tree (AST) to process.
 * @param {Array} changedStyles - An array of objects containing old and new style names.
 */
export function updateLiteral(ast, changedStyles) {
  // Process the AST to update string literals with changed styles
  walkJsFull(ast, node => {
    if (isLiteral(node) && isString(node.value)) {
      const change = changedStyles.find(change => change.old == node.value);
      if (change) {
        node.value = change.new;
        node.raw = JSON.stringify(change.new);
      }
    }
  });
}

/**
 * Prepares a script by processing an AST, extracting dependencies, and generating updated code.
 *
 * @param {Object} ast - The abstract syntax tree (AST) to process.
 * @param {Array} dependencies - An array of dependencies to be updated.
 * @param {Array} changedStyles - An array of changed styles to be applied.
 * @returns {Object} - An object containing the raw generated code, a flag indicating if there are computed values,
 *                     an array of updated dependencies, and a flag indicating if there are updated dependencies.
 */
export function prepareScript(ast, dependencies, changedStyles) {
  // Process the AST to update string literals with changed styles
  updateLiteral(ast, changedStyles);
  // Generate JavaScript code from the AST
  let generatedCode = generateJavaScript(ast);
  // Convert the generated code back to an AST
  ast = javaScriptToAST(generatedCode);
  // Split the generated code into an array of strings
  generatedCode = split(RAW_EMPTY, generatedCode);
  let hasComputedValues = false;
  const updatedDependencies = [];
  const functionNames = [];

  // Walk through the AST recursively to process labeled statements
  walkJsRecursive(ast, null, {
    LabeledStatement(node) {
      if (isIdentifier(node.label) && isDollarSign(node.label)) {
        const localDependencies = [];
        const functionArguments = [];
        let computedValue;
        let isFunctionComputed = false;
        let assignedIdentifier;
        hasComputedValues = true;

        // Check if the body of the labeled statement is an expression statement
        if (isExpressionStatement(node.body)) {
          const bodyExpression = node.body.expression;
          bodyExpression.isComputed = true;

          if (isSequenceExpression(bodyExpression)) {
            /**
            $: name.length, (len) => console.log(len);
            ⇓ ⇩ ⇓ ⇩ ⇓ ⇩ ⇓ ⇩ ⇓ ⇩ ⇓ ⇩ ⇓ ⇩ ⇓
            $c(len => console.log(len), () => name.length);
            */
            each(expression => {
              expression.isComputed = true;
              if (isArrowFunctionExpression(expression) || isFunctionExpression(expression)) {
                isFunctionComputed = true;
                computedValue = extractCode(expression);
              } else if (isAssignmentExpression(expression)) {
                assignedIdentifier = expression.left.name;
                push(assignedIdentifier, updatedDependencies);
                computedValue = extractCode(expression);
              } else {
                const rawExpression = extractCode(expression);
                push(rawExpression, dependencies);
                push(rawExpression, localDependencies);
              }
            }, getExpressions(bodyExpression));
          } else if (isArrowFunctionExpression(bodyExpression)) {
            /**
            $: () => {
              console.log("renit");
            }
            ⇓ ⇩ ⇓ ⇩ ⇓ ⇩ ⇓ ⇩ ⇓ ⇩ ⇓ ⇩ ⇓ ⇩ ⇓
            $c(() => {
              console.log("renit");
            });
            */
            isFunctionComputed = true;
            computedValue = extractCode(bodyExpression);
          } else if (isAssignmentExpression(bodyExpression)) {
            /**
            $: doubled = number * 2;
            ⇓ ⇩ ⇓ ⇩ ⇓ ⇩ ⇓ ⇩ ⇓ ⇩ ⇓ ⇩ ⇓ ⇩ ⇓
            let doubled;
            $c(() => {
              doubled = number * 2;
            });
            */
            assignedIdentifier = node.body.expression.left.name;
            const rightExpression = node.body.expression.right;
            const dependency = findDependencies(rightExpression);
            push(dependency, 1, dependencies);
            push(assignedIdentifier, updatedDependencies);
            computedValue = extractCode(node.body.expression);
          } else if (isCallExpression(bodyExpression)) {
            /**
            $: console.log('renit');
            ⇓ ⇩ ⇓ ⇩ ⇓ ⇩ ⇓ ⇩ ⇓ ⇩ ⇓ ⇩ ⇓ ⇩ ⇓
            $c(() => {console.log('renit')});
            */
            computedValue = extractCode(node.body.expression);
          }
        }

        if (!isEmpty(localDependencies)) {
          each(dep => push(`() => ${dep}`, functionArguments), localDependencies);
        }

        if (isFunctionComputed) {
          prepend(computedValue, functionArguments);
        } else {
          prepend(`() => {${computedValue}}`, functionArguments);
        }

        const sourceCode = createSource();
        if (assignedIdentifier) sourceCode.add(`let ${assignedIdentifier};\n`);
        sourceCode.add('$c(');
        sourceCode.add(join(', ', functionArguments));
        sourceCode.add(');');
        replaceNodeWithCode(node, sourceCode.toString());
      }
    },
  });

  /*
    Update nodes in the AST

    let number = 1;
    function click() {
      number = 2;
    }

    ⇓ ⇩ ⇓ ⇩ ⇓ ⇩ ⇓ ⇩ ⇓ ⇩ ⇓ ⇩ ⇓ ⇩ ⇓

    let number = 1;
    function click() {
      number = 2;
      $u();
    }
  */
  walkJsRecursive(ast, null, {
    Function(node) {
      if (isUndefined(node.isComputed)) {
        updateNode(node);
      }
    },
  });

  walkJsRecursive(ast, null, {
    FunctionDeclaration(node) {
      push(node.id.name, functionNames);
    },
    VariableDeclarator(node) {
      if (!isNull(node.init)) {
        if (isArrowFunctionExpression(node.init)) {
          push(node.id.name, functionNames);
        }
      }
    },
  });

  /**
   * Updates a node in the AST by adding dependency tracking.
   *
   * @param {Object} astNode - The AST node to update.
   */
  function updateNode(astNode) {
    let dependencyAdded = false;
    walkJsFull(astNode, node => {
      const foundDependencies = findDependencies(node);
      if (!isEmpty(foundDependencies)) {
        each(dependency => {
          if (has(dependency, dependencies)) {
            push(dependency, updatedDependencies);
            if (!dependencyAdded) {
              const lastNode = last(astNode.body.body);
              replaceNodeWithCode(lastNode, extractCode(lastNode) + `\n$u();`);
              dependencyAdded = true;
            }
          }
        }, foundDependencies);
      } else {
        if (isIdentifier(node)) {
          const name = node.name;
          if (has(name, dependencies)) {
            push(name, updatedDependencies);
            if (!dependencyAdded) {
              const lastNode = last(astNode.body.body);
              replaceNodeWithCode(lastNode, extractCode(lastNode) + `\n$u();`);
              dependencyAdded = true;
            }
          }
        }
      }
    });
  }

  /**
   * Extracts the code from a given node.
   *
   * @param {Object} node - The node to extract code from.
   * @returns {string} - The extracted code as a string.
   */
  function extractCode(node) {
    return generatedCode.slice(node.start, node.end).join(RAW_EMPTY);
  }

  /**
   * Replaces a node with the provided code.
   *
   * @param {Object} node - The node to replace.
   * @param {string} code - The code to replace the node with.
   */
  function replaceNodeWithCode(node, code) {
    for (let i = node.start; i < node.end; i++) {
      generatedCode[i] = RAW_EMPTY;
    }
    generatedCode[node.start] = code;
  }

  return {
    raw: join(RAW_EMPTY, generatedCode),
    functionNames: functionNames,
    hasComputed: hasComputedValues,
    updatedDependencies: unique(updatedDependencies),
    hasUpdatedDependencies: !isEmpty(updatedDependencies),
  };
}

/**
 * Prepares the style by processing the given AST (Abstract Syntax Tree) and options.
 * @param {Object} ast - The abstract syntax tree representing CSS.
 * @param {Object} options - Options for processing the AST.
 * @returns {Object} An object containing the processed CSS, modified styles, and global styles.
 */
export function prepareStyle(ast, options) {
  const thisId = genId();
  const changedStyles = [];
  let has = {
    this: {
      name: false,
      type: false,
    },
  };

  /**
   * Walks through the CSS AST and processes each node.
   */
  walkCss(ast, (node, item) => {
    const isId = isIdSelector(node);
    const isClass = isClassSelector(node);

    if (isId || isClass) {
      if (node.name == 'this') {
        node.name = thisId;
        has.this.name = thisId;

        if (isId) has.this.type = 'id';
        if (isClass) has.this.type = 'class';
        return;
      }

      const findChange = changedStyles.find(change => change.old == node.name);
      if (findChange) {
        node.name = findChange.new;
        return;
      }

      const id = genId();
      push({ old: node.name, new: id }, changedStyles);
      node.name = id;
      return;
    }

    if (isPseudoClassSelector(node) && (node.name == 'g' || node.name == 'global')) {
      const raw = node.children.head.data.value + '{}';
      const ast = cssToAST(raw);
      const prepare = prepareStyle(ast, options);
      const findGlobal = globalStyles.find(global => global.old == prepare.changedStyles[0].old);
      const attribute = clone(RawPattern);
      attribute.value = prepare.raw.replace('{}', RAW_EMPTY);
      item.data = attribute;

      if (isUndefined(findGlobal)) {
        push(prepare.changedStyles[0], globalStyles);
      } else {
        findGlobal.new = prepare.changedStyles[0].new;
      }
      return;
    }

    if (isPseudoClassSelector(node) && (node.name == 's' || node.name == 'static')) {
      const raw = node.children.head.data.value;
      const ast = cssToAST(raw + '{}');
      const prepare = prepareStyle(ast, options);
      const findGlobalIndex = globalStyles.findIndex(
        global => global.old == prepare.changedStyles[0].old
      );
      if (findGlobalIndex != -1) globalStyles.splice(findGlobalIndex, 1);
      const attribute = clone(RawPattern);
      attribute.value = raw;
      item.data = attribute;
      return;
    }
  });

  /**
   * Generates a unique ID for CSS selectors.
   * @returns {string} The generated unique ID.
   */
  function genId() {
    return generateStyleHash(options.css.hash.min, options.css.hash.max);
  }

  return {
    raw: generateCss(ast),
    has,
    changedStyles,
  };
}

/**
 * Adds the 'this' style attribute to a node based on the provided style.
 * @param {Object} node - The node to which the style attribute will be added.
 * @param {Object} style - The style object containing the 'this' attribute information.
 */
export function addThisStyleAttribute(node, style) {
  const name = style.has.this.name;
  const type = style.has.this.type;

  if (name) {
    let index = node.attributes.findIndex(attribute => attribute.name == type);
    if (index != -1) {
      const attribute = node.attributes[index];
      // If the attribute value is an array, prepend the name
      if (isArray(attribute.value)) {
        const pattern = clone(StringAttributePattern);
        pattern.content = name;
        prepend(pattern, node.attributes[index].value);
      } else {
        // Otherwise, append the name to the existing value
        node.attributes[index].value = attribute.value + RAW_WHITESPACE + name;
      }
    } else {
      // If the attribute does not exist, create a new one
      const pattern = clone(AttributePattern);
      pattern.name = type;
      pattern.value = name;
      if (type == 'id') prepend(pattern, node.attributes);
      else push(pattern, node.attributes);
    }
  }
}

/**
 * Updates the style attribute by replacing old style values with new ones
 * based on global and changed styles.
 *
 * @param {string} value - The original value of the style attribute.
 * @param {Array} changedStyles - An array of objects representing changed styles.
 * @returns {string} The updated style attribute.
 */
export function updateStyleAttribute(value, changedStyles) {
  const attributes = map(
    attribute => {
      attribute = attribute.trim();

      // Find if the attribute matches any global styles to be replaced
      const globalFind = globalStyles.find(global => global.old == attribute);
      if (globalFind) attribute = globalFind.new;

      // Find if the attribute matches any changed styles to be replaced
      const changedFind = changedStyles.find(changed => changed.old == attribute);
      if (changedFind) attribute = changedFind.new;
      return attribute;
    },
    split(RAW_WHITESPACE, value)
  );
  return join(RAW_WHITESPACE, attributes);
}
