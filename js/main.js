class LojaDevApp {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.init();
    }

    async init() {
        await this.loadProducts();
        this.renderProducts();
        this.setupEventListeners();
        // ... outras inicializações ...
    }

    async loadProducts() {
        try {
            // --- A GRANDE MUDANÇA ESTÁ AQUI ---
            // Antes, buscávamos de um arquivo local.
            // Agora, buscamos da nossa nova API de back-end!
            const response = await fetch('http://localhost:3001/api/produtos');

            if (!response.ok) {
                // Se a resposta da API não for bem-sucedida, lança um erro.
                throw new Error(`Erro na API: ${response.statusText}`);
            }

            const productsData = await response.json();
            this.products = productsData;
            this.filteredProducts = productsData; // Inicialmente, todos os produtos são mostrados
            
            console.log('Produtos carregados com sucesso da API!', this.products);

        } catch (error) {
            console.error('Erro ao carregar produtos da API:', error);
            // Aqui você pode mostrar uma mensagem de erro na tela para o usuário.
            const productList = document.querySelector('.promocoes__list');
            if (productList) {
                productList.innerHTML = `<p class="error-message">Não foi possível carregar os produtos. Tente novamente mais tarde.</p>`;
            }
        }
    }

    renderProducts(productsToRender = this.filteredProducts) {
        const productList = document.querySelector('.promocoes__list');
        if (!productList) return;

        productList.innerHTML = ''; // Limpa a lista antes de renderizar

        if (productsToRender.length === 0) {
            productList.innerHTML = `<p>Nenhum produto encontrado.</p>`;
            return;
        }

        productsToRender.forEach(product => {
            // Ajusta o caminho da imagem para funcionar no GitHub Pages e localmente
            const imagePath = window.location.pathname.includes('/pages/') 
                ? `..${product.imagem_url.substring(1)}` 
                : product.imagem_url;

            const productCard = document.createElement('li');
            productCard.className = 'promocoes__list_item';
            productCard.dataset.productId = product.id; // Usando o ID do banco de dados

            productCard.innerHTML = `
                <img src="${imagePath}" alt="${product.nome}">
                <div class="promocoes__list_item_descricao">
                    <h4>${product.nome}</h4>
                    <p>R$ ${parseFloat(product.preco).toFixed(2).replace('.', ',')}</p>
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
        // Lógica para filtros ou busca, se houver
    }
}

// Inicializar a aplicação
document.addEventListener('DOMContentLoaded', () => {
    new LojaDevApp();
});
