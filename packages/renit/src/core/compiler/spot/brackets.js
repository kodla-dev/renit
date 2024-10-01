import { includes, join, push, split } from '../../../libraries/collect/index.js';
import { DOM_TEXT_SELECTOR, RAW_COMMA, RAW_EMPTY } from '../../define.js';
import { simpleBracesConvert } from '../utils/braces.js';
import { $el, $lamb, $ltr, $str, $var, adaptDefine } from '../utils/index.js';
import { isSSR } from '../utils/node.js';

export class BracketsSpot {
  constructor(parent, node, figure, template, options) {
    this.reference = parent.reference;
    this.name = node.name;
    this.nodeName = node.name;
    this.value = node.value;
    this.type = node.type == 'LinkAttribute' ? 1 : 2;
    this.link = node.link || this.type == 1;
    this.translate = node.translate;
    this.literals = node.literals;
    this.figure = figure;
    this.template = template;
    this.ssr = isSSR(options);
    this.localFn = this.link ? 'link' : 'translate';
    this.has = {
      braces: includes('{', this.value),
      fn: includes('(', this.value),
      parameter: includes('|', this.value),
    };
    this.parameter = RAW_EMPTY;
    this.lang = RAW_EMPTY;
  }

  bootstrap() {
    const { nodeName, value, ssr, link, translate, template, figure, literals, type, has } = this;

    if (link) template.link = true;
    if (translate) template.translate = true;

    if (has.fn) {
      const open = value.indexOf('(');
      this.name = value.slice(0, open).trim();
      this.value = value.slice(open).trim();
    } else if (has.parameter) {
      const splited = split('|', value);
      this.name = splited[0];
      this.parameter = splited[1];
      this.lang = splited[2] || RAW_EMPTY;

      if (this.lang || !includes('{', this.parameter)) {
        template.loadLanguage.push(this.lang || this.parameter);
      }
    }

    if (ssr && type == 1) {
      const that = this;
      figure.startBlock();
      figure.addSpot({
        generate() {
          const param = ['$parent'];
          push(adaptDefine(nodeName), param);
          push(that.createLink(), param);
          return `$parent = $.ssrAttribute(${join(RAW_COMMA, param)});`;
        },
      });
      figure.endBlock();
      return;
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
    let { nodeName, type, figure, link, translate } = this;
    if (type == 1) figure.appendBlock(nodeName + '="');
    if (link) figure.appendBlock($var(this.createLink()));
    if (translate) figure.appendBlock($var(this.createTranslate()));
    if (type == 1) figure.appendBlock('"');
  }

  createLink() {
    let { name, parameter, localFn, value, has, lang } = this;
    if (has.parameter) {
      const param = [];
      if (!includes('{', parameter)) {
        push('{}', param);
        parameter = $str(parameter);
      }
      push(parameter, param);
      if (lang) push($str(lang), param);
      return `${localFn}(${$ltr(name)},${join(RAW_COMMA, param)})`;
    }
    if (has.braces) value = simpleBracesConvert(value);
    return `${localFn}(${$ltr(value)})`;
  }

  createTranslate() {
    let { name, value, localFn, has, parameter, lang } = this;
    if (has.fn) return `${localFn}(${$ltr(name)})${value}`;
    if (has.parameter) {
      const param = [];
      if (!includes('{', parameter)) {
        push('{}', param);
        parameter = $str(parameter);
      }
      push(parameter, param);
      if (lang) push($str(lang), param);
      return `${localFn}(${$ltr(name)},${join(RAW_COMMA, param)})`;
    }
    return `${localFn}(${$ltr(value)})`;
  }

  generate() {
    const { nodeName, type, reference, link, translate } = this;
    const param = [$el(reference)];
    let fn;
    let content = RAW_EMPTY;

    if (type == 1) {
      push($str(nodeName), param);
    }

    if (link) content = this.createLink();
    if (translate) content = this.createTranslate();

    if (type == 1) fn = 'Attribute';
    else if (type == 2) fn = 'Text';

    push($lamb(content), param);
    return `$.${fn}(${join(RAW_COMMA, param)});`;
  }
}
