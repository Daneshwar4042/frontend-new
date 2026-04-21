// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";

// export default defineConfig({
//   plugins: [react()],
//   build: {
//     outDir: "../backend new/client",
//     emptyOutDir: false
//   }
// });


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',   // REQUIRED for Catalyst
  build: {
    outDir: 'dist'
  }
})