const mongoose = require('mongoose');

const AgendamentoSchema = new mongoose.Schema({
  clienteId: String,
  nomeCliente: String,
  telefone: String,
  servico: String,
  barbeiro: String,
  data: String,
  hora: String
});

module.exports = mongoose.model('agendamentos', AgendamentoSchema);