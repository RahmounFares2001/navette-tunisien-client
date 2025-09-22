import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist/client',
  },
  ssr: {
    noExternal: [
      'react-router-dom', 
      'react-router', 
      '@remix-run/router',
      'react-helmet-async',
      'lodash',
      '@reduxjs/toolkit',
      'react-redux'
    ],
  },
}));