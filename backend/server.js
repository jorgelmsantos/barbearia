const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// =========================
// 🔥 CONEXÃO MONGO
// =========================
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('✅ Mongo conectado'))
  .catch(err => console.log('❌ Erro Mongo:', err));

// =========================
// MODELS
// =========================
const Cliente = require('./models/Cliente');
const Agendamento = require('./models/agendamentos');
const Barbeiro = require('./models/Barbeiro');
const Servico = require('./models/Servico');
const Usuario = require('./models/Usuario');

// =========================
// ROTA TESTE
// =========================
app.get('/', (req, res) => {
  res.send('API FUNCIONANDO 🚀');
});

// =========================
// LOGIN ADMIN
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
// CLIENTES SIMPLES
// =========================
app.post('/clientes', async (req, res) => {
  try {
    const cliente = await Cliente.create(req.body);
    res.json(cliente);
  } catch {
    res.status(500).json({ erro: 'Erro ao criar cliente' });
  }
});

// =========================
// USUÁRIO (LOGIN CLIENTE)
// =========================

// REGISTRO
app.post('/clientes/registro', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Preencha todos os campos' });
    }

    const existe = await Usuario.findOne({ email });

    if (existe) {
      return res.status(400).json({ erro: 'Email já cadastrado' });
    }

    const usuario = await Usuario.create({ nome, email, senha });

    res.json(usuario);

  } catch {
    res.status(500).json({ erro: 'Erro ao cadastrar' });
  }
});

// LOGIN CLIENTE
app.post('/clientes/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    const usuario = await Usuario.findOne({ email, senha });

    if (!usuario) {
      return res.status(401).json({ erro: 'Login inválido' });
    }

    const token = jwt.sign({ id: usuario._id }, 'segredo');

    res.json({ token, usuario });

  } catch {
    res.status(500).json({ erro: 'Erro no login' });
  }
});

// =========================
// AGENDAMENTOS
// =========================

// CRIAR
app.post('/agendamentos', async (req, res) => {
  try {
    const { data, hora, barbeiro } = req.body;

    if (!data || !hora || !barbeiro) {
      return res.status(400).json({ erro: 'Dados incompletos' });
    }

    const conflito = await Agendamento.findOne({ data, hora, barbeiro });

    if (conflito) {
      return res.status(400).json({ erro: 'Horário já ocupado' });
    }

    const agendamento = await Agendamento.create({
      ...req.body,
      status: 'ativo'
    });

    res.json(agendamento);

  } catch {
    res.status(500).json({ erro: 'Erro ao criar agendamento' });
  }
});

// LISTAR TODOS
app.get('/agendamentos', async (req, res) => {
  try {
    const lista = await Agendamento.find().sort({ data: 1, hora: 1 });
    res.json(lista);
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar agendamentos' });
  }
});

// POR DATA
app.get('/agendamentos/:data', async (req, res) => {
  try {
    const lista = await Agendamento.find({ data: req.params.data });
    res.json(lista);
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar por data' });
  }
});

// 🔥 POR CLIENTE
app.get('/agendamentos/cliente/:id', async (req, res) => {
  try {
    const lista = await Agendamento.find({ clienteId: req.params.id });
    res.json(lista);
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar do cliente' });
  }
});

// CANCELAR
app.put('/agendamentos/:id/cancelar', async (req, res) => {
  try {
    const ag = await Agendamento.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelado' },
      { new: true }
    );

    res.json(ag);
  } catch {
    res.status(500).json({ erro: 'Erro ao cancelar' });
  }
});

// =========================
// SERVIÇOS
// =========================
app.post('/servicos', async (req, res) => {
  try {
    const servico = await Servico.create(req.body);
    res.json(servico);
  } catch {
    res.status(500).json({ erro: 'Erro ao criar serviço' });
  }
});

app.get('/servicos', async (req, res) => {
  try {
    const lista = await Servico.find();
    res.json(lista);
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar serviços' });
  }
});

app.delete('/servicos/:id', async (req, res) => {
  try {
    await Servico.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ erro: 'Erro ao deletar serviço' });
  }
});

// =========================
// BARBEIROS
// =========================
app.post('/barbeiros', async (req, res) => {
  try {
    const barbeiro = await Barbeiro.create(req.body);
    res.json(barbeiro);
  } catch {
    res.status(500).json({ erro: 'Erro ao criar barbeiro' });
  }
});

app.get('/barbeiros', async (req, res) => {
  try {
    const lista = await Barbeiro.find();
    res.json(lista);
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar barbeiros' });
  }
});

app.delete('/barbeiros/:id', async (req, res) => {
  try {
    await Barbeiro.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ erro: 'Erro ao deletar barbeiro' });
  }
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});