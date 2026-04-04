const mongoose = require('mongoose');

const AgendamentoSchema = new mongoose.Schema({
  clienteId: String,
  grupoId: String, // 🔥 AGRUPADOR

  nomeCliente: String,
  telefone: String,

  servico: String,
  barbeiro: String,
  data: String,
  hora: String,

  valor: Number,

  status: {
    type: String,
    default: 'ativo'
  },

  statusPagamento: {
    type: String,
    default: 'pendente'
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('agendamentos', AgendamentoSchema);