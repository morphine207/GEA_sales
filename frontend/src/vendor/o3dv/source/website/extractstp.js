// src/vendor/o3dv/source/website/extractStepHierarchy.js

/**
 * Extrahiert aus einer STEP-Datei die Hierarchie von Baugruppen (PRODUCT) und Einzelteilen (z.B. MANIFOLD_SOLID_BREP)
 * und gibt für jedes Einzelteil die Beziehung zur Baugruppe zurück.
 *
 * Rückgabe: {
 *   "filename.stp": {
 *     products: { [productId]: { name, children: [childProductId, ...] } },
 *     solids:   { [solidId]: { name, parentProductId } }
 *   }
 * }
 */
export async function extractStepHierarchy(files) {
  const results = {};

  await Promise.all(
    files.map(file =>
      new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => {
          const text = /** @type {string} */ (reader.result);

          // 1. Alle Entities extrahieren
          const entities = {};
          const re = /#(\d+)\s*=\s*([A-Z0-9_]+)\s*\(([^;]*)\);/g;
          let m;
          while ((m = re.exec(text)) !== null) {
            const id = m[1];
            const type = m[2];
            const args = m[3];
            let name = null;
            const nameMatch = args.match(/^['"]([^'"]+)['"]/);
            if (nameMatch) name = nameMatch[1];
            const refs = [];
            const refRe = /#(\d+)/g;
            let refMatch;
            while ((refMatch = refRe.exec(args)) !== null) {
              refs.push(refMatch[1]);
            }
            entities[id] = { type, name, refs, args };
          }

          // 2. Produkte (PRODUCT) extrahieren
          const products = {};
          Object.entries(entities).forEach(([id, ent]) => {
            if (ent.type === "PRODUCT" && ent.name) {
              products[id] = { name: ent.name, children: [] };
            }
          });

          // 3. Beziehungen: PRODUCT_DEFINITION, NEXT_ASSEMBLY_USAGE_OCCURRENCE, etc.
          // Suche Parent-Child-Relationen (Baugruppe → Einzelteil)
          Object.entries(entities).forEach(([id, ent]) => {
            if (ent.type === "NEXT_ASSEMBLY_USAGE_OCCURRENCE" && ent.refs.length >= 2) {
              const parentId = ent.refs[0];
              const childId = ent.refs[1];
              if (products[parentId] && products[childId]) {
                products[parentId].children.push(childId);
              }
            }
          });

          // 4. Einzelteile (MANIFOLD_SOLID_BREP) und deren Parent-Produkt finden
          const solids = {};
          Object.entries(entities).forEach(([id, ent]) => {
            if (ent.type === "MANIFOLD_SOLID_BREP") {
              // Parent-Produkt suchen (über Referenzkette nach oben)
              let currentId = id;
              let parentProductId = null;
              let depth = 0;
              while (currentId && depth < 12) {
                const e = entities[currentId];
                if (!e) break;
                if (products[currentId]) {
                  parentProductId = currentId;
                  break;
                }
                // Nächster Parent (erste Referenz)
                currentId = e.refs[0];
                depth++;
              }
              solids[id] = {
                name: ent.name || null,
                parentProductId
              };
            }
          });

          results[file.name] = { products, solids };
          resolve();
        };
        reader.onerror = () => {
          results[file.name] = { products: {}, solids: {} };
          resolve();
        };
        reader.readAsText(file);
      })
    )
  );

  return results;
}
