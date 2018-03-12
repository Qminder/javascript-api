// Loads Qminder API and Sinon for Node.js tests into this.Qminder and this.sinon.
// The web tests automatically load the API and Sinon with Karma's file list & plugin system, so
// they are available globally.
beforeAll(function() {
  this.Qminder = require('../build-node/qminder-api');
  this.sinon = require('sinon');
  this.isNode = true;
});
