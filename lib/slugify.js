// Robust slugify utility for Node scripts and app
function slugify(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/['’]/g, '') // Remove apostrophes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanum with dash
    .replace(/^-+|-+$/g, ''); // Trim leading/trailing dashes
}

module.exports = slugify; 