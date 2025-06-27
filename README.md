# UseDev - Loja Geek Full-Stack
**Status do Projeto: ✅ Aplicação Full-Stack Completa e Funcional**

![Screenshot da Homepage](https://github.com/robertosilva19/loja_dev/blob/68de84748ea68a938fb9b28cd216c94f6645d594/assets/light_mode.jpeg)
*Interface em Modo Claro*

![Screenshot do Dark Mode](https://github.com/robertosilva19/loja_dev/blob/68de84748ea68a938fb9b28cd216c94f6645d594/assets/dark-mode.jpeg)
*Interface em Modo Escuro*

![Screenshot da Página de Perfil](https://github.com/robertosilva19/loja_dev/blob/68de84748ea68a938fb9b28cd216c94f6645d594/assets/perfil_cliente.jpeg)
*Página de Perfil do Cliente*

![Screenshot do Carrinho de Compras](https://github.com/robertosilva19/loja_dev/blob/68de84748ea68a938fb9b28cd216c94f6645d594/assets/carinho_compras.jpeg)
*Página do Carrinho de Compras*

## 📄 Descrição do Projeto

A **UseDev** é uma loja virtual moderna e responsiva focada no público geek e de desenvolvedores. O projeto evoluiu de um simples exercício de layout para uma **aplicação web full-stack completamente funcional**, com back-end robusto, base de dados relacional e sistema de autenticação seguro.

A aplicação oferece uma experiência de e-commerce completa, desde a navegação de produtos até a finalização de compras, com dados persistentes e sincronizados entre diferentes dispositivos e sessões.

## 🎯 Evolução do Projeto

### **Fase 1: Front-end (Concluída)**
- Interface de utilizador completa e responsiva
- Funcionalidades simuladas com localStorage
- Design moderno com tema claro/escuro

### **Fase 2: Full-Stack (Atual)**
- API RESTful desenvolvida com Node.js e Express
- Base de dados PostgreSQL com esquema relacional
- Sistema de autenticação com JWT
- Integração completa front-end + back-end

## ✨ Funcionalidades Completas

### **E-commerce Essencial**
- 🏠 **Homepage** com banner, categorias e lista de produtos
- 🛍️ **Página de Detalhes** do produto com informações completas
- 🛒 **Carrinho de Compras** persistente com cálculo automático
- 👤 **Sistema de Login/Registo** com autenticação segura
- 💳 **Modal de Checkout** para finalização de compras

### **Painel do Utilizador**
- 📊 **Dashboard Completo** com múltiplas abas:
  - Dados Pessoais (editáveis)
  - Endereços (com consulta de CEP via API)
  - Histórico de Pedidos
  - Lista de Favoritos
  - Cupons de Desconto

### **Sistemas Dinâmicos**
- 🌙 **Tema Light/Dark Mode** com persistência
- ❤️ **Sistema de Favoritos** sincronizado com a base de dados
- 🛒 **Carrinho Persistente** associado ao utilizador
- 🔔 **Sistema de Notificações** (Toast) para feedback
- 📱 **Design Totalmente Responsivo**

### **Segurança e Autenticação**
- 🔐 **Senhas Encriptadas** com bcryptjs
- 🎫 **Autenticação JWT** para sessões seguras
- 🛡️ **Middleware de Proteção** para rotas sensíveis
- 🔒 **Validação de Tokens** em todas as operações

## 🚀 Tecnologias Utilizadas

### **Front-end**
- **HTML5** - Estrutura semântica e acessível
- **CSS3** - Flexbox, Grid, Variáveis CSS, Animações
- **JavaScript ES6+** - Classes, Async/Await, Manipulação DOM
- **Font Awesome** - Biblioteca de ícones

### **Back-end**
- **Node.js** - Ambiente de execução JavaScript
- **Express.js** - Framework web para API RESTful
- **bcryptjs** - Encriptação de senhas
- **jsonwebtoken** - Autenticação JWT
- **cors** - Comunicação cross-origin
- **dotenv** - Gestão de variáveis de ambiente

### **Base de Dados**
- **PostgreSQL** - Base de dados relacional
- **Esquema Normalizado** - Tabelas relacionais otimizadas

### **Ferramentas de Desenvolvimento**
- **Git & GitHub** - Controlo de versão
- **DBeaver** - Gestão da base de dados
- **Visual Studio Code** - Editor de código
- **Live Server** - Servidor de desenvolvimento

## 📁 Estrutura do Projeto

```
UseDev/
├── frontend/
│   ├── assets/
│   │   ├── icons/
│   │   └── produtos/
│   ├── css/
│   │   ├── components/
│   │   └── pages/
│   ├── js/
│   │   ├── auth.js
│   │   ├── carrinho.js
│   │   ├── perfil.js
│   │   └── main.js
│   ├── pages/
│   │   ├── carrinho.html
│   │   ├── login.html
│   │   ├── perfil.html
│   │   └── produto.html
│   └── index.html
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── config/
│   ├── .env
│   ├── server.js
│   └── package.json
└── database/
    └── schema.sql
```

## 🛠️ Como Executar o Projeto

### **Pré-requisitos**
- Node.js (versão 14 ou superior)
- PostgreSQL
- Git

### **Configuração da Base de Dados**
1. Instale e configure o PostgreSQL
2. Crie uma base de dados chamada `usedev`
3. Execute o script `database/schema.sql` para criar as tabelas

### **Configuração do Back-end**
1. Navegue para a pasta `backend/`
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente no arquivo `.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=usedev
   DB_USER=seu_usuario
   DB_PASSWORD=sua_senha
   JWT_SECRET=seu_jwt_secret_aqui
   PORT=3000
   ```
4. Inicie o servidor:
   ```bash
   npm start
   ```

### **Configuração do Front-end**
1. Navegue para a pasta `frontend/`
2. Abra o `index.html` com Live Server ou servidor similar
3. Acesse `http://localhost:5500` (ou porta configurada)

## 🔄 API Endpoints

### **Autenticação**
- `POST /api/auth/register` - Registo de utilizador
- `POST /api/auth/login` - Login de utilizador

### **Produtos**
- `GET /api/produtos` - Lista todos os produtos
- `GET /api/produtos/:id` - Detalhes de um produto

### **Carrinho**
- `GET /api/carrinho` - Obter carrinho do utilizador
- `POST /api/carrinho` - Adicionar item ao carrinho
- `PUT /api/carrinho/:id` - Atualizar quantidade
- `DELETE /api/carrinho/:id` - Remover item

### **Favoritos**
- `GET /api/favoritos` - Lista de favoritos do utilizador
- `POST /api/favoritos` - Adicionar aos favoritos
- `DELETE /api/favoritos/:id` - Remover dos favoritos

### **Utilizador**
- `GET /api/user/perfil` - Dados do perfil
- `PUT /api/user/perfil` - Atualizar perfil

## 🎯 Funcionalidades em Destaque

### **Autenticação Segura**
- Registo e login com validação completa
- Senhas encriptadas com salt
- Tokens JWT com expiração configurável
- Middleware de proteção automática

### **Carrinho Inteligente**
- Sincronização automática com a base de dados
- Cálculo dinâmico de totais e fretes
- Persistência entre sessões e dispositivos
- Validação de stock em tempo real

### **Sistema de Favoritos**
- Lista personalizada por utilizador
- Sincronização instantânea
- Interface intuitiva para gerir favoritos
- Indicadores visuais de estado

## 🔜 Próximas Funcionalidades

- [ ] Sistema de pagamento integrado
- [ ] Gestão de stock em tempo real
- [ ] Painel administrativo
- [ ] Sistema de reviews e avaliações
- [ ] Notificações push
- [ ] Análise de dados e relatórios

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para:
- Reportar bugs
- Sugerir novas funcionalidades
- Enviar pull requests
- Melhorar a documentação

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Autor

**Roberto Silva**
---

Feito com ❤️ e muito ☕ por Roberto Silva

*"Do conceito à realidade: uma jornada de aprendizado em desenvolvimento full-stack"*
