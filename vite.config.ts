import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { validatePublicEnvironment } from './scripts/validatePublicEnvironment.js';

export default defineConfig(({ mode }) => {
  validatePublicEnvironment({ ...loadEnv(mode, process.cwd(), 'VITE_'), ...Object.fromEntries(Object.entries(process.env).filter(([name]) => name.startsWith('VITE_'))) });
  return {
    base: process.env.GITHUB_PAGES === 'true' ? '/taipei-faith-map/' : '/',
    plugins: [react()],
  };
});
