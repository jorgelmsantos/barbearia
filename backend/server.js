const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const Usuario = require('./models/Usuario');

const app = express();
app.use(cors());
app.use(express.json());

// =========================
// 🔥 CONEXÃO MONGO (ATLAS)
// =========================

require('dotenv').config();

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

// =========================
// ROTA TESTE
// =========================
app.get('/', (req, res) => {
  res.send('API FUNCIONANDO 🚀');
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
  try {
    const cliente = await Cliente.create(req.body);
    res.json(cliente);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar cliente' });
  }
});

// =========================
// AGENDAMENTOS
// =========================

// criar
app.post('/agendamentos', async (req, res) => {
  try {
    const { data, hora, barbeiro } = req.body;

    const conflito = await Agendamento.findOne({ data, hora, barbeiro });

    if (conflito) {
      return res.status(400).json({ erro: 'Horário já ocupado para esse barbeiro' });
    }

    const agendamento = await Agendamento.create(req.body);

    console.log(`📲 Agendamento: ${req.body.nomeCliente} - ${data} ${hora}`);

    res.json(agendamento);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar agendamento' });
  }
});

// listar todos
app.get('/agendamentos', async (req, res) => {
  try {
    const lista = await Agendamento.find();
    res.json(lista);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar agendamentos' });
  }
});

// por data
app.get('/agendamentos/:data', async (req, res) => {
  try {
    const lista = await Agendamento.find({ data: req.params.data });
    res.json(lista);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar por data' });
  }
});

// deletar
app.delete('/agendamentos/:id', async (req, res) => {
  try {
    await Agendamento.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao deletar agendamento' });
  }
});

//cancelar
app.put('/agendamentos/:id/cancelar', async (req, res) => {
  try {
    await Agendamento.findByIdAndUpdate(req.params.id, {
      status: 'cancelado'
    });

    res.json({ ok: true });
  } catch (erro) {
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
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar serviço' });
  }
});

app.get('/servicos', async (req, res) => {
  try {
    const lista = await Servico.find();
    res.json(lista);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar serviços' });
  }
});

app.delete('/servicos/:id', async (req, res) => {
  try {
    await Servico.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
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
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar barbeiro' });
  }
});

app.get('/barbeiros', async (req, res) => {
  try {
    const lista = await Barbeiro.find();
    res.json(lista);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar barbeiros' });
  }
});

app.delete('/barbeiros/:id', async (req, res) => {
  try {
    await Barbeiro.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao deletar barbeiro' });
  }
});

// cadastro de clientes

app.post('/clientes/registro', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    const existe = await Usuario.findOne({ email });

    if (existe) {
      return res.status(400).json({ erro: 'Email já cadastrado' });
    }

    const usuario = await Usuario.create({ nome, email, senha });

    res.json(usuario);

  } catch (err) {
    res.status(500).json({ erro: 'Erro ao cadastrar' });
  }
});

//rota de login do cliente 

app.post('/clientes/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    const usuario = await Usuario.findOne({ email, senha });

    if (!usuario) {
      return res.status(401).json({ erro: 'Login inválido' });
    }

    const token = jwt.sign({ id: usuario._id }, 'segredo');

    res.json({ token, usuario });

  } catch (err) {
    res.status(500).json({ erro: 'Erro no login' });
  }
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});