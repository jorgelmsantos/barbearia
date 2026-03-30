const mongoose = require('mongoose');

const AgendamentoSchema = new mongoose.Schema({
  clienteId: {
    type: String,
    required: false
  },
  nomeCliente: String,
  telefone: String,
  servico: String,
  barbeiro: String,
  data: String,
  hora: String,

  // 🔥 STATUS DO AGENDAMENTO
  status: {
    type: String,
    default: 'ativo' // ativo | cancelado
  }
}, {
  timestamps: true // 🔥 ajuda muito no futuro (criação/atualização)
});

module.exports = mongoose.model('agendamentos', AgendamentoSchema);