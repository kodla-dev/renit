import { isEmpty } from '../../../libraries/is/index.js';
import { ScriptSpot } from '../spot/script.js';
import { extractJavaScript } from '../utils/ast.js';
import { compact } from '../utils/index.js';

export default {
  /**
   * Processes a script node, extracting imports and exports, and adding script content to a figure.
   */
  Script({ node, template, figure }) {
    // Extract JavaScript content from the script node.
    const extract = extractJavaScript(node.content);

    const hasImports = !isEmpty(extract.imports.body);
    const hasExports = !isEmpty(extract.exports.body);
    const hasOthers = !isEmpty(extract.others.body);

    // Add extracted imports to the template.
    if (hasImports) template.addImport(extract.imports);

    // Add extracted exports to the figure.
    if (hasExports) figure.addExport(extract.exports);

    // Set remaining script content to the figure.
    if (hasOthers) {
      if (isEmpty(figure.scriptStatement)) {
        figure.setScript(extract.others);
      } else {
        figure.addSpot(new ScriptSpot(extract.others));
      }
    }
  },
  EmbedScript({ node, figure }) {
    const value = compact(node.children[0].content);
    figure.embed = true;
    figure.appendBlock(`<script>${value}</script>`);
  },
};
