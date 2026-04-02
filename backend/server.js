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
const Plano = require('./models/Plano');

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
// USUÁRIO CLIENTE
// =========================
app.post('/clientes/registro', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

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

// criar ou atualizar plano
app.post('/plano', async (req, res) => {
  const { nome, valor, limiteMensal, ativo } = req.body;

  const plano = await Plano.findOneAndUpdate(
    {},
    { nome, valor, limiteMensal, ativo },
    { upsert: true, new: true }
  );

  res.json(plano);
});

// buscar plano
app.get('/plano', async (req, res) => {
  const plano = await Plano.findOne();
  res.json(plano);
});

//pagar plano fidelidade
app.post('/plano/assinar/:id', async (req, res) => {
  try {
    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { planoAtivo: true },
      { new: true }
    );

    res.json(usuario);

  } catch {
    res.status(500).json({ erro: 'Erro ao ativar plano' });
  }
});

// =========================
// AGENDAMENTOS
// =========================

// CRIAR
app.post('/agendamentos', async (req, res) => {
  try {
    const { data, hora, barbeiro, clienteId, valor } = req.body;

    if (!data || !hora || !barbeiro) {
      return res.status(400).json({ erro: 'Dados incompletos' });
    }

    const conflito = await Agendamento.findOne({ data, hora, barbeiro });

    if (conflito) {
      return res.status(400).json({ erro: 'Horário já ocupado' });
    }

    // 🔥 BUSCA USUÁRIO
    let valorFinal = valor;

    if (clienteId) {
      const usuario = await Usuario.findById(clienteId);

      if (usuario && usuario.planoAtivo) {
        // verifica validade
        if (!usuario.validadePlano || usuario.validadePlano >= new Date()) {
          valorFinal = 0;
        } else {
          // plano expirou
          usuario.planoAtivo = false;
          await usuario.save();
        }
      }
    }

    const agendamento = await Agendamento.create({
      ...req.body,
      valor: valorFinal,
      status: 'ativo'
    });

    res.json(agendamento);

  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar agendamento' });
  }
});

// REMARCAR
app.put('/agendamentos/:id/remarcar', async (req, res) => {
  try {
    const { data, hora, barbeiro } = req.body;

    const conflito = await Agendamento.findOne({
      data,
      hora,
      barbeiro,
      _id: { $ne: req.params.id }
    });

    if (conflito) {
      return res.status(400).json({ erro: 'Horário já ocupado' });
    }

    const atualizado = await Agendamento.findByIdAndUpdate(
      req.params.id,
      { data, hora },
      { new: true }
    );

    res.json(atualizado);

  } catch {
    res.status(500).json({ erro: 'Erro ao remarcar' });
  }
});

// LISTAR
app.get('/agendamentos', async (req, res) => {
  const lista = await Agendamento.find().sort({ data: 1, hora: 1 });
  res.json(lista);
});

// POR CLIENTE
app.get('/agendamentos/cliente/:id', async (req, res) => {
  const lista = await Agendamento.find({ clienteId: req.params.id });
  res.json(lista);
});

// CANCELAR
app.put('/agendamentos/:id/cancelar', async (req, res) => {
  const ag = await Agendamento.findByIdAndUpdate(
    req.params.id,
    { status: 'cancelado' },
    { new: true }
  );

  res.json(ag);
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
// PLANO FIDELIDADE
// =========================

// ATIVAR / DESATIVAR
app.put('/clientes/:id/plano', async (req, res) => {
  try {
    const { ativo, dias } = req.body;

    let validade = null;

    if (ativo && dias) {
      validade = new Date();
      validade.setDate(validade.getDate() + dias);
    }

    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      {
        planoAtivo: ativo,
        validadePlano: validade
      },
      { new: true }
    );

    res.json(usuario);

  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar plano' });
  }
});

// =========================
// START
// =========================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});