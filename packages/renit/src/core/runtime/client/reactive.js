export function reactive(self, fn, cb) {
  self.$w.push({ fn, cb });
}
