const mongoose = require('mongoose');

const AgendamentoSchema = new mongoose.Schema({
  clienteId: String,
  nomeCliente: String,
  telefone: String,

  pedidoId: Number, // 🔥 agrupa pedidos

  servico: String,
  barbeiro: String,
  data: String,
  hora: String,

  valor: Number,

  status: {
    type: String,
    default: 'ativo'
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('agendamentos', AgendamentoSchema);