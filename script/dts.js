import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createBundle } from 'dts-buddy';

const dir = fileURLToPath(new URL('..', import.meta.url));
const pkg = JSON.parse(fs.readFileSync(`${dir}/package.json`, 'utf-8'));

const output = `${dir}/types/index.d.ts`;

for (const name of ['is', 'type']) {
  fs.writeFileSync(`${dir}/${name}.d.ts`, "import './types/index.js';");
}

fs.writeFileSync(`${dir}/index.d.ts`, "import './types/index.js';");

await createBundle({
  project: 'tsconfig.json',
  output: output,
  compilerOptions: {
    strict: true
  },
  modules: {
    [pkg.name]: `${dir}/dist/index.d.ts`,
    [`${pkg.name}/is`]: `${dir}/dist/is/index.d.ts`,
    [`${pkg.name}/type`]: `${dir}/dist/type/index.d.ts`
  }
});

const moduleTypes = [
  {
    name: 'renit/is',
    types: ['Include']
  }
];

for await (const module of Object.values(moduleTypes)) {
  const lines = fs.readFileSync(output).toString().split('\n');
  const line = findModule(lines, module.name);
  lines.splice(
    line + 1,
    0,
    `  import type { ${module.types.join()} } from "renit/type";`
  );
  var text = lines.join('\n');
  fs.writeFileSync(output, text);
}

function findModule(data, name) {
  return data.findIndex((line) => line === `declare module '${name}' {`);
}
