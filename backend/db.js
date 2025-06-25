// Importando a biblioteca 'pg' que permite  a comunicação com o PostgreSQL
const { Pool } = require('pg');

// Impotan e configura o 'dotenv' para carregar variáveis de ambiente do arquivo .env
require('dotenv').config();

// Cria uma "pool" de conexões com o banco de dados PostgreSQL
// A pool permite que várias conexões sejam gerenciadas de forma eficiente
// As credenciais do banco de dados são obtidas das variáveis de ambiente .env (process.env)
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Exporta um objeto com um método 'query' que permite executar consultas SQL no banco de dados
// O método 'query' recebe uma string de consulta SQL e um array de parâmetros opcionais
// Isso nos permite executar consultas de forma segura, evitando injeções SQL
// O pool gerencia as conexões, permitindo reutilizar conexões existentes em vez de abrir novas a cada consulta
// Isso melhora o desempenho e a eficiência do uso de recursos do banco de dados
module.exports = {
    query: (text, params) => pool.query(text, params),
};

