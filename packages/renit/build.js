import { createBundle } from 'dts-buddy';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('.', import.meta.url));
const pkg = JSON.parse(fs.readFileSync(`${dir}/package.json`, 'utf-8'));

async function dts() {
  for (const name of ['collect', 'define', 'fault', 'helper', 'is', 'math', 'to']) {
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
      [`${pkg.name}/collect`]: `${dir}/src/collect.js`,
      [`${pkg.name}/define`]: `${dir}/src/define.js`,
      [`${pkg.name}/fault`]: `${dir}/src/fault.js`,
      [`${pkg.name}/is`]: `${dir}/src/is.js`,
      [`${pkg.name}/math`]: `${dir}/src/math.js`,
    },
  });
}

(async () => {
  await dts();
  await types();
})();
