const mongoose = require('mongoose');

const AgendamentoSchema = new mongoose.Schema({
  clienteId: String,
  nomeCliente: String,
  telefone: String,
  servico: String,
  barbeiro: String,
  data: String,
  hora: String,

  // 🔥 NOVO CAMPO
  status: {
    type: String,
    default: 'ativo' // ativo | cancelado
  }
});

module.exports = mongoose.model('agendamentos', AgendamentoSchema);