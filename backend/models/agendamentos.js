const mongoose = require('mongoose');

const AgendamentoSchema = new mongoose.Schema({
  clienteId: {
    type: String,
    required: true
  },

  nomeCliente: String,
  telefone: String,

  // 🔥 AGRUPAMENTO (tipo pedido iFood)
  grupoId: {
    type: String,
    required: true
  },

  servico: {
    type: String,
    required: true
  },

  barbeiro: {
    type: String,
    required: true
  },

  data: {
    type: String,
    required: true
  },

  hora: {
    type: String,
    required: true
  },

  valor: {
    type: Number,
    default: 0
  },

  // 🔥 STATUS DO SERVIÇO (individual)
  status: {
    type: String,
    default: 'ativo' // ativo | cancelado
  },

  // 🔥 PAGAMENTO
  statusPagamento: {
    type: String,
    default: 'pendente' // pendente | pago
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('agendamentos', AgendamentoSchema);