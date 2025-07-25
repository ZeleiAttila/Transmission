require('./builder/defaultBuildEnv');
const { DefinePlugin } = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

const outputPath = BUILD_ENV.outputPath;
const mode = BUILD_ENV.mode;
const devtool = BUILD_ENV.devtool;
const babelEnvOptions = BUILD_ENV.babelEnvOptions;
const browser = BUILD_ENV.browser;

const config = {
  entry: {
    background: './src/bg/bg.js',  // fontos: ez lesz a service worker
    index: './src/pages/Index',
    options: './src/pages/Options',
    tabUrlFetch: './src/tabUrlFetch',
  },
  output: {
    filename: '[name].js',
    chunkFilename: '[name].chunk.js',
    path: path.join(outputPath, 'src')
  },
  mode: mode,
  devtool: devtool,
  // fontos: ne legyen splitChunks a background-ra
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons_ui: {
          name: 'commons-ui',
          chunks: chunk => ['index', 'options'].includes(chunk.name),
          minChunks: 2,
          priority: 5
        }
      }
    }
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: [
              ['@babel/plugin-proposal-decorators', { legacy: true }],
              '@babel/plugin-syntax-dynamic-import',
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-proposal-optional-chaining'
            ],
            presets: [
              '@babel/preset-react',
              ['@babel/preset-env', babelEnvOptions]
            ]
          }
        }
      },
      {
        test: /\.(css|less)$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'less-loader'
        ]
      },
      {
        test: /\.(gif|png|svg)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192
            }
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  plugins: [
    new DefinePlugin({
      'typeof fetch': JSON.stringify('function')
    }),
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false,
      cleanOnceBeforeBuildPatterns: [
        outputPath
      ]
    }),
    new CopyWebpackPlugin([
      { from: './src/assets/icons', to: './assets/icons' },
      { from: './src/_locales', to: './_locales' },
      {
        from: './src/manifest.json',
        transform: function (content, path) {
          const manifest = JSON.parse(content.toString());
          manifest.manifest_version = 3;
          manifest.background = {
            service_worker: 'background.js',
            type: 'module'
          };
          if (browser === 'firefox') {
            manifest.browser_specific_settings = {
              gecko: { strict_min_version: '48.0' }
            };
            manifest.options_ui = {
              page: manifest.options_page,
              open_in_tab: true
            };
            delete manifest.options_page;
            delete manifest.minimum_chrome_version;
          }
          return Buffer.from(JSON.stringify(manifest, null, 4));
        }
      }
    ]),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[name].chunk.css'
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './src/templates/index.html',
      chunks: ['commons-ui', 'index'],
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true
      }
    }),
    new HtmlWebpackPlugin({
      filename: 'options.html',
      template: './src/templates/options.html',
      chunks: ['commons-ui', 'options'],
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true
      }
    }),
    new DefinePlugin({
      'BUILD_ENV': Object.entries(BUILD_ENV).reduce((obj, [key, value]) => {
        obj[key] = JSON.stringify(value);
        return obj;
      }, {})
    })
  ]
};

// Production CSS optimalizálás
if (mode === 'production') {
  config.plugins.push(
    new OptimizeCssAssetsPlugin({
      assetNameRegExp: /\.css$/g,
      cssProcessor: require('cssnano'),
      cssProcessorPluginOptions: {
        preset: ['default', { discardComments: { removeAll: true } }]
      },
      canPrint: true
    })
  );
}

module.exports = config;
