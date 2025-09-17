import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import checker from "vite-plugin-checker";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    checker({
      typescript: {
        tsconfigPath: "tsconfig.json",
        // dev: { overlay: false },
      },
      // eslint: {
      //   lintCommand: 'eslint "src/**/*.{ts,tsx}"',
      // },
    }),
  ],
});