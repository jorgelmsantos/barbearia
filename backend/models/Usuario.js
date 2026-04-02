const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
  nome: String,
  email: String,
  senha: String,

  planoAtivo: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('usuarios', UsuarioSchema);