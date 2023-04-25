const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const kleur = require('kleur');
const fs = require('fs');
const homeDir = require('os').homedir();

let config;

try {
  config = require('./config.json');
} catch (error) {
  console.log(kleur.bold().italic().red(`Nothing to build.`));
  console.log(kleur.bold(`Please run 'node setup.js'`));
  process.exit(1);
}

const packageJson = require('./package.json');

const isProd = process.env.NODE_ENV === 'production';
const isDev = process.env.NODE_ENV === 'development';
const isServe = process.env.NODE_ENV === 'serve';

function generateInset(htmlWebpackPlugin) {
  const jsFiles = htmlWebpackPlugin.files.js;
  const cssFiles = htmlWebpackPlugin.files.css;
  let template = `<div id="inset-${config.uuid}"></div>`;
  const tags = [];

  jsFiles.forEach(t => {
    tags.push(`<script defer src="${t}"></script>`);
  });

  cssFiles.forEach(t => {
    tags.push(`<link rel="stylesheet" href="${t}">`);
  });

  template = template.concat(tags.join(''));

  return {
    status: 'OK',
    'dice-version': packageJson.version,
    type: 'InsetDynamic',
    platforms: ['desktop'],
    serverside: {
      data: {
        data: {},
      },
      template: {
        template,
      },
    },
  };
}

let resolve = {};
const plugins = [
  new CleanWebpackPlugin(),
  new MiniCssExtractPlugin({
    filename: '[name].css',
  }),
  new webpack.DefinePlugin({
    __UUID__: JSON.stringify(config.uuid),
    __LAYOUT__: JSON.stringify(config.layout),
  }),
];

if (!isServe) {
  plugins.push(
    new HtmlWebpackPlugin({
      filename: 'inset.json',
      minify: false,
      inject: false,
      publicPath: `https://asset.wsj.net/wsjnewsgraphics/dice/${config.slug}-${
        config.uuid
      }${isDev ? '-dev' : ''}/`,
      templateContent: ({ htmlWebpackPlugin }) => {
        return JSON.stringify(generateInset(htmlWebpackPlugin));
      },
    }),
    new HtmlWebpackPlugin({
      filename: 'iframe.html',
      template: path.resolve(__dirname, 'preview/iframe.html'),
      publicPath: `https://asset.wsj.net/wsjnewsgraphics/dice/${config.slug}-${
        config.uuid
      }${isDev ? '-dev' : ''}/`,
    }),
  );
}

if (isServe) {
  plugins.push(
    new HtmlWebpackPlugin({
      filename: 'immersive.html',
      template: path.resolve(__dirname, 'preview/immersive.html'),
    }),
    new HtmlWebpackPlugin({
      filename: 'standard.html',
      template: path.resolve(__dirname, 'preview/standard.html'),
    }),
    new HtmlWebpackPlugin({
      filename: 'blank.html',
      template: path.resolve(__dirname, 'preview/blank.html'),
    }),
    new HtmlWebpackPlugin({
      filename: 'iframe.html',
      template: path.resolve(__dirname, 'preview/iframe.html'),
    }),
  );
}

const rules = [
  {
    test: /\.js$/,
    exclude: /(node_modules)/,
    use: {
      loader: 'babel-loader',
    },
  },
  {
    test: /\.[ct]sv$/,
    use: [
      {
        loader: 'dsv-loader',
      },
    ],
  },
];

if (config.framework === 'handlebars' || config.framework === 'storyboard') {
  rules.push(
    {
      test: /\.css$/,
      use: [isProd ? MiniCssExtractPlugin.loader : 'style-loader', 'css-loader'],
    },
    {
      test: /\.hbs$/,
      loader: 'handlebars-loader',
      options: {
        partialDirs: [path.resolve(__dirname, 'src/partials')],
        helperDirs: [path.resolve(__dirname, 'src/helpers')],
      },
    },
  );
}

if (config.framework === 'react') {
  rules.push({
    test: /\.css$/,
    use: ['style-loader', 'css-loader'],
  });
}

if (config.framework === 'vue') {
  const { VueLoaderPlugin } = require('vue-loader');

  rules.push(
    {
      test: /\.css$/,
      use: [isProd ? MiniCssExtractPlugin.loader : 'vue-style-loader', 'css-loader'],
    },
    {
      test: /\.vue$/,
      use: {
        loader: 'vue-loader',
      },
    },
  );
  plugins.push(new VueLoaderPlugin());
}

if (config.framework === 'svelte') {
  resolve = {
    extensions: ['.mjs', '.js', '.svelte'],
  };

  rules.push(
    {
      test: /\.css$/,
      use: [isProd ? MiniCssExtractPlugin.loader : 'style-loader', 'css-loader'],
    },
    {
      test: /\.svelte$/,
      use: {
        loader: 'svelte-loader',
      },
    },
    {
      test: /node_modules\/svelte\/.*\.mjs$/,
      resolve: {
        fullySpecified: false,
      },
    },
  );
}

module.exports = {
  mode: isProd ? 'production' : 'development',
  context:
    config.framework === 'handlebars' || config.framework === 'storyboard'
      ? path.resolve(__dirname, 'lib')
      : path.resolve(__dirname, 'src'),
  entry:
    config.framework === 'handlebars' || config.framework === 'storyboard'
      ? './client.js'
      : './index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    iife: true,
  },
  resolve,
  devtool: isProd ? 'source-map' : 'cheap-module-source-map',
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
    minimizer: [
      new CssMinimizerPlugin(),
      new TerserPlugin({
        parallel: true,
      }),
    ],
  },
  module: {
    rules,
  },
  plugins,
  devServer: {
    allowedHosts: 'all',
    hot: true,
    compress: true,
    port: 9000,
    static: {
      directory: path.resolve(__dirname, 'preview'),
    },
    ...(config.https && {
      https: {
        key: fs.readFileSync(`${homeDir}/.consumer-certs/consumer.key`, 'utf8'),
        cert: fs.readFileSync(`${homeDir}/.consumer-certs/consumer.crt`, 'utf8'),
      },
    }),
  },
};
