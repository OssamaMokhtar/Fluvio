import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // SL-15: `define` previously inlined env.GEMINI_API_KEY into the client
      // bundle as process.env.API_KEY and process.env.GEMINI_API_KEY. Nothing
      // leaked in practice because no GEMINI_API_KEY was set after the OpenAI
      // migration — but the mechanism was armed, and SECURITY.md claimed a
      // "build-time check asserts the key cannot appear in the client bundle"
      // that did not exist. Secrets stay server-side; the client talks to /api.
      // scripts/verify-claims.mjs (C-10) now fails the build if this returns.
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
