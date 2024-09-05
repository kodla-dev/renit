import { generate as generateJs } from 'astring';
import { parse as parseJs } from 'meriyah';
import { clone } from '../../../helpers/index.js';
import {
  each,
  filter,
  has,
  includes,
  join,
  last,
  map,
  prepend,
  push,
  reverse,
  some,
  split,
  unique,
} from '../../../libraries/collect/index.js';
import { isArray, isEmpty, isNull, isString, isUndefined } from '../../../libraries/is/index.js';
import { size } from '../../../libraries/math/index.js';
import { visitCondition, visitFull, visitSimple } from '../../../libraries/to/index.js';
import { RAW_EMPTY } from '../../define.js';
import { createSource } from '../source.js';
import { ProgramPattern } from './constant.js';
import { $u } from './index.js';
import {
  getExpressions,
  isArrowFunctionExpression,
  isAssignmentExpression,
  isBlockStatement,
  isCallExpression,
  isDollarSign,
  isExportNamedDeclaration,
  isExpressionStatement,
  isFunctionDeclaration,
  isFunctionExpression,
  isIdentifier,
  isImportDeclaration,
  isLiteral,
  isLogicalExpression,
  isMemberExpression,
  isObjectExpression,
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
    directives: true,
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
      // if(isIdentifier(node.object)) push(node.object.name, dependencies);
      push(compileMemberExpression(node), memberExpressions);
    },
    UpdateExpression(node) {
      if (isIdentifier(node.argument)) push(node.argument.name, dependencies);
    },
    UnaryExpression(node) {
      if (isIdentifier(node.argument)) push(node.argument.name, dependencies);
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
 * Checks if the content has any of the specified dependencies.
 *
 * @param {string} content - The content to check for dependencies.
 * @param {Array<string>} dependencies - The list of dependencies to check against.
 * @returns {boolean} True if any dependency is found in the content, otherwise false.
 */
export function checkDependencies(content, dependencies) {
  // Check if the content has any of the dependencies directly using `has`.
  if (has(content, dependencies)) {
    return true;
  }

  // Check if the content any dependency followed by '[' or '.'.
  return some(dep => {
    if (content.startsWith(dep + '[') || content.startsWith(dep + '.')) {
      return true;
    } else if (content.match(new RegExp(`\\b${dep}[.[]\\b`))) {
      return true;
    }
    return false;
  }, dependencies);
}

/**
 * Checks if a given identifier name is present within functions in the AST.
 * @param {string} name - The identifier name to look for.
 * @param {Object} ast - The AST to search within.
 * @returns {boolean} True if the identifier is found within any function, otherwise false.
 */
export function checkUpdateInFunction(name, ast) {
  let update = false;
  visitFull(ast, node => {
    if (has('Function', node.type)) {
      visitCondition(
        node,
        {
          Identifier(node) {
            if (node.name == name) update = true;
          },
        },
        node => {
          if (has('Function', node.type)) return true;
          if (isBlockStatement(node)) return true;
          if (has('Expression', node.type)) return true;
          if (node.type == 'Property') return true;
          if (isIdentifier(node)) return true;
          return false;
        },
        [
          'body',
          'expression',
          'callee',
          'left',
          'object',
          'argument',
          'arguments',
          'value',
          'properties',
        ]
      );
    }
  });
  return update;
}

/**
 * Analyzes an AST node to extract dependencies, values, and computed expressions.
 *
 * @param {Object} ast - The AST node to analyze.
 * @returns {Object} An object containing dependencies, value, as, and index.
 */
export function forExpressionAnalysis(ast) {
  let dependencies = [];
  let as = {
    name: '',
    computed: [],
  };
  let value = '';
  let index = '';
  let key = '';

  if (isIdentifier(ast)) {
    // If the AST node is an identifier, add its name to dependencies and set it as the value.
    push(ast.name, dependencies);
    value = ast.name;
  } else if (isLiteral(ast)) {
    // If the AST node is a literal, set its value as the value.
    value = ast.value;
  } else if (isLogicalExpression(ast)) {
    // If the AST node is an logical expression, process its left and right.
    if (isIdentifier(ast.left)) {
      value = ast.left.name;
    } else if (isMemberExpression(ast.left)) {
      value = compileMemberExpression(ast.left);
    }
    push(value, dependencies);
    if (isIdentifier(ast.right)) {
      as.name = ast.right.name;
    } else if (isObjectExpression(ast.right)) {
      as.name = '$item';
      each(node => push(node.value.name, as.computed), ast.right.properties);
    }
  } else if (isSequenceExpression(ast)) {
    // If the AST node is a sequence expression, process its first expression.
    const expression = ast.expressions[0];
    const analysis = forExpressionAnalysis(expression);
    if (!isEmpty(analysis.dependencies)) dependencies = analysis.dependencies;
    value = analysis.value;
    as = analysis.as;

    // If there is a second expression, set it as the index.
    const indexAst = ast.expressions[1];
    if (isIdentifier(indexAst)) {
      index = indexAst.name;
    } else if (isCallExpression(indexAst)) {
      index = indexAst.callee.name;
      key = generateJavaScript(indexAst);
      key = /\((.*?)\)/g.exec(key)[1];
    }
  }

  return { dependencies, value, as, index, key };
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
export function prepareScript(ast, dependencies, functionDependencies, changedStyles, ssr) {
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
            $.computed(len => console.log(len), () => name.length);
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
            $.computed(() => {
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
            $.computed(() => {
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
            $.computed(() => {console.log('renit')});
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

        if (ssr) {
          sourceCode.add(javaScriptSyntaxCorrection(computedValue).trim());
        } else {
          sourceCode.add('$.computed(');
          sourceCode.add(join(', ', functionArguments));
          sourceCode.add(');');
        }

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
  let fnName;

  if (!ssr) {
    visitFull(ast, node => {
      if (isFunctionDeclaration(node)) {
        fnName = node.id.name;
      } else if (node.type == 'VariableDeclaration') {
        const declarator = node.declarations[0];
        if (!isNull(declarator.init)) {
          if (isArrowFunctionExpression(declarator.init)) {
            fnName = declarator.id.name;
          }
        }
      } else if (node.type == 'VariableDeclarator') {
        if (!isNull(node.init)) {
          if (isArrowFunctionExpression(node.init)) {
            fnName = node.id.name;
          }
        }
      }

      if (has('Function', node.type)) {
        let force = 0;
        if (includes(fnName, functionDependencies)) force = 1;
        updateNode(node, force);
      }
    });
  }

  visitSimple(ast, {
    FunctionDeclaration(node) {
      push(node.id.name, functionNames);
    },
    VariableDeclaration(node) {
      const declarator = node.declarations[0];
      if (!isNull(declarator.init)) {
        if (isArrowFunctionExpression(declarator.init)) {
          push(declarator.id.name, functionNames);
        }
      }
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
  function updateNode(astNode, force) {
    let dependencyAdded = false;

    if (!force) {
      let hasReturn = false;
      visitFull(astNode, {
        ReturnStatement() {
          hasReturn = true;
        },
      });
      if (hasReturn) return;
    }

    let block = false;

    visitCondition(
      astNode,
      {
        BlockStatement() {
          block = true;
        },
        Identifier(node, parent) {
          if (force && !dependencyAdded) {
            const firstNode = block ? astNode.body.body[0] : astNode.body;
            push({ loc: firstNode, block, start: true }, injectedNodes);
            dependencyAdded = true;
            return;
          }

          const foundDependencies = findDependencies(parent);

          if (!isEmpty(foundDependencies)) {
            each(dependency => {
              if (has(dependency, dependencies)) {
                push(dependency, updatedDependencies);
                if (!dependencyAdded) {
                  const lastNode = block ? last(astNode.body.body) : astNode.body;
                  push({ loc: lastNode, block }, injectedNodes);
                  dependencyAdded = true;
                }
              }
            }, foundDependencies);
          }

          const name = node.name;

          if (has(name, dependencies)) {
            push(name, updatedDependencies);
            if (!dependencyAdded) {
              const lastNode = block ? last(astNode.body.body) : astNode.body;
              push({ loc: lastNode, block }, injectedNodes);
              dependencyAdded = true;
            }
          } else {
            each(dep => {
              if (!isString(dep)) return;
              if (dep.startsWith(name + '[') || dep.startsWith(name + '.')) {
                push(dep, updatedDependencies);
                if (!dependencyAdded) {
                  const lastNode = block ? last(astNode.body.body) : astNode.body;
                  push({ loc: lastNode, block }, injectedNodes);
                  dependencyAdded = true;
                }
              }
            }, dependencies);
          }
        },
      },
      node => {
        if (has('Function', node.type)) return false;
        return true;
      },
      [
        'body',
        'expression',
        'left',
        'argument',
        'callee',
        'object',
        'test',
        'properties',
        'value',
        'consequent',
        'alternate',
        'declarations',
        'init',
      ]
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
    if (node.start && node.block) {
      replaceNodeWithCode(node.loc, $u() + '\n' + extractCode(node.loc));
    } else if (node.block) {
      replaceNodeWithCode(node.loc, extractCode(node.loc) + `\n` + $u());
    } else {
      replaceNodeWithCode(node.loc, $u(extractCode(node.loc), false));
    }
  }, reverse(injectedNodes));

  return {
    raw: join(RAW_EMPTY, generatedCode),
    functionNames: functionNames,
    hasComputed: hasComputedValues,
    updatedDependencies: unique(updatedDependencies),
    hasUpdatedDependencies: !isEmpty(updatedDependencies),
  };
}

/**
 * Removes environment-specific code blocks from the JavaScript content.
 * @param {string} content - The JavaScript content to process.
 * @param {string} generate - The target generation environment, either 'csr' or 'ssr'.
 * @returns {string} The processed content with unnecessary code blocks removed.
 */
export function javaScriptClearEnv(content, generate) {
  const remove = generate === 'ssr' ? 'csr' : 'ssr';
  const pattern = new RegExp(`//\\s*if:${remove}[\\s\\S]*?//\\s*endif\\s*`, 'g');
  return content.replace(pattern, '').trim();
}
