//Importar os pacotes necessários
const express = require('express');
const cors = require('cors');
const db = require('./db'); // Importa o módulo de conexão com o banco de dados

//Inicializa o aplicativo Express
const app = express();

//Define a porta para o servidor
//Usando a  3001 para não conflitar com o frontend 
const PORT = process.env.PORT || 3001;

// === MIDDLEWARES ===
//Middlewares são "plugiins" que rodam em toda requisição

//Habilita o CORS para permitir requisições de outros domínios e para que o frontend consiga acessar o backend
app.use(cors());

//Permite que o Express entenda requisições com corpo JSON
app.use(express.json());

// === ROTAS ===
//Rota raiz que retorna uma mensagem de boas-vindas

//Rota de teste principal (ex: http://localhost:3001/)
app.get('/', (req, res) => {
    res.json({
        message: 'Bem-vindo à API da UseDev!',
        status: 'API rodando corretamente!',
        documentation: 'Em breve, teremos uma documentação completa para você entender como usar a API.'
    });
});

// -- Primeira rota de exemplo: Retorna todos os usuários --
// Rota para buscar todos os produtos do banco de dados
app.get('/api/produtos', async (req, res) => {
    try {
        // Executa uma consulta SQL para selecionar tudo da tabela 'produtos'
        const result = await db.query('SELECT * FROM produtos');

        // Retorna os produtos encontrados (result.rows) como resposta JSON
        res.status(200).json(result.rows);

    } catch (error) {
        // Em caso de erro, retorna um status 500 (Erro Interno do Servidor) e a mensagem de erro
        console.error('Erro ao buscar produtos:', error);
        res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
});

// === INICIALIZAÇÃO DO SERVIDOR ===
// O servidor "ouve" por requisições na porta definida
app.listen(PORT, () => {
    console.log(`🚀 Servidor da UseDev rodando na porta ${PORT}`);
    console.log(`🌐 Acesse a API em http://localhost:${PORT}`);
});