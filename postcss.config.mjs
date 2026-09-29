/** @type {import('postcss-load-config').Config} */
// Tailwind v4 runs entirely through its PostCSS plugin; there is no tailwind.config file.
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
