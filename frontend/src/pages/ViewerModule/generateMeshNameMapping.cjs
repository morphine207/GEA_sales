// generateComponentNamesTree.cjs
const step = require('node-step');
const fs = require('fs');

const stepFilePath = 'C:/Users/User/Desktop/Project/Tryouts/958964_M10_Z01_ASSY_TBA_MEB21_DISC.stp';
const data = fs.readFileSync(stepFilePath, 'utf8');

const reader = new step.StepReader();
reader.read(data);

const entities = reader.indexer.types;

// Produkte (nur Namen und Children)
const products = {};
for (const [id, entity] of Object.entries(entities)) {
  if (entity.type === 'PRODUCT') {
    products[id] = { name: entity.args[0], children: [] };
  }
}

// Parent-Child-Relationen
for (const entity of Object.values(entities)) {
  if (entity.type === 'NEXT_ASSEMBLY_USAGE_OCCURRENCE') {
    const parentId = entity.args[2]?.replace('#', '');
    const childId = entity.args[3]?.replace('#', '');
    if (products[parentId] && products[childId]) {
      products[parentId].children.push(childId);
    }
  }
}

// Rekursive Baumstruktur nur mit Namen, keine leeren Children-Arrays
function buildNameTree(id) {
  const prod = products[id];
  if (!prod) return null;
  const children = prod.children.map(buildNameTree).filter(Boolean);
  if (children.length > 0) {
    return { name: prod.name, children };
  } else {
    return { name: prod.name };
  }
}

// Top-Level-Produkte finden (ohne Parent)
const allChildIds = new Set(Object.values(products).flatMap(p => p.children));
const topLevel = Object.keys(products).filter(id => !allChildIds.has(id));

// Nur Namen und Struktur ausgeben
const nameTree = topLevel.map(buildNameTree);

// Schön formatiert ausgeben (z.B. als Baum)
function printTree(node, indent = '') {
  if (Array.isArray(node)) {
    node.forEach(n => printTree(n, indent));
  } else if (node) {
    console.log(indent + node.name);
    if (node.children) {
      printTree(node.children, indent + '  ');
    }
  }
}

printTree(nameTree);