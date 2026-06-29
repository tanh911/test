
const fs = require('fs');
const q = require('./src/data/questions_translated.json');

const isB = (x) => {
  if (typeof x.id !== 'string') return true;
  
  // Keep all Grundstoff
  if (x.id.startsWith('1.')) return true;

  const t =
<truncated 1291 byte