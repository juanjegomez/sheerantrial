const prompts = require('prompts');
const path = require('path');
const fs = require('fs');
const request = require('superagent');
const kleur = require('kleur');
const { execSync } = require('child_process');
const sizeOf = require('image-size');
const generateFallbackData = require('./fallbackTemplate');
const generateCapiData = require('../src/capi');

let config;

try {
  config = require('../config.json');
} catch (error) {
  console.log(kleur.italic().yellow(`Looks like you're missing your config.json`));
  console.log(kleur.red(`Exiting deployment.`));
  process.exit(1);
}

async function run() {
  if (!config.uuid) {
    console.log();
    console.log(kleur.red('Please set a uuid in config.json'));
    console.log(kleur.red(`Exiting deployment.`));
    console.log();
    return process.exit(1);
  }

  if (!config.slug) {
    console.log();
    console.log(kleur.red('Please set a slug in config.json'));
    console.log(kleur.red(`Exiting deployment.`));
    console.log();
    return process.exit(1);
  }

  const response = await prompts([
    {
      type: 'select',
      name: 'env',
      message: 'Select an environment',
      choices: [
        { title: 'Development', value: 'development' },
        { title: 'Production', value: 'production' },
      ],
      initial: 0,
    },
    {
      type: prev => (prev === 'production' ? 'confirm' : null),
      name: 'prodConfirm',
      message: 'Please confirm that you want to deploy to Production?',
    },
    {
      type: 'confirm',
      name: 'projectNameConfirm',
      message: `Is this the correct project name: ${config.slug}?`,
    },
  ]);

  // stop if env prod is not confirmed
  if (response.prodConfirm === false || response.projectNameConfirm === false) return;
  const { env } = response;
  const destination =
    env === 'development'
      ? `${config.slug}-${config.uuid}-dev`
      : `${config.slug}-${config.uuid}`;

  build(env);
  await attachFallbackImage(destination);
  await attachCapi(destination);
  await upload(destination);
}

function build(env) {
  console.log();
  console.log(`Building your inset ...`);
  const command = config.ssg ? `babel-node lib/ssg.js` : `NODE_ENV=${env} webpack`;
  execSync(command, { stdio: 'inherit' });
}

async function attachFallbackImage(destination) {
  if (!config.fallbackImage) return;

  const url = config.fallbackImage;
  const image = await request.get(url).responseType('arraybuffer');
  const dimensions = sizeOf(image.body);
  const file = path.resolve(__dirname, '../dist/inset.json');
  const inset = JSON.parse(fs.readFileSync(file, 'utf8'));
  inset.alt = generateFallbackData(url, dimensions, destination);

  fs.writeFileSync(file, JSON.stringify(inset));

  console.log();
  console.log(kleur.green('Fallback image added to inset.json'));
}

async function attachCapi() {
  if (!config.capi) return;

  const capi = await generateCapiData();
  const file = path.resolve(__dirname, '../dist/inset.json');
  const inset = JSON.parse(fs.readFileSync(file, 'utf8'));
  inset.alt = {
    ...inset.alt,
    capi,
  };

  fs.writeFileSync(file, JSON.stringify(inset));

  console.log();
  console.log(kleur.green('CAPI has been added to inset.json'));
}

async function upload(destination) {
  console.log();
  console.log(`Uploading your inset ...`);

  const dist = path.resolve(__dirname, '../dist');

  try {
    const files = fs
      .readdirSync(dist, { withFileTypes: true })
      .filter(file => !file.isDirectory())
      .map(file => file.name);

    const promises = files.map(async file => {
      const filepath = path.join(dist, file);
      return await request
        .post(
          `https://wsj-news-graphics-uploader.sc.onservo.com/api/v2/dice/${destination}/${file}`,
        )
        .attach('file', filepath, file);
    });

    const responses = await Promise.all(promises);

    const isOk = responses.every(response => response.ok);

    if (!isOk) {
      console.log();
      console.log(kleur.red('There was an error uploading your inset.'));
      console.log(kleur.red(`Exiting deployment.`));
      console.log();
      return process.exit(1);
    }

    const insetResponse = responses.find(response =>
      /\.json$/.test(response.body.urls.cached),
    );
    const iframeResponse = responses.find(response =>
      /iframe\.html$/.test(response.body.urls.cached),
    );

    const insetUrl = insetResponse.body.urls.cached;
    const iframeUrl = iframeResponse.body.urls.cached;

    const ouput = [
      ['Inset URL', insetUrl],
      [
        'Preview',
        `https://wsj-newsroom-tools.sc.onservo.com/dynamic-inset-previewer?url=${insetUrl}&layout=inline&template=immersive`,
      ],
      ['Iframe', iframeUrl],
      config.capi && [
        'CAPI Simulator',
        `https://wsj-newsroom-tools.sc.onservo.com/capi-simulator?url=${insetUrl}`,
      ],
    ].filter(i => i);

    console.log();
    console.log(kleur.green(`Your inset has been deployed.`));
    console.log();
    console.log('-----\n');
    ouput.forEach(element => {
      console.log(element.join('\n'), '\n');
    });
    console.log('-----');
  } catch (error) {
    console.log(error);
  }
}

run();
