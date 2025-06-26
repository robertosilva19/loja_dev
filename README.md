# UseDev - Front-end de uma Loja Geek

<p align="center">
  <strong>Status do Projeto:</strong> Front-end Concluído, em preparação para desenvolvimento do Back-end.
</p>

<!-- Tabela de Screenshots Corrigida -->
<table>
  <tr>
    <td align="center">
      <img src="https://raw.githubusercontent.com/robertosilva19/loja_dev/de679a192371913b7d257513c36f81a0dc7a4b80/assets/light_mode.jpeg" alt="Screenshot da Homepage" width="400"/>
      <br />
      <sub><b>Interface em Modo Claro</b></sub>
    </td>
    <td align="center">
      <img src="https://raw.githubusercontent.com/robertosilva19/loja_dev/de679a192371913b7d257513c36f81a0dc7a4b80/assets/dark-mode.jpeg" alt="Screenshot do Dark Mode" width="400"/>
      <br />
      <sub><b>Interface em Modo Escuro</b></sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="https://raw.githubusercontent.com/robertosilva19/loja_dev/de679a192371913b7d257513c36f81a0dc7a4b80/assets/perfil_cliente.jpeg" alt="Screenshot da Página de Perfil" width="400"/>
      <br />
      <sub><b>Página de Perfil do Cliente</b></sub>
    </td>
    <td align="center">
      <img src="https://raw.githubusercontent.com/robertosilva19/loja_dev/bb62f08cbb21464da2eabe79dcd76dbbfc7dc30a/assets/carinho_compras.jpeg" alt="Screenshot do Carrinho de Compras" width="400"/>
      <br />
      <sub><b>Página do Carrinho de Compras</b></sub>
    </td>
  </tr>
</table>

## 📄 Descrição do Projeto

Este projeto é a implementação completa do front-end para a **UseDev**, uma loja virtual moderna e responsiva focada no público geek e de desenvolvedores. A aplicação foi construída do zero, evoluindo de um simples exercício de layout para uma interface rica, interativa e totalmente funcional, servindo como uma base sólida para a futura integração com um back-end e um banco de dados.

## ✨ Funcionalidades

O front-end da aplicação inclui uma vasta gama de funcionalidades prontas para uso:

-   **Páginas Essenciais de E-commerce:**
    -   Homepage com banner, categorias e lista de produtos.
    -   Página de Detalhes do Produto.
    -   Página de Carrinho de Compras com cálculo de subtotal, frete e cupons.
    -   Página de Login e Cadastro de Usuário.
-   **Painel do Usuário Completo:**
    -   Dashboard de Perfil com múltiplas abas: Dados Pessoais, Endereços, Histórico de Pedidos, Favoritos e Cupons.
    -   Formulários para edição de dados e cadastro de endereço com consulta de CEP.
-   **Sistemas Dinâmicos e Interativos:**
    -   **Tema Light/Dark Mode:** Sistema completo de temas com persistência da escolha do usuário.
    -   **Sistema de Favoritos:** Permite ao usuário salvar e remover produtos de uma lista de favoritos.
    -   **Sistema de Carrinho:** Adição, remoção e atualização de quantidade de produtos, com dados salvos no `localStorage`.
    -   **Sistema de Notificações (Toast):** Feedback visual para ações do usuário (ex: "Produto adicionado!").
    -   **Modal de Checkout:** Janela modal para finalização de compra.
-   **UI/UX Moderno:**
    -   **Design Totalmente Responsivo:** Layout adaptado para desktop, tablets e celulares.
    -   **Cabeçalho com Menu Hambúrguer:** Menu de navegação funcional em dispositivos móveis, implementado com JavaScript.
    -   **Ícones Profissionais:** Uso da biblioteca Font Awesome para uma identidade visual consistente e leve.

## 🚀 Tecnologias Utilizadas

Este projeto foi construído utilizando as seguintes tecnologias e conceitos:

-   **`HTML5`**:
    -   Estrutura semântica para melhor acessibilidade e SEO (`<header>`, `<main>`, `<nav>`, `<aside>`, `<section>`).

-   **`CSS3`**:
    -   **Flexbox** e **Grid Layout** para criação de layouts complexos e responsivos.
    -   **Responsividade com Media Queries** para garantir a adaptação a diferentes tamanhos de tela.
    -   **Variáveis CSS (Custom Properties)** para um sistema de temas (Light/Dark Mode) eficiente e de fácil manutenção.
    -   **Animações e Transições (`@keyframes`, `transition`)** para uma experiência de usuário mais fluida.

-   **`JavaScript (ES6+)`**:
    -   **Programação Orientada a Objetos (OOP)** com `Classes` para organizar a lógica (`PerfilManager`, `CarrinhoManager`, etc.).
    -   **Manipulação do DOM** para criar e atualizar conteúdo dinamicamente sem recarregar a página.
    -   **Async/Await com `fetch` API** para carregar dados de arquivos JSON locais e consultar APIs externas (ViaCEP).
    -   **`localStorage`** para persistência de dados no navegador (carrinho, favoritos, tema, usuário simulado).
    -   **Manipulação de Eventos** para interatividade completa com o usuário.

-   **Bibliotecas e Ferramentas:**
    -   **Font Awesome:** Para a biblioteca de ícones.
    -   **Git & GitHub Desktop:** Para versionamento de código.
    -   **DBeaver & PostgreSQL:** Ferramentas escolhidas para o planejamento e futuro desenvolvimento do banco de dados.

## 📁 Estrutura de Pastas

O projeto está organizado da seguinte forma para facilitar a manutenção:


/
├── assets/
│   ├── icons/
│   └── produtos/
├── css/
│   ├── components/
│   ├── pages/
│   └── ...
├── data/
│   ├── products.json
│   └── ...
├── js/
│   ├── auth.js
│   ├── carrinho.js
│   ├── perfil.js
│   └── ...
├── pages/
│   ├── carrinho.html
│   ├── login.html
│   ├── perfil.html
│   └── ...
└── index.html


## 🛠️ Como Rodar o Projeto

1.  Clone ou baixe este repositório.
2.  Abra a pasta do projeto no **Visual Studio Code**.
3.  Com a extensão **Live Server** instalada, clique com o botão direito no arquivo `index.html`.
4.  Selecione a opção "Open with Live Server".

## 🔮 Próximos Passos (Back-end)

O trabalho de front-end foi concluído com sucesso. O próximo grande passo é o desenvolvimento do back-end para transformar a aplicação em uma plataforma de e-commerce completa. O plano inclui:

-   [ ] **Desenvolvimento da API REST** com Node.js e Express.
-   [ ] **Integração com o banco de dados PostgreSQL** para persistência de dados.
-   [ ] Implementação do sistema de **autenticação de usuários** com senhas criptografadas e tokens (JWT).
-   [ ] Criação de rotas para **gerenciamento em tempo real** de produtos e estoque.
-   [ ] Desenvolvimento da lógica para **processamento de pedidos e pagamentos**.
-   [ ] **Migração completa** da lógica de `localStorage` (carrinho, favoritos) para o banco de dados, associando os dados ao usuário logado.

---
Feito com ❤️ por **Roberto Silva**.
