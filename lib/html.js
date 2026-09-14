'use strict';

// HTML escaping, shared by the login/success pages and the markdown renderer.
// Every piece of text that reaches a response passes through here: the case
// files under tests/ deliberately contain XSS payloads as test data, so
// rendering them unescaped would turn this repository's own test fixtures into
// a working attack.

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);
}

module.exports = { escapeHtml };
