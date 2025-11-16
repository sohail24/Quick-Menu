module.exports = {
  content: {
    files: ["./index.html", "./src/**/*.{ts,tsx,css}"],
    safelist: [
      'bg-gray-50',
      'text-gray-900'
    ]
  },
  theme: {
    extend: {}
  },
  plugins: []
};
