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
    babel: {
      presets: ['es2015', 'stage-0', 'react'],
      plugins: ['dev-expression'],
    },
    less: {},
    sass: {
      options: {
        includePaths: [
          'node_modules/bootstrap/scss',
          'node_modules/select2/src/scss',
          'node_modules/select2-bootstrap-theme/src',
        ],
      },
    },
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
