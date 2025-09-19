// js/pipeline.js
import {
    saveViewerSettingsAPI,
    loadViewerSettingsAPI
  } from '../engine/parameters/viewerApi.js';
  
  // Platz für echte Backend‑Bibliothek:
  // import { listPipelines, createPipeline, getSettings, saveSettings, createScreenshots } from './api.js';
  
  let pipelines = [];
  
  async function fetchPipelines() {
    // TODO: fetch von /api/pipelines
    // pipelines = await listPipelines();
    pipelines = [
      { id: 1, name: 'Pipeline A' },
      { id: 2, name: 'Pipeline B' },
    ];
    renderList();
  }
  
  function renderList(filter = '') {
    const ul = document.getElementById('fileList');
    ul.innerHTML = '';
    pipelines
      .filter(p => p.name.toLowerCase().includes(filter.toLowerCase()))
      .forEach(p => {
        let li = document.createElement('li');
        li.textContent = p.name;
        li.onclick = () => editPipeline(p.id);
        ul.appendChild(li);
      });
  }
  
  function editPipeline(id) {
    // TODO: echte Einstellungen vom Server holen:
    // let settings = await getSettings(id);
    document.getElementById('contentArea').innerHTML = `<p>Editiere Pipeline #${id}</p>`;
  }
  
  async function saveCurrent() {
    // TODO: saveSettings(pipelineId, formData);
    alert('Settings gespeichert!');
  }
  
  function nextStep() {
    const selectedId = pipelines[0]?.id;
    if (!selectedId) return;
    // Weiter zum Viewer, Pipeline‑ID im Hash oder Query‑String
    window.location.href = `viewer.html?pipelineId=${selectedId}`;
  }
  
  window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnNew').onclick = async () => {
      // TODO: createPipeline({ name: 'Neue Pipeline' })
      pipelines.push({ id: Date.now(), name: 'Neue Pipeline' });
      renderList();
    };
    document.getElementById('btnSave').onclick = saveCurrent;
    document.getElementById('btnNext').onclick = nextStep;
    document.getElementById('fileSearch').oninput = e => renderList(e.target.value);
  
    fetchPipelines();
  });
  