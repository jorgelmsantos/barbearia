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
  },

  limiteMensal: {
    type: Number,
    default: 0
  },

  usosNoMes: {
    type: Number,
    default: 0
  },

  // 💳 CONTROLE DE PAGAMENTO PIX (PLANO)
  pagamentoPlano: {
    status: {
      type: String,
      enum: ['pendente', 'pago'],
      default: 'pendente'
    },
    valor: Number,
    dataPagamento: Date
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('usuarios', UsuarioSchema);