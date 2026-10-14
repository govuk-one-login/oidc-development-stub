
import { build } from 'esbuild';
import { resolve } from 'path';
import { copy } from 'esbuild-plugin-copy';

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
external: ['fsevents'],
 plugins:  [
    // Copy Nunjucks templates and static assets into the build output
    copy({
      resolveFrom: 'cwd',
      assets: [
        {
          from: ['./src/views/**/*'],
          to: [`dist/views`],
        },
        {
          from: ['./public/**/*'],
          to: [`dist/public`],
        }, 
        {
          from: ['./node_modules/govuk-frontend/dist/**/*'],
          to: [`dist/node_modules/govuk-frontend/dist`],
        }
      ],
    }),
  ]
});