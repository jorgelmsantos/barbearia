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

  // 🔥 MULTI BARBEARIA (fase futura já preparado)
  barbeariaId: {
    type: String,
    default: 'default'
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
    enum: ['ativo', 'cancelado'],
    default: 'ativo'
  },

  // 🔥 PAGAMENTO DO SERVIÇO (PIX)
  statusPagamento: {
    type: String,
    enum: ['pendente', 'pago'],
    default: 'pendente'
  },

  // 🔥 DADOS DO PIX
  pagamento: {
    tipo: {
      type: String,
      default: 'pix'
    },
    txid: String, // id do pagamento (futuro gateway)
    qrCode: String, // base64 ou texto PIX copia e cola
    valorPago: Number,
    dataPagamento: Date
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('agendamentos', AgendamentoSchema);