#!/usr/bin/env node
/* Bundles index.html + styles.css + every data file + app.js into a single
   self-contained examplify.html that runs straight from the filesystem.
   Usage:  node build.js                                        */

const fs = require('fs');
const path = require('path');

const root = __dirname;
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

let html = read('index.html');

// Inline the stylesheet.
html = html.replace(
  /<link rel="stylesheet" href="([^"]+)">/g,
  (_, href) => '<style>\n' + read(href).trimEnd() + '\n</style>'
);

// Inline every script, preserving order.
const scriptTags = [];
html = html.replace(
  /<script src="([^"]+)"><\/script>/g,
  (_, src) => {
    scriptTags.push(src);
    const banner = '/* ===== ' + src + ' ===== */';
    return '<script>\n' + banner + '\n' + read(src).trimEnd() + '\n</script>';
  }
);

const out = path.join(root, 'examplify.html');
fs.writeFileSync(out, html);
const kb = (fs.statSync(out).size / 1024).toFixed(0);

console.log('Built examplify.html (' + kb + ' KB)');
console.log('Inlined ' + scriptTags.length + ' scripts:');
scriptTags.forEach((s) => console.log('  · ' + s));
