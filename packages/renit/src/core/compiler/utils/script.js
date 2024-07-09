import { generate as generateJs } from 'astring';
import { parse as parseJs } from 'meriyah';
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
  reverse,
  split,
  unique,
} from '../../../libraries/collect/index.js';
import { isArray, isEmpty, isNull, isString, isUndefined } from '../../../libraries/is/index.js';
import { size } from '../../../libraries/math/index.js';
import { RAW_EMPTY } from '../../define.js';
import { createSource } from '../source.js';
import { visitCondition, visitFull, visitSimple } from '../visit.js';
import { ProgramPattern } from './constant.js';
import { $u } from './index.js';
import {
  getExpressions,
  isArrowFunctionExpression,
  isAssignmentExpression,
  isCallExpression,
  isDollarSign,
  isExportNamedDeclaration,
  isExpressionStatement,
  isFunctionExpression,
  isIdentifier,
  isImportDeclaration,
  isLiteral,
  isMemberExpression,
  isSequenceExpression,
} from './node.js';

/**
 * Converts the provided JavaScript code into an Abstract Syntax Tree (AST).
 * @param {string} code The JavaScript code to convert.
 * @returns {object} The Abstract Syntax Tree (AST) representation of the JavaScript code.
 */
export function javaScriptToAST(code) {
  return parseJs(code, {
    module: true,
    ranges: true,
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

  visitFull(ast, {
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
      if (isMemberExpression(expression.callee)) {
        own.function = compileMemberExpression(expression.callee);
      } else {
        own.function = expression.callee.name;
      }
      break;
    case 'ArrowFunctionExpression':
      own.lambda = true;
      own.params = map(arg => arg.name, expression.params);
      if (isIdentifier(expression.body)) {
        own.function = expression.body.name;
      }
      if (isCallExpression(expression.body)) {
        own.call = true;
        own.arguments = map(arg => arg.name || arg.raw, expression.body.arguments);
        if (isMemberExpression(expression.body.callee)) {
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
  visitFull(ast, node => {
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
  visitSimple(ast, {
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
  const injectedNodes = [];
  visitFull(ast, node => {
    if (has('Function', node.type)) {
      updateNode(node);
    }
  });

  visitSimple(ast, {
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
    // console.log(JSON.stringify(astNode, 0, 2));
    let dependencyAdded = false;

    visitCondition(
      astNode,
      {
        Identifier(node, parent) {
          const foundDependencies = findDependencies(parent);
          if (!isEmpty(foundDependencies)) {
            each(dependency => {
              if (has(dependency, dependencies)) {
                push(dependency, updatedDependencies);
                if (!dependencyAdded) {
                  const lastNode = last(astNode.body.body);
                  push(lastNode, injectedNodes);
                  dependencyAdded = true;
                }
              }
            }, foundDependencies);
          }

          const name = node.name;
          if (has(name, dependencies)) {
            push(name, updatedDependencies);
            if (!dependencyAdded) {
              const lastNode = last(astNode.body.body);
              push(lastNode, injectedNodes);
              dependencyAdded = true;
            }
          }
        },
      },
      node => {
        if (has('Function', node.type)) return false;
        return true;
      },
      ['body', 'expression', 'left', 'argument', 'callee', 'object', 'test', 'properties', 'value']
    );
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

  each(node => {
    replaceNodeWithCode(node, extractCode(node) + `\n` + $u());
  }, reverse(injectedNodes));

  return {
    raw: join(RAW_EMPTY, generatedCode),
    functionNames: functionNames,
    hasComputed: hasComputedValues,
    updatedDependencies: unique(updatedDependencies),
    hasUpdatedDependencies: !isEmpty(updatedDependencies),
  };
}
