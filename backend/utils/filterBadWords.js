const { Filter } = require('bad-words');

const filter = new Filter();

module.exports = (comment) => filter
    .clean(String(comment || ''))
    .replace(/\*+/g, '***');
