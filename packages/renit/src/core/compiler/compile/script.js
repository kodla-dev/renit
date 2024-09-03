import { isEmpty } from '../../../libraries/is/index.js';
import { ScriptSpot } from '../spot/script.js';
import { extractJavaScript } from '../utils/script.js';

export default {
  /**
   * Processes a script node, extracting imports and exports, and adding script content to a figure.
   */
  Script({ node, template, component, figure, options }) {
    // Extract JavaScript content from the script node.
    const extract = extractJavaScript(node.content);

    const hasImports = !isEmpty(extract.imports.body);
    const hasExports = !isEmpty(extract.exports.body);
    const hasOthers = !isEmpty(extract.others.body);

    // Add extracted imports to the template.
    if (hasImports) template.addImport(extract.imports);

    // Add extracted exports to the component.
    if (hasExports) component.addExport(extract.exports);

    // Set remaining script content to the figure.
    if (hasOthers) {
      if (isEmpty(component.scriptStatement)) {
        component.setScript(extract.others);
      } else {
        figure.addSpot(new ScriptSpot(extract.others, options));
      }
    }
  },
};
