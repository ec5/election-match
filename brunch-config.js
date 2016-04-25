module.exports = {
  files: {
    javascripts: {
      joinTo: {
        'vendor.js': /^(?!app)/,
        'app.js': /^app/
      }
    },
    stylesheets: {
      joinTo: 'app.css',
    },
  },

  plugins: {
    babel: {presets: ['es2015', 'stage-0']},
    less: {},
    uglify: {
      compress: {
        drop_console: true,
      },
    },
  },

  overrides: {
    production: {
      optimize: true,
      sourceMaps: false,
      plugins: {autoReload: {enabled: false}},
    },
  },
}
