import { map } from '../../../libraries/collect/index.js';
import { isEmpty } from '../../../libraries/is/index.js';
import { DOM_TEXT_SELECTOR } from '../../define.js';
import { ForSpot } from '../spot/for.js';
import { ElseIfSpot, ElseSpot, IfSpot } from '../spot/if.js';
import { SlotContentSpot, SlotSpot } from '../spot/slot.js';
import { isSSR } from '../utils/node.js';

export default {
  IfBlock({ node, component, figure, compile, options }) {
    const ssr = isSSR(options);

    if (!ssr) {
      node.reference = figure.addReference();
      figure.appendBlock(DOM_TEXT_SELECTOR);
      component.addDependencies(node.dependencies, node.value);
    }

    if (ssr) figure.startBlock();
    const ifFigure = new IfSpot(node, ssr);
    map(child => compile(child, component, ifFigure), node.children);
    figure.addSpot(ifFigure);
    if (ssr) figure.endBlock();
  },

  ElseifBlock({ node, component, figure, compile, options }) {
    const ssr = isSSR(options);

    if (!ssr) {
      component.addDependencies(node.dependencies, node.value);
    }

    if (ssr) figure.startBlock();
    const elseIfFigure = new ElseIfSpot(node, ssr);
    map(child => compile(child, component, elseIfFigure), node.children);
    figure.addBlock(elseIfFigure);
    if (ssr) figure.endBlock();
  },

  ElseBlock({ node, component, figure, compile, options }) {
    const ssr = isSSR(options);
    if (ssr) figure.startBlock();
    const elseFigure = new ElseSpot(node, ssr);
    map(child => compile(child, component, elseFigure), node.children);
    figure.addBlock(elseFigure);
    if (ssr) figure.endBlock();
  },

  ForBlock({ node, component, figure, compile, options }) {
    const ssr = isSSR(options);

    if (!ssr) {
      node.reference = figure.addReference();
      figure.appendBlock(DOM_TEXT_SELECTOR);
      component.addDependencies(node.dependencies, node.value);
      if (!isEmpty(node.as.name)) {
        component.addUpdatedDependencies(node.as.name);
      }
      if (!isEmpty(node.as.computed)) {
        component.addUpdatedDependencies(node.as.computed);
      }
      if (!isEmpty(node.index)) {
        component.addUpdatedDependencies(node.index);
      }
    }

    if (ssr) figure.startBlock();
    const forFigure = new ForSpot(node, ssr);
    map(child => compile(child, component, forFigure), node.children);
    figure.addSpot(forFigure);
    if (ssr) figure.endBlock();
  },
  SlotBlock({ node, component, figure, compile, options }) {
    const ssr = isSSR(options);

    if (!ssr) {
      component.context = true;
      component.current = true;
      node.reference = figure.addReference();
      figure.appendBlock(DOM_TEXT_SELECTOR);

      if (!isEmpty(node.attributes)) {
        const slotProps = map(attribute => attribute.name, node.attributes);
        component.addDependencies(slotProps);
      }
    }

    if (ssr) figure.startBlock();
    const slotFigure = new SlotSpot(node, ssr);
    map(child => compile(child, component, slotFigure), node.children);
    figure.addSpot(slotFigure);
    if (ssr) figure.endBlock();
  },
  SlotContent({ node, component, figure, compile, options }) {
    const ssr = isSSR(options);
    if (ssr) figure.startBlock();
    const slotContentFigure = new SlotContentSpot(node, ssr);
    map(child => compile(child, component, slotContentFigure), node.children);
    figure.addBlock(slotContentFigure);
    if (ssr) figure.endBlock();
  },
};
