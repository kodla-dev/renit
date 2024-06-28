export class ClassSpot {
  constructor(parent, node) {
    this.reference = parent.reference;
  }
  generate(component) {
    return `$.class(${this.generateArguments(component)});`;
  }
  generateArguments(component) {}
}
