const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ================= MONGO =================
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('✅ Mongo conectado'))
  .catch(err => console.log('❌ Erro Mongo:', err));

// ================= MODELS =================
const Agendamento = require('./models/agendamentos');
const Barbeiro = require('./models/Barbeiro');
const Servico = require('./models/Servico');
const Usuario = require('./models/Usuario');

// 🔥 NOVO MODEL DESPESA
const Despesa = mongoose.model('despesas', new mongoose.Schema({
  descricao: String,
  valor: Number,
  data: {
    type: String,
    default: () => new Date().toISOString().split('T')[0]
  }
}, { timestamps: true }));

// ================= TESTE =================
app.get('/', (req, res) => {
  res.send('API FUNCIONANDO 🚀');
});

// ================= LOGIN =================
app.post('/clientes/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    const usuario = await Usuario.findOne({ email, senha });

    if (!usuario) {
      return res.status(401).json({ erro: 'Login inválido' });
    }

    res.json({ usuario });

  } catch {
    res.status(500).json({ erro: 'Erro no login' });
  }
});

// ================= BARBEIROS =================
app.get('/barbeiros', async (req, res) => {
  const lista = await Barbeiro.find();
  res.json(lista);
});

app.post('/barbeiros', async (req, res) => {
  const novo = await Barbeiro.create(req.body);
  res.json(novo);
});

app.delete('/barbeiros/:id', async (req, res) => {
  await Barbeiro.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// ================= SERVIÇOS =================
app.get('/servicos', async (req, res) => {
  const lista = await Servico.find();
  res.json(lista);
});

app.post('/servicos', async (req, res) => {
  const novo = await Servico.create(req.body);
  res.json(novo);
});

app.delete('/servicos/:id', async (req, res) => {
  await Servico.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// ================= DESPESAS =================
app.get('/despesas', async (req, res) => {
  try {
    const lista = await Despesa.find().sort({ createdAt: -1 });
    res.json(lista);
  } catch {
    res.status(500).json({ erro: 'Erro ao listar despesas' });
  }
});

app.post('/despesas', async (req, res) => {
  try {
    const nova = await Despesa.create({
      descricao: req.body.descricao,
      valor: Number(req.body.valor)
    });

    res.json(nova);
  } catch {
    res.status(500).json({ erro: 'Erro ao criar despesa' });
  }
});

app.delete('/despesas/:id', async (req, res) => {
  try {
    await Despesa.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ erro: 'Erro ao deletar despesa' });
  }
});

// ================= FINANCEIRO =================
app.get('/financeiro/resumo', async (req, res) => {
  try {
    const ag = await Agendamento.find();
    const despesas = await Despesa.find();

    const receita = ag
      .filter(a => a.status !== 'cancelado')
      .reduce((s, a) => s + (a.valor || 0), 0);

    const totalDespesas = despesas
      .reduce((s, d) => s + (d.valor || 0), 0);

    const hoje = new Date().toISOString().split('T')[0];

    const receitaHoje = ag
      .filter(a => a.data === hoje && a.status !== 'cancelado')
      .reduce((s, a) => s + (a.valor || 0), 0);

    res.json({
      receita,
      despesas: totalDespesas,
      saldo: receita - totalDespesas,
      receitaHoje
    });

  } catch {
    res.status(500).json({ erro: 'Erro no financeiro' });
  }
});

// ================= PIX SIMULADO =================
function gerarPixSimulado(valor) {
  return {
    qrCode: `PIX-CODE-${Date.now()}`,
    copiaCola: `000201PIX${valor}${Date.now()}`,
    valor
  };
}

// ================= AGENDAMENTO =================
app.post('/agendamentos/lote', async (req, res) => {
  try {
    const { clienteId, nomeCliente, telefone, itens, formaPagamento } = req.body;

    if (!itens || itens.length === 0) {
      return res.status(400).json({ erro: 'Carrinho vazio' });
    }

    const grupoId = Date.now().toString();

    for (let item of itens) {
      const conflito = await Agendamento.findOne({
        data: item.data,
        hora: item.hora,
        barbeiro: item.barbeiro,
        status: { $ne: 'cancelado' }
      });

      if (conflito) {
        return res.status(400).json({
          erro: `Horário ocupado: ${item.data} ${item.hora}`
        });
      }
    }

    const total = itens.reduce((s, i) => s + (i.valor || 0), 0);

    let pix = null;
    let statusPagamento = 'pendente';

    if (formaPagamento === 'pix') {
      pix = gerarPixSimulado(total);
    }

    const agendamentos = await Promise.all(
      itens.map(item =>
        Agendamento.create({
          clienteId,
          nomeCliente,
          telefone,
          grupoId,
          formaPagamento,
          statusPagamento,
          ...item,
          status: 'ativo'
        })
      )
    );

    res.json({ agendamentos, pix });

  } catch {
    res.status(500).json({ erro: 'Erro ao criar agendamento' });
  }
});

// ================= LISTAR =================
app.get('/agendamentos', async (req, res) => {
  const lista = await Agendamento.find().sort({ data: 1, hora: 1 });
  res.json(lista);
});

app.get('/agendamentos/cliente/:id', async (req, res) => {
  const lista = await Agendamento.find({ clienteId: req.params.id });

  const grupos = {};

  lista.forEach(a => {
    if (!grupos[a.grupoId]) {
      grupos[a.grupoId] = {
        grupoId: a.grupoId,
        itens: [],
        total: 0,
        statusPagamento: a.statusPagamento
      };
    }

    grupos[a.grupoId].itens.push(a);

    if (a.status !== 'cancelado') {
      grupos[a.grupoId].total += a.valor || 0;
    }
  });

  res.json(Object.values(grupos));
});

// ================= CANCELAR =================
app.put('/agendamentos/:id/cancelar', async (req, res) => {
  const ag = await Agendamento.findByIdAndUpdate(
    req.params.id,
    { status: 'cancelado' },
    { new: true }
  );

  res.json(ag);
});

// ================= PAGAMENTO =================
app.post('/pagamentos/:grupoId/pagar', async (req, res) => {
  await Agendamento.updateMany(
    { grupoId: req.params.grupoId },
    { statusPagamento: 'pago' }
  );

  res.json({ ok: true });
});

// ================= START =================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Rodando na porta ${PORT}`);
});