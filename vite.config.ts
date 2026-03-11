import { defineConfig } from "vite";
import deno from "@deno/vite-plugin";
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		deno(),
		vue(),
	],
	root: "src/client",
	server: {
		proxy: {
			"/api": "http://localhost:8888",
		},
	},
	build: {
		assetsDir: "assets",
		outDir: "../../dist/client",
		emptyOutDir: true,
	},
});
