const pkg = require("./package.json");
const esbuild = require('esbuild');
const { nodeExternalsPlugin } = require('esbuild-node-externals')

esbuild
  .build({
    entryPoints: ['src/index.ts'],
    outfile: pkg.main,
    bundle: true,
    sourcemap: true,
    target: ['es2017'],
    plugins: [nodeExternalsPlugin()]
  })
  .catch(() => process.exit(1));

esbuild
  .build({
    entryPoints: ['src/index.ts'],
    outdir: 'dist',
    bundle: true,
    sourcemap: true,
    format: 'esm',
    target: ['es2017'],
    plugins: [nodeExternalsPlugin()]
  })
  .catch(() => process.exit(1));