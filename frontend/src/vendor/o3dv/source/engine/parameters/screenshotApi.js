const API_BASE_URL = "http://localhost:8000/api/screenshot";



// 1. Screenshot (ohne Bild) anlegen
export async function addScreenshot(data) {
  const res = await fetch(`${API_BASE_URL}/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

// 2. Bild zu bestehendem Screenshot hinzufügen
export async function addImageToScreenshot(screenshotId, file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE_URL}/add_image/${screenshotId}`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

// 3. Alle Screenshots zu einer ViewerSettings-ID abrufen
export async function getScreenshotsBySetting(settingId) {
  const res = await fetch(`${API_BASE_URL}/by_setting/${settingId}`);
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

// 4. Einzelnen Screenshot abrufen (ohne Bilddaten)
export async function getSingleScreenshot(screenshotId) {
  const res = await fetch(`${API_BASE_URL}/${screenshotId}`);
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

// 5. Screenshot-Bild abrufen (liefert ein Blob)
export async function getScreenshotImage(screenshotId) {
  const res = await fetch(`${API_BASE_URL}/image/${screenshotId}`);
  if (!res.ok) throw new Error(await res.text());
  return await res.blob();
}

// 6. Screenshot löschen
export async function deleteScreenshot(screenshotId) {
  const res = await fetch(`${API_BASE_URL}/delete/${screenshotId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}