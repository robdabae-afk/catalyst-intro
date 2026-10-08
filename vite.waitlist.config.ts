import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  preview: { host: "0.0.0.0", allowedHosts: ["delinquently-vehemently-undamaged-bluegill.kitten.space", "unknowingly-really-dutiful-ghoul.kitten.space"] },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  // No production backend credentials in the public standalone mock.
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify("https://example.invalid"),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify("mock-preview-not-a-real-key"),
  },
  build: { outDir: "dist-waitlist", rollupOptions: { input: "waitlist-preview.html" } },
});
