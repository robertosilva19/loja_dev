-- Tabela de Usuários
-- Armazena as informações dos clientes que se cadastrarem.
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL, -- Nunca armazene senhas em texto puro!
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Produtos
-- Contém todos os itens disponíveis na loja.
CREATE TABLE produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10, 2) NOT NULL,
    estoque INTEGER NOT NULL DEFAULT 0,
    categoria VARCHAR(100),
    imagem_url VARCHAR(255)
);

-- Tabela de Pedidos
-- Armazena o cabeçalho de cada compra realizada.
CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id), -- Chave estrangeira ligando ao usuário
    status VARCHAR(50) NOT NULL DEFAULT 'Processando', -- Ex: Processando, Enviado, Entregue, Cancelado
    total DECIMAL(10, 2) NOT NULL,
    data_pedido TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Itens do Pedido (Tabela de Junção)
-- Liga os produtos a um pedido específico, detalhando a compra.
CREATE TABLE itens_pedido (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES pedidos(id),
    produto_id INTEGER NOT NULL REFERENCES produtos(id),
    quantidade INTEGER NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL -- Preço do produto no momento da compra
);

-- Tabela de Favoritos (Tabela de Junção)
-- Liga usuários aos seus produtos favoritos.
CREATE TABLE favoritos (
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    produto_id INTEGER NOT NULL REFERENCES produtos(id),
    PRIMARY KEY (usuario_id, produto_id) -- Impede que o mesmo produto seja favoritado duas vezes pelo mesmo usuário
);

-- INSERINDO DADOS DE EXEMPLO NA TABELA DE PRODUTOS
-- Isso garante que nossa rota /api/produtos terá o que retornar para teste.
INSERT INTO produtos (nome, descricao, preco, estoque, categoria, imagem_url) VALUES
('Abridor de Garrafas Geek', 'Abridor de garrafas temático perfeito para desenvolvedores.', 29.90, 25, 'acessorios', './assets/produtos/abridor.png'),
('Camiseta Dev Life', 'Camiseta confortável para verdadeiros programadores. Feita com algodão premium.', 39.90, 50, 'roupas', './assets/produtos/camiseta.png'),
('Caneca Code Coffee', 'Caneca perfeita para o café dos programadores. Design exclusivo.', 19.90, 30, 'canecas', './assets/produtos/caneca.png'),
('Camisa Desenvolvedor', 'Camisa social para o desenvolvedor moderno. Perfeita para reuniões.', 49.90, 20, 'roupas', './assets/produtos/camisa.png'),
('Quadro Motivacional Code', 'Quadro decorativo motivacional para seu setup.', 59.90, 15, 'decoracao', './assets/produtos/quadro.png'),
('Copo Térmico Smart', 'Copo térmico inteligente para manter sua bebida na temperatura ideal.', 29.90, 40, 'canecas', './assets/produtos/copo.png'),
('Boné Programmer', 'Boné estiloso para desenvolvedores. Design exclusivo com bordados.', 39.90, 35, 'acessorios', './assets/produtos/boné.png'),
('Mousepad Gaming Pro', 'Mousepad de alta performance para melhorar sua produtividade e gaming.', 29.90, 60, 'acessorios', './assets/produtos/mousepad.png');

-- Mensagem de sucesso
SELECT 'Tabelas e dados de exemplo criados com sucesso!' AS resultado;

SELECT * FROM produtos;

select * from usuarios;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;