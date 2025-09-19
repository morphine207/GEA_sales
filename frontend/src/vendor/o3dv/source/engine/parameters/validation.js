// src/vendor/o3dv/source/engine/parameters/validation.js

import { DownloadUrlAsFile } from '../../website/utils.js';
import { matchCoords_abs } from './matchCoords.js';

export function downloadValidationReport(meshData, saved, tolerance, filename) {
  const lines = [];
  lines.push('Validation Report');
  lines.push('Tolerance: ' + (tolerance * 100) + '%');
  lines.push('----------------------------------------');

  meshData.forEach(function(item, idx) {
    const curName     = item.name;
    const curCoords   = item.coords;
    const meshVisible = item.meshVisible;

    let match = null;
    for (let i = 0; i < saved.length; i++) {
      if (matchCoords_abs(saved[i].coords, curCoords, tolerance)) {
        match = saved[i];
        break;
      }
    }

    let deviation = 'n/a';
    if (match) {
      const dx = curCoords[0] - match.coords[0];
      const dy = curCoords[1] - match.coords[1];
      const dz = curCoords[2] - match.coords[2];
      deviation = Math.sqrt(dx*dx + dy*dy + dz*dz).toFixed(3);
      lines.push(
        `Mesh ${idx}: Name alt="${match.name}", Name neu="${curName}", deviation=${deviation}, flag=${match.vis}`
      );
    } else {
      lines.push(
        `Mesh ${idx}: Name neu="${curName}" → kein Match, defaultVis=${meshVisible}`
      );
    }
  });

  const report = lines.join('\n');
  const blob   = new Blob([report], { type: 'text/plain' });
  const url    = URL.createObjectURL(blob);
  DownloadUrlAsFile(url, filename);
}
