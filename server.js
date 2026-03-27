const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// conexão com MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/barbearia');

// models
const Cliente = require('./models/Cliente');
const Agendamento = require('./models/agendamentos'); // corrigido
const Barbeiro = require('./models/Barbeiro');
const Servico = require('./models/Servico');

// =========================
// ROTA TESTE
// =========================
app.get('/', (req, res) => {
  res.send('API NOVA FUNCIONANDO');
});

// =========================
// LOGIN
// =========================
const USUARIO = {
  email: 'admin@barbearia.com',
  senha: '123456'
};

app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  if (email !== USUARIO.email || senha !== USUARIO.senha) {
    return res.status(401).json({ erro: 'Login inválido' });
  }

  const token = jwt.sign({ email }, 'segredo');

  res.json({ token });
});

// =========================
// CLIENTES
// =========================
app.post('/clientes', async (req, res) => {
  const cliente = await Cliente.create(req.body);
  res.json(cliente);
});

// =========================
// AGENDAMENTOS
// =========================

// criar agendamento
app.post('/agendamentos', async (req, res) => {
  const { data, hora, barbeiro } = req.body;

  const conflito = await Agendamento.findOne({ data, hora, barbeiro });

  if (conflito) {
    return res.status(400).json({ erro: 'Horário já ocupado para esse barbeiro' });
  }

  const agendamento = await Agendamento.create(req.body);

  console.log(`📲 Agendamento: ${req.body.nomeCliente} - ${data} ${hora}`);

  res.json(agendamento);
});

// listar todos
app.get('/agendamentos', async (req, res) => {
  const lista = await Agendamento.find();
  res.json(lista);
});

// agenda por data
app.get('/agendamentos/:data', async (req, res) => {
  const lista = await Agendamento.find({ data: req.params.data });
  res.json(lista);
});

// excluir
app.delete('/agendamentos/:id', async (req, res) => {
  await Agendamento.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// =========================
// SERVIÇOS
// =========================

app.post('/servicos', async (req, res) => {
  const servico = await Servico.create(req.body);
  res.json(servico);
});

app.get('/servicos', async (req, res) => {
  const lista = await Servico.find();
  res.json(lista);
});

// =========================
// BARBEIROS
// =========================

app.post('/barbeiros', async (req, res) => {
  const barbeiro = await Barbeiro.create(req.body);
  res.json(barbeiro);
});

app.get('/barbeiros', async (req, res) => {
  const lista = await Barbeiro.find();
  res.json(lista);
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('Servidor rodando');
});

//deletar cadastro de barbeiro

app.delete('/barbeiros/:id', async (req, res) => {
  await Barbeiro.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

//deletar serviço

app.delete('/servicos/:id', async (req, res) => {
  await Servico.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});