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

// ================= AGENDAMENTO EM LOTE =================
app.post('/agendamentos/lote', async (req, res) => {
  try {
    const { clienteId, nomeCliente, telefone, itens } = req.body;

    if (!itens || itens.length === 0) {
      return res.status(400).json({ erro: 'Carrinho vazio' });
    }

    const grupoId = Date.now().toString();

    // valida conflito
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

    const agendamentos = await Promise.all(
      itens.map(item =>
        Agendamento.create({
          clienteId,
          nomeCliente,
          telefone,
          grupoId,
          ...item,
          status: 'ativo'
        })
      )
    );

    res.json(agendamentos);

  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar agendamento' });
  }
});

// ================= LISTAR TODOS =================
app.get('/agendamentos', async (req, res) => {
  const lista = await Agendamento.find().sort({ data: 1, hora: 1 });
  res.json(lista);
});

// ================= FILTRAR POR DATA =================
app.get('/agendamentos/data/:data', async (req, res) => {
  const lista = await Agendamento.find({ data: req.params.data });
  res.json(lista);
});

// ================= LISTAR CLIENTE (AGRUPADO) =================
app.get('/agendamentos/cliente/:id', async (req, res) => {
  const lista = await Agendamento.find({ clienteId: req.params.id });

  const grupos = {};

  lista.forEach(a => {
    if (!grupos[a.grupoId]) {
      grupos[a.grupoId] = {
        grupoId: a.grupoId,
        itens: [],
        total: 0
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

// ================= START =================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Rodando na porta ${PORT}`);
});