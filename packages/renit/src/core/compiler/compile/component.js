import { map } from '../../../libraries/collect/index.js';
import { DOM_TEXT_SELECTOR } from '../../define.js';
import { ComponentSpot } from '../spot/component.js';
import { isSSR } from '../utils/node.js';

export default {
  Component({ node, component, figure, compile, options }) {
    const ssr = isSSR(options);

    component.context = true;

    if (!ssr) {
      component.insideComponent = true;
      node.reference = figure.addReference();
      figure.appendBlock(DOM_TEXT_SELECTOR);
    }

    if (ssr) figure.startBlock();
    const componentFigure = new ComponentSpot(node, ssr);
    map(child => compile(child, component, componentFigure), node.children);
    const bootstrap = componentFigure.bootstrap();
    if (bootstrap.hasDependencies) {
      component.addDependencies(bootstrap.dependencies);
    }
    if (bootstrap.hasLocalProps) {
      component.hasUpdate = true;
      component.addUpdatedDependencies(bootstrap.localProps);
    }
    figure.addSpot(componentFigure);
    if (ssr) figure.endBlock();
  },
};
