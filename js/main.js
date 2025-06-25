// Gestor Principal da Aplicação UseDev

class LojaDevApp {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.init();
    }

    async init() {
        // Carrega os produtos apenas se estivermos na página inicial
        if (document.querySelector('.promocoes__list')) {
            await this.loadProducts();
            this.renderProducts();
        }
        // As configurações de eventos gerais podem continuar aqui
        this.setupEventListeners();
    }

    async loadProducts() {
        try {
            // Usa um caminho relativo para funcionar em qualquer ambiente
            const response = await fetch('./data/products.json');

            if (!response.ok) {
                throw new Error(`Erro na API: ${response.statusText}`);
            }

            const productsData = await response.json();
            this.products = productsData.products; // Ajustado para pegar o array de produtos
            this.filteredProducts = this.products;
            
            console.log('Produtos carregados com sucesso!', this.products);

        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            const productList = document.querySelector('.promocoes__list');
            if (productList) {
                productList.innerHTML = `<p class="error-message">Não foi possível carregar os produtos. Tente novamente mais tarde.</p>`;
            }
        }
    }

    renderProducts(productsToRender = this.filteredProducts) {
        const productList = document.querySelector('.promocoes__list');
        if (!productList) return;

        productList.innerHTML = ''; 

        if (!productsToRender || productsToRender.length === 0) {
            productList.innerHTML = `<p>Nenhum produto encontrado.</p>`;
            return;
        }

        productsToRender.forEach(product => {
            const imagePath = product.image; // Caminho já é relativo a partir do JSON

            const productCard = document.createElement('li');
            productCard.className = 'promocoes__list_item';
            productCard.dataset.productId = product.id;

            productCard.innerHTML = `
                <img src="${imagePath}" alt="${product.name}">
                <div class="promocoes__list_item_descricao">
                    <h4>${product.name}</h4>
                    <p>R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')}</p>
                </div>
            `;

            productCard.addEventListener('click', () => {
                sessionStorage.setItem('selectedProductId', product.id);
                window.location.href = './pages/product.html';
            });

            productList.appendChild(productCard);
        });
    }

    setupEventListeners() {
        // Lógica futura para filtros ou busca na página inicial
    }
}


/**
 * GESTÃO DO ESTADO DE LOGIN NO CABEÇALHO
 * Esta função verifica se um utilizador está logado (verificando o localStorage)
 * e atualiza o cabeçalho para mostrar as informações corretas.
 * É executada em todas as páginas que incluem o main.js.
 */
function atualizarEstadoCabecalho() {
    const utilizadorLogado = JSON.parse(localStorage.getItem('currentUser'));
    const token = localStorage.getItem('userToken');

    const acoesDeslogado = document.getElementById('user-actions-logged-out');
    const acoesLogado = document.getElementById('user-actions-logged-in');
    const nomeUtilizadorEl = document.getElementById('user-greeting-name');
    const btnLogout = document.getElementById('header-logout-btn');

    // Garante que os elementos existem antes de tentar manipulá-los
    if (!acoesDeslogado || !acoesLogado || !nomeUtilizadorEl || !btnLogout) {
        console.warn("Elementos do cabeçalho para autenticação não encontrados nesta página.");
        return;
    }

    if (utilizadorLogado && token) {
        // Se o utilizador estiver logado:
        // 1. Mostra a saudação e os botões de perfil/sair
        acoesLogado.style.display = 'flex';
        acoesDeslogado.style.display = 'none';

        // 2. Personaliza a saudação com o nome do utilizador
        nomeUtilizadorEl.textContent = `Olá, ${utilizadorLogado.nome}`;

        // 3. Adiciona o evento de clique ao botão de logout
        btnLogout.onclick = () => {
            if (confirm('Tem a certeza que deseja sair?')) {
                localStorage.removeItem('currentUser');
                localStorage.removeItem('userToken');
                // Recarrega a página para refletir o estado de deslogado
                window.location.href = '/index.html'; // Redireciona para a página inicial
            }
        };

    } else {
        // Se o utilizador não estiver logado:
        // Mostra apenas o botão de Login
        acoesLogado.style.display = 'none';
        acoesDeslogado.style.display = 'block';
    }
}

// Inicializar a aplicação e o estado do cabeçalho
document.addEventListener('DOMContentLoaded', () => {
    new LojaDevApp();
    atualizarEstadoCabecalho();
});
