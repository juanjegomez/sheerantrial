import '../src/styles.css';
import template from '../src/template.hbs';
import getData from '../src/data';
import core from '../src/index';

async function run() {
  const element = document.getElementById(`inset-${__UUID__}`);
  const data = await getData();
  const html = template(data);

  element.innerHTML = html;

  core({
    uuid: __UUID__,
    data,
  });
}

run();

if (module.hot) {
  module.hot.accept();
}
