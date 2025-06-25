// Importa os pacotes necessários
const express = require('express');
const cors = require('cors');
const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verificarToken = require('./authMiddleware'); // O nosso "segurança"

// Carrega as variáveis de ambiente do ficheiro .env
require('dotenv').config();

// Inicializa a aplicação Express
const app = express();
const PORT = process.env.PORT || 3001;

// --- Configuração dos Middlewares ---
app.use(cors());
app.use(express.json());

// =================== ROTAS PÚBLICAS ===================
app.get('/', (req, res) => res.json({ message: 'Bem-vindo à API da UseDev!', status: 'OK' }));

app.post('/api/usuarios/registrar', async (req, res) => {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    try {
        const senhaHash = await bcrypt.hash(senha, 10);
        const novoUsuario = await db.query('INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id, nome, email', [nome, email, senhaHash]);
        res.status(201).json(novoUsuario.rows[0]);
    } catch (error) {
        if (error.code === '23505') return res.status(409).json({ error: 'Este e-mail já está registado.' });
        console.error('Erro ao registar utilizador:', error);
        res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
    }
});

app.post('/api/usuarios/login', async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ error: 'E-mail и senha são obrigatórios.' });
    try {
        const resultado = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        const utilizador = resultado.rows[0];
        if (!utilizador) return res.status(401).json({ error: 'Credenciais inválidas.' });
        const senhaValida = await bcrypt.compare(senha, utilizador.senha_hash);
        if (!senhaValida) return res.status(401).json({ error: 'Credenciais inválidas.' });
        const token = jwt.sign({ id: utilizador.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, utilizador: { id: utilizador.id, nome: utilizador.nome, email: utilizador.email } });
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
    }
});

app.get('/api/produtos', async (req, res) => {
    try {
        const resultado = await db.query('SELECT * FROM produtos');
        res.status(200).json(resultado.rows);
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
    }
});

// =================== ROTAS PROTEGIDAS ===================
app.get('/api/perfil', verificarToken, async (req, res) => {
    try {
        const resultado = await db.query('SELECT id, nome, email, data_criacao FROM usuarios WHERE id = $1', [req.utilizador.id]);
        if (resultado.rows.length === 0) return res.status(404).json({ error: 'Utilizador não encontrado.' });
        res.json(resultado.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
    }
});

// --- (NOVO) ROTAS DE FAVORITOS (Protegidas) ---

// OBTER TODOS OS FAVORITOS DO UTILIZADOR LOGADO
app.get('/api/favoritos', verificarToken, async (req, res) => {
    try {
        const idDoUtilizador = req.utilizador.id;
        const resultado = await db.query(
            `SELECT p.id, p.nome, p.preco, p.imagem_url 
             FROM produtos p
             INNER JOIN favoritos f ON p.id = f.produto_id
             WHERE f.usuario_id = $1`,
            [idDoUtilizador]
        );
        res.json(resultado.rows);
    } catch (error) {
        console.error('Erro ao buscar favoritos:', error);
        res.status(500).json({ error: 'Erro no servidor.' });
    }
});

// ADICIONAR UM PRODUTO AOS FAVORITOS
app.post('/api/favoritos', verificarToken, async (req, res) => {
    const idDoUtilizador = req.utilizador.id;
    const { produtoId } = req.body;

    if (!produtoId) {
        return res.status(400).json({ error: 'O ID do produto é obrigatório.' });
    }

    try {
        // "ON CONFLICT DO NOTHING" previne erros se o favorito já existir.
        await db.query(
            'INSERT INTO favoritos (usuario_id, produto_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [idDoUtilizador, produtoId]
        );
        res.status(201).json({ message: 'Produto adicionado aos favoritos.' });
    } catch (error) {
        console.error('Erro ao adicionar favorito:', error);
        res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
    }
});

// REMOVER UM PRODUTO DOS FAVORITOS
app.delete('/api/favoritos/:produtoId', verificarToken, async (req, res) => {
    const idDoUtilizador = req.utilizador.id;
    const { produtoId } = req.params; // O ID vem da URL

    try {
        await db.query(
            'DELETE FROM favoritos WHERE usuario_id = $1 AND produto_id = $2',
            [idDoUtilizador, produtoId]
        );
        res.status(200).json({ message: 'Produto removido dos favoritos.' });
    } catch (error) {
        console.error('Erro ao remover favorito:', error);
        res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
    }
});


// ROTAS DO CARRINHO (Protegidas)
app.get('/api/carrinho', verificarToken, async (req, res) => { /* ... sua lógica de carrinho ... */ });
app.post('/api/carrinho', verificarToken, async (req, res) => { /* ... sua lógica de carrinho ... */ });
app.delete('/api/carrinho/:produtoId', verificarToken, async (req, res) => { /* ... sua lógica de carrinho ... */ });
app.put('/api/carrinho/:produtoId', verificarToken, async (req, res) => { /* ... sua lógica de carrinho ... */ });


// --- Inicialização do Servidor ---
app.listen(PORT, () => {
    console.log(`🚀 Servidor da UseDev a rodar na porta ${PORT}`);
});
