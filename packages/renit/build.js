import { createBundle } from 'dts-buddy';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('.', import.meta.url));
const pkg = JSON.parse(fs.readFileSync(`${dir}/package.json`, 'utf-8'));

async function dts() {
  for (const name of ['helper', 'collect', 'is', 'math', 'parser', 'to']) {
    fs.writeFileSync(`${dir}/${name}.d.ts`, `import './type/index.js';`);
  }
  fs.writeFileSync(`${dir}/index.d.ts`, `import './type/index.js';`);
}

async function types() {
  await createBundle({
    project: 'jsconfig.json',
    output: `${dir}/type/index.d.ts`,
    compilerOptions: {
      strict: true,
    },
    modules: {
      [pkg.name]: `${dir}/src/index.js`,
      [`${pkg.name}/helper`]: `${dir}/src/helpers/index.js`,
      [`${pkg.name}/collect`]: `${dir}/src/libraries/collect/index.js`,
      [`${pkg.name}/is`]: `${dir}/src/libraries/is/index.js`,
      [`${pkg.name}/math`]: `${dir}/src/libraries/math/index.js`,
      [`${pkg.name}/parser`]: `${dir}/src/libraries/parser/index.js`,
      [`${pkg.name}/to`]: `${dir}/src/libraries/to/index.js`,
    },
  });
}

(async () => {
  await dts();
  await types();
})();
