const mongoose = require('mongoose');

const ServicoSchema = new mongoose.Schema({
  nome: String,
  preco: Number
});

module.exports = mongoose.model('Servico', ServicoSchema);