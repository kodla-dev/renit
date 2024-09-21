import { pipe } from '../../../helpers/index.js';
import { each, includes, join, map, push, some, unique } from '../../../libraries/collect/index.js';
import { isEmpty } from '../../../libraries/is/index.js';
import { ucfirst } from '../../../libraries/string/index.js';
import { DOM_TEXT_SELECTOR, RAW_COMMA, RAW_EMPTY } from '../../define.js';
import { getContentBraces, simpleBracesConvert } from '../utils/braces.js';
import { $el, $lamb, $lambda, $ltr, $str, $var } from '../utils/index.js';
import { isSSR } from '../utils/node.js';
import { findDependencies, javaScriptToAST } from '../utils/script.js';

export class BracketsSpot {
  constructor(parent, node, figure, component, template, options) {
    this.reference = parent.reference;
    this.name = node.name;
    this.value = node.value;
    this.type = node.type == 'LinkAttribute' ? 1 : 2;
    this.link = node.link || this.type == 1;
    this.translate = node.translate;
    this.literals = node.literals;
    this.figure = figure;
    this.component = component;
    this.template = template;
    this.ssr = isSSR(options);
    this.localFn = this.link ? 'link' : 'translate';
    this.has = {
      braces: includes('{', this.value),
      fn: includes('(', this.value),
      parameter: includes(':', this.value),
    };
    this.parameter = RAW_EMPTY;
    this.dependencies = [];
  }

  bootstrap() {
    const { value, ssr, link, translate, template, figure, component, literals, type, has } = this;

    if (link) template.link = true;
    if (translate) template.translate = true;

    if (has.fn) {
      const open = value.indexOf('(');
      this.name = value.slice(0, open).trim();
      this.value = value.slice(open).trim();
    } else if (has.parameter) {
      const mark = value.indexOf(':');
      this.name = value.slice(0, mark).trim();
      this.parameter = value.slice(mark).trim().substring(1);
    }

    if (link) {
      if (has.braces) {
        const match = value.match(/{(.*?)}/g);
        if (match) {
          this.dependencies = pipe(
            match,
            map(a => getContentBraces(a)),
            unique
          );
          component.addDependencies(this.dependencies);
        }
      }
    } else if (translate) {
      if (has.fn) {
        this.dependencies = findDependencies(javaScriptToAST(value), value);
      } else if (has.parameter) {
        this.dependencies = findDependencies(javaScriptToAST(`fn(${this.parameter})`), value);
      }
      component.addDependencies(this.dependencies);
    }

    if (ssr || literals) {
      this.generateLiterals();
      return;
    }

    if (type == 2) {
      this.reference = figure.addReference();
      figure.appendBlock(DOM_TEXT_SELECTOR);
    }

    figure.addSpot(this);
  }

  generateLiterals() {
    let { name, type, figure, link, translate } = this;
    if (type == 1) figure.appendBlock(name + '="');
    if (link) figure.appendBlock($var(this.createLink()));
    if (translate) figure.appendBlock($var(this.createTranslate()));
    if (type == 1) figure.appendBlock('"');
  }

  createLink() {
    let { localFn, value, has } = this;
    value = has.braces ? simpleBracesConvert(value) : value;
    return `${localFn}(${$ltr(value)})`;
  }

  createTranslate() {
    let { name, value, localFn, has, parameter } = this;
    if (has.fn) return `${localFn}(${$ltr(name)})${value}`;
    if (has.parameter) return `${localFn}(${$ltr(name)},${parameter})`;
    return `${localFn}(${$ltr(value)})`;
  }

  generate(component) {
    const { type, name, reference, link, translate, dependencies } = this;
    const param = [$el(reference)];
    const hasDependencies = !isEmpty(dependencies);
    let fn;
    let isLambda = false;
    let needDependencies = false;
    let content = RAW_EMPTY;

    if (type == 1) {
      push($str(name), param);
    }

    if (link) content = this.createLink();
    if (translate) content = this.createTranslate();

    if (type == 1) fn = 'attribute';
    else if (type == 2) fn = 'text';

    if (hasDependencies) {
      isLambda = some(dep => includes(dep, component.updatedDependencies), dependencies);
      if (isLambda) needDependencies = true;
    }

    push($lambda(isLambda, content), param);
    if (needDependencies) each(dep => push($lamb(dep), param), dependencies);
    if (isLambda) fn = ucfirst(fn);

    return `$.${fn}(${join(RAW_COMMA, param)});`;
  }
}
