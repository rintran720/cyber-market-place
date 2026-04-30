import type { Config } from "tailwindcss";
import cyberpunkPreset from "@rintran720/cyberpunk-ui/tailwind.preset";

const config: Config = {
  presets: [cyberpunkPreset],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
};

export default config;
