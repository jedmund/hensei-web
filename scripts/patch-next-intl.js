#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Recursively find all .js files in a directory
function findJsFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findJsFiles(fullPath, files);
    } else if (item.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Find all JS files in next-intl dist folder
const distPath = path.join(process.cwd(), 'node_modules/next-intl/dist');
const filesToPatch = findJsFiles(distPath);

let patchCount = 0;

filesToPatch.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Replace imports from Next.js modules to include .js extension
    // Handle both minified and non-minified code
    content = content.replace(/from"next\/navigation"/g, 'from"next/navigation.js"');
    content = content.replace(/from "next\/navigation"/g, 'from "next/navigation.js"');
    content = content.replace(/from'next\/navigation'/g, "from'next/navigation.js'");
    content = content.replace(/from 'next\/navigation'/g, "from 'next/navigation.js'");
    
    content = content.replace(/from"next\/link"/g, 'from"next/link.js"');
    content = content.replace(/from "next\/link"/g, 'from "next/link.js"');
    content = content.replace(/from'next\/link'/g, "from'next/link.js'");
    content = content.replace(/from 'next\/link'/g, "from 'next/link.js'");
    
    content = content.replace(/from"next\/headers"/g, 'from"next/headers.js"');
    content = content.replace(/from "next\/headers"/g, 'from "next/headers.js"');
    content = content.replace(/from'next\/headers'/g, "from'next/headers.js'");
    content = content.replace(/from 'next\/headers'/g, "from 'next/headers.js'");
    
    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      patchCount++;
      console.log(`✓ Patched ${path.relative(process.cwd(), filePath)}`);
    }
  }
});

console.log(`✅ Patching complete - ${patchCount} files patched`);