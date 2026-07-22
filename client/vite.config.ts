import { defineConfig } from 'vite';
import obfuscator from 'vite-plugin-javascript-obfuscator';

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

  return {
    root: '.',
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': { target: 'http://127.0.0.1:3000', changeOrigin: true },
        '/ws': { target: 'ws://127.0.0.1:3000', ws: true, changeOrigin: true },
      },
    },
    build: {
      target: 'es2022',
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: { drop_console: true, drop_debugger: true, passes: 2 },
        mangle: { toplevel: true },
        format: { comments: false },
      },
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[hash].js',
          chunkFileNames: 'assets/[hash].js',
          assetFileNames: 'assets/[hash][extname]',
        },
      },
    },
    plugins: isProd
      ? [
          obfuscator({
            include: ['**/*.js'],
            exclude: [/node_modules/],
            apply: 'build',
            options: {
              compact: true,
              controlFlowFlattening: true,
              controlFlowFlatteningThreshold: 0.9,
              deadCodeInjection: true,
              deadCodeInjectionThreshold: 0.4,
              debugProtection: true,
              debugProtectionInterval: 4000,
              disableConsoleOutput: true,
              identifierNamesGenerator: 'hexadecimal',
              renameGlobals: false,
              selfDefending: true,
              simplify: true,
              splitStrings: true,
              splitStringsChunkLength: 8,
              stringArray: true,
              stringArrayEncoding: ['rc4'],
              stringArrayIndexShift: true,
              stringArrayRotate: true,
              stringArrayShuffle: true,
              stringArrayWrappersCount: 5,
              stringArrayWrappersChainedCalls: true,
              stringArrayWrappersParametersMaxCount: 5,
              stringArrayWrappersType: 'function',
              stringArrayThreshold: 1,
              transformObjectKeys: true,
              unicodeEscapeSequence: false,
            },
          }),
        ]
      : [],
  };
});
