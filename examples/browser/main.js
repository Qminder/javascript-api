import * as Qminder from '../../build/qminder-api.js';

const buttonEl = document.getElementById('load-button');
const outputEl = document.getElementById('output');
const apiKeyEl = document.getElementById('apikey');

buttonEl.addEventListener('click', async () => {
  Qminder.setKey(apiKeyEl.value);
  const locations = await Qminder.locations.list();
  for (const location of locations) {
    const div = document.createElement('div');
    div.textContent = location.name;
    outputEl.appendChild(div);
  }
});
