import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
// Separate artifact with no production environment or reachable payment/backend endpoints.
export default defineConfig({
 plugins:[react()],envDir:"/tmp/catalyst-empty-env",alias:{},
 resolve:{alias:{"@":path.resolve(__dirname,"src")}},
 define:{"import.meta.env.VITE_SUPABASE_URL":JSON.stringify("https://preview.invalid"),"import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY":JSON.stringify("preview-public-key")},
 build:{outDir:"dist-pricing",rollupOptions:{input:"pricing-preview.html"}},
 server:{host:"0.0.0.0",allowedHosts:true},
 preview:{host:"0.0.0.0",allowedHosts:true},
});
