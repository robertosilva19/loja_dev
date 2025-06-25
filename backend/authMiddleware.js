// Importa o jsonwebtoken para verificar o token e o dotenv para aceder ao segredo
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Esta é a nossa função de middleware "segurança"
function verificarToken(req, res, next) {
    // 1. Obter o token do cabeçalho da requisição
    const authHeader = req.headers['authorization'];
    // O formato do cabeçalho é "Bearer TOKEN". Nós só queremos o token.
    const token = authHeader && authHeader.split(' ')[1];

    // 2. Se não houver token, recusa o acesso
    if (!token) {
        return res.sendStatus(401); // Unauthorized (Não autorizado)
    }

    // 3. Verifica se o token é válido
    jwt.verify(token, process.env.JWT_SECRET, (err, utilizador) => {
        // Se o token for inválido (expirado, malformado), recusa o acesso
        if (err) {
            console.error('Erro de verificação do token:', err);
            return res.sendStatus(403); // Forbidden (Proibido)
        }

        // 4. Se o token for válido, guarda os dados do utilizador no objeto de requisição
        // O `utilizador` aqui é o payload que definimos ao criar o token (ex: { id: utilizador.id })
        req.utilizador = utilizador;

        // 5. Permite que a requisição continue para a rota final
        next();
    });
}

// Exporta a função para que possamos usá-la no nosso servidor.js
module.exports = verificarToken;
// Agora podemos usar este middleware nas rotas que queremos proteger
// Por exemplo, no servidor.js, podemos fazer algo assim:   