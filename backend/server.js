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
const Agendamento = require('./models/agendamentos');
const Barbeiro = require('./models/Barbeiro');
const Servico = require('./models/Servico');
const Usuario = require('./models/Usuario');
const Plano = require('./models/Plano');

// =========================
// ROOT
// =========================
app.get('/', (req, res) => {
  res.send('🚀 API OK');
});

// =========================
// LOGIN ADMIN
// =========================
const ADMIN = {
  email: 'admin@barbearia.com',
  senha: '123456'
};

app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  if (email !== ADMIN.email || senha !== ADMIN.senha) {
    return res.status(401).json({ erro: 'Login inválido' });
  }

  const token = jwt.sign({ email }, 'segredo');
  res.json({ token });
});

// =========================
// CLIENTE
// =========================
app.post('/clientes/registro', async (req, res) => {
  const { nome, email, senha } = req.body;

  const existe = await Usuario.findOne({ email });
  if (existe) return res.status(400).json({ erro: 'Email já existe' });

  const usuario = await Usuario.create({ nome, email, senha });
  res.json(usuario);
});

app.post('/clientes/login', async (req, res) => {
  const { email, senha } = req.body;

  const usuario = await Usuario.findOne({ email, senha });
  if (!usuario) return res.status(401).json({ erro: 'Login inválido' });

  const token = jwt.sign({ id: usuario._id }, 'segredo');

  res.json({ token, usuario });
});

// =========================
// 🔥 PLANO
// =========================

// criar / atualizar plano
app.post('/plano', async (req, res) => {
  const plano = await Plano.findOneAndUpdate(
    {},
    req.body,
    { upsert: true, new: true }
  );

  res.json(plano);
});

// buscar plano
app.get('/plano', async (req, res) => {
  const plano = await Plano.findOne();
  res.json(plano);
});

// assinar plano
app.post('/plano/assinar/:id', async (req, res) => {
  const usuario = await Usuario.findByIdAndUpdate(
    req.params.id,
    {
      planoAtivo: true,
      validadePlano: new Date(new Date().setMonth(new Date().getMonth() + 1))
    },
    { new: true }
  );

  res.json(usuario);
});

// =========================
// 🔥 AGENDAMENTOS (COM GRUPO)
// =========================

// CRIAR EM LOTE (CARRINHO)
app.post('/agendamentos/lote', async (req, res) => {
  try {
    const { clienteId, nomeCliente, telefone, itens } = req.body;

    const pedidoId = new mongoose.Types.ObjectId(); // 🔥 AGRUPADOR

    let agendamentosCriados = [];

    for (let item of itens) {

      // conflito
      const conflito = await Agendamento.findOne({
        data: item.data,
        hora: item.hora,
        barbeiro: item.barbeiro
      });

      if (conflito) {
        return res.status(400).json({
          erro: `Horário ocupado: ${item.data} ${item.hora}`
        });
      }

      let valorFinal = item.valor;

      // plano fidelidade
      const usuario = await Usuario.findById(clienteId);

      if (usuario?.planoAtivo && usuario.validadePlano > new Date()) {
        valorFinal = 0;
      }

      const novo = await Agendamento.create({
        clienteId,
        nomeCliente,
        telefone,
        pedidoId, // 🔥 chave do grupo
        ...item,
        valor: valorFinal,
        status: 'ativo'
      });

      agendamentosCriados.push(novo);
    }

    res.json({
      pedidoId,
      agendamentos: agendamentosCriados
    });

  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar lote' });
  }
});

// LISTAR AGRUPADO
app.get('/agendamentos/cliente/:id', async (req, res) => {
  const lista = await Agendamento.find({ clienteId: req.params.id });

  // 🔥 AGRUPAR POR PEDIDO
  const agrupado = {};

  lista.forEach(a => {
    const key = a.pedidoId || 'sem-grupo';

    if (!agrupado[key]) {
      agrupado[key] = {
        pedidoId: key,
        itens: [],
        total: 0
      };
    }

    agrupado[key].itens.push(a);
    agrupado[key].total += a.valor || 0;
  });

  res.json(Object.values(agrupado));
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
  const s = await Servico.create(req.body);
  res.json(s);
});

app.get('/servicos', async (req, res) => {
  const lista = await Servico.find();
  res.json(lista);
});

// =========================
// BARBEIROS
// =========================
app.post('/barbeiros', async (req, res) => {
  const b = await Barbeiro.create(req.body);
  res.json(b);
});

app.get('/barbeiros', async (req, res) => {
  const lista = await Barbeiro.find();
  res.json(lista);
});

// =========================
// START
// =========================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Rodando na porta ${PORT}`);
});