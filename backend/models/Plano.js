const mongoose = require('mongoose');

const PlanoSchema = new mongoose.Schema({
  nome: String,
  valor: Number,
  limiteMensal: Number,
  ativo: Boolean
});

module.exports = mongoose.model('Plano', PlanoSchema);