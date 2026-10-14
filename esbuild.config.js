
import { build } from 'esbuild';
import { resolve } from 'path';

await build({
  entryPoints: [resolve('src/handler.ts')],
  bundle: true,
  outfile: resolve("dist", 'index.js'),
  platform: 'node',
  target: 'node22',
  format: 'esm',
  minify: true,
  sourcemap: false,
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
});