const mongoose = require('mongoose');

const BarbeiroSchema = new mongoose.Schema({
  nome: String
});

module.exports = mongoose.model('Barbeiro', BarbeiroSchema);