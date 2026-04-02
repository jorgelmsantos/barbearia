const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
  nome: String,
  email: String,
  senha: String,

  // 🔥 PLANO FIDELIDADE
  planoAtivo: {
    type: Boolean,
    default: false
  },

  validadePlano: {
    type: Date,
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model('usuarios', UsuarioSchema);