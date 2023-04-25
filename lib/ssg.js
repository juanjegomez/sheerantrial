const path = require('path');
const fs = require('fs');
const Handlebars = require('handlebars');
const webpack = require('webpack');
const MemoryFs = require('memory-fs');
const { oneLine, stripIndents } = require('common-tags');
const jsdom = require('jsdom');

const packageJson = require('../package.json');
const config = require('../config.json');
const getData = require('../src/data');

const LIBRARY = `dice-${config.uuid}`;
const { JSDOM } = jsdom;

async function run() {
  const dist = path.resolve(__dirname, '../dist/');
  const data = await getData.default();

  const css = await getCSS();
  const script = await getJS();
  const html = await generateHTML(data);
  const inset = generateInset(data, css, script, html);
  const iframe = await generateIframe(data, css, script, html);

  if (!fs.existsSync(dist)) {
    fs.mkdirSync(dist);
  }

  fs.writeFileSync(path.resolve(dist, 'inset.json'), JSON.stringify(inset));
  fs.writeFileSync(path.resolve(dist, 'iframe.html'), iframe);
}

async function getCSS() {
  const css = fs.readFileSync(path.resolve(__dirname, '../src/styles.css'), {
    encoding: 'utf8',
  });

  return css;
}

function generateInset(data, css, script, html) {
  const data2add = {
    ...(config.includeData && {
      data,
    }),
    uuid: config.uuid,
  };

  const template = `
    <style>${css}</style>
    <div id="inset-${config.uuid}">${html}</div>
    <script>
      ${script}
      window["${LIBRARY}"].default(${JSON.stringify(data2add)});
    </script>
  `;

  const inset = {
    status: 'OK',
    'dice-version': packageJson.version,
    type: 'InsetDynamic',
    platforms: ['desktop'],
    serverside: {
      data: {
        data: {},
      },
      template: {
        template: oneLine(stripIndents(template)),
      },
    },
  };

  return inset;
}

async function generateIframe(data, css, script, html) {
  const dom = await JSDOM.fromFile(path.resolve(__dirname, '../preview/iframe.html'));

  const data2add = {
    ...(config.includeData && {
      data,
    }),
    uuid: config.uuid,
  };

  const placeholder = dom.window.document.getElementById('inset-<%= __UUID__ %>');
  const frag = JSDOM.fragment(`
    <style>${css}</style>
    <div id="inset-${config.uuid}">${html}</div>
    <script>
      ${script}
      window["${LIBRARY}"].default(${JSON.stringify(data2add)});
    </script>
  `);

  placeholder.replaceWith(frag);

  return dom.serialize();
}

async function generateHTML(data) {
  register();

  const template = Handlebars.compile(
    fs.readFileSync(path.resolve(__dirname, '../src/template.hbs'), {
      encoding: 'utf8',
    }),
  );

  return template(data);
}

function getJS() {
  const compiler = webpack({
    mode: 'production',
    entry: path.resolve(__dirname, '../src/index.js'),
    output: {
      filename: 'bundle.js',
      library: LIBRARY,
      libraryTarget: 'window',
      path: '/',
      chunkFilename: '[name].bundle.js',
    },
    optimization: {
      minimize: true,
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env',
                  {
                    targets: ['last 2 versions', 'IE 11'],
                  },
                ],
              ],
            },
          },
        },
      ],
    },
  });

  compiler.outputFileSystem = new MemoryFs();

  return new Promise(resolve => {
    compiler.run((err, stats) => {
      if (err) reject(err);
      if (stats.hasErrors()) reject(stats.toJson().errors);

      resolve(compiler.outputFileSystem.data['bundle.js'].toString());
    });
  });
}

function register() {
  const HELPERS_DIR = path.resolve(__dirname, '../src/helpers');
  const PARTIALS_DIR = path.resolve(__dirname, '../src/partials');

  const helpers = fs
    .readdirSync(HELPERS_DIR, { withFileTypes: true })
    .filter(i => !i.isDirectory())
    .map(i => i.name);

  const partials = fs
    .readdirSync(PARTIALS_DIR, { withFileTypes: true })
    .filter(i => !i.isDirectory())
    .map(i => i.name);

  helpers.forEach(helper => {
    const helperFn = require(path.resolve(HELPERS_DIR, helper));
    Handlebars.registerHelper(path.parse(helper).name, helperFn);
  });

  partials.forEach(partial => {
    const template = fs.readFileSync(path.resolve(PARTIALS_DIR, partial), 'utf-8');
    Handlebars.registerPartial(path.parse(partial).name, template);
  });
}

run();
