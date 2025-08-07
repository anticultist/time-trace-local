import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/extension.ts'],
  format: ['cjs'],
  target: 'node18',
  external: ['vscode'],
  sourcemap: true,
  clean: true,
  dts: false,
});
