
const fs = require('fs');
const q = require('./src/data/questions_translated.json');

const isB = (q) => {
  const t = (q.textDe + ' ' + (q.options || []).map(o => o.textDe).join(' ')).toLowerCase();
  
  // If explicitly mentions Klasse
<truncated 1844 byte