class FavoritosPageManager {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
        this.filteredFavoritos = [...this.favoritos];
        this.currentView = 'grid'; // 'grid' ou 'list'
        this.currentSort = 'newest';
        this.currentFilter = '';
        this.isLoading = false;
        this.init();
    }

    init() {
        this.checkAuthState();
        this.setupEventListeners();
        this.loadFavoritos();
        this.updateStats();
        this.updateCartCount();
    }

    checkAuthState() {
        const loginRequired = document.getElementById('login-required');
        const favoritosContent = document.querySelector('.favoritos-content');
        const favoritosHeader = document.querySelector('.favoritos-header');
        const favoritosControls = document.querySelector('.favoritos-controls');

        if (!this.currentUser) {
            // Usuário não logado
            loginRequired.style.display = 'block';
            favoritosContent.style.display = 'none';
            favoritosHeader.style.display = 'none';
            favoritosControls.style.display = 'none';
            
            // Atualizar descrição
            document.getElementById('favoritos-description').textContent = 'Faça login para ver seus favoritos';
            return false;
        }

        // Usuário logado
        loginRequired.style.display = 'none';
        favoritosContent.style.display = 'block';
        favoritosHeader.style.display = 'flex';
        favoritosControls.style.display = 'flex';
        return true;
    }

    setupEventListeners() {
        // Filtros e ordenação
        document.getElementById('price-filter').addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.applyFiltersAndSort();
        });

        document.getElementById('sort-favorites').addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.applyFiltersAndSort();
        });

        // Toggle de visualização
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.closest('.view-btn').dataset.view);
            });
        });

        // Limpar todos os favoritos
        document.getElementById('clear-all-favorites').addEventListener('click', () => {
            this.clearAllFavorites();
        });

        // Atualizar header do usuário
        this.updateAuthHeader();
    }

    updateAuthHeader() {
        if (this.currentUser) {
            const loginLink = document.querySelector('.cabecalho__nav_list_link-login');
            if (loginLink) {
                loginLink.textContent = `Olá, ${this.currentUser.nome}`;
                loginLink.href = './perfil.html';
            }
        }
    }

    async loadFavoritos() {
        if (!this.checkAuthState()) return;

        this.showLoading(true);

        try {
            // Simular delay de carregamento
            await this.delay(800);

            // Recarregar favoritos do localStorage
            this.favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
            this.filteredFavoritos = [...this.favoritos];

            this.applyFiltersAndSort();
            this.updateStats();

        } catch (error) {
            console.error('Erro ao carregar favoritos:', error);
            this.showMessage('Erro ao carregar favoritos', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    applyFiltersAndSort() {
        let filtered = [...this.favoritos];

        // Aplicar filtro de preço
        if (this.currentFilter) {
            filtered = this.filterByPrice(filtered, this.currentFilter);
        }

        // Aplicar ordenação
        filtered = this.sortFavorites(filtered, this.currentSort);

        this.filteredFavoritos = filtered;
        this.renderFavoritos();
        this.updateStats();
    }

    filterByPrice(favoritos, filter) {
        switch (filter) {
            case '0-50':
                return favoritos.filter(fav => fav.price <= 50);
            case '50-100':
                return favoritos.filter(fav => fav.price > 50 && fav.price <= 100);
            case '100-200':
                return favoritos.filter(fav => fav.price > 100 && fav.price <= 200);
            case '200+':
                return favoritos.filter(fav => fav.price > 200);
            default:
                return favoritos;
        }
    }

    sortFavorites(favoritos, sortBy) {
        switch (sortBy) {
            case 'newest':
                return favoritos.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
            case 'oldest':
                return favoritos.sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt));
            case 'name-asc':
                return favoritos.sort((a, b) => a.name.localeCompare(b.name));
            case 'name-desc':
                return favoritos.sort((a, b) => b.name.localeCompare(a.name));
            case 'price-asc':
                return favoritos.sort((a, b) => a.price - b.price);
            case 'price-desc':
                return favoritos.sort((a, b) => b.price - a.price);
            default:
                return favoritos;
        }
    }

    renderFavoritos() {
        const grid = document.getElementById('favoritos-grid');
        const emptyState = document.getElementById('empty-state');

        if (this.filteredFavoritos.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            
            // Verificar se é por filtro ou realmente vazio
            if (this.favoritos.length > 0 && this.filteredFavoritos.length === 0) {
                emptyState.querySelector('h2').textContent = 'Nenhum favorito encontrado';
                emptyState.querySelector('p').textContent = 'Tente ajustar os filtros para encontrar seus produtos favoritos.';
                emptyState.querySelector('.empty-actions').innerHTML = `
                    <button class="btn-secondary" onclick="favoritosPage.clearFilters()">
                        Limpar Filtros
                    </button>
                `;
            } else {
                emptyState.querySelector('h2').textContent = 'Sua lista de favoritos está vazia';
                emptyState.querySelector('p').textContent = 'Explore nossos produtos e adicione seus favoritos para encontrá-los facilmente depois.';
                emptyState.querySelector('.empty-actions').innerHTML = `
                    <a href="../index.html" class="btn-primary">
                        <img src="../assets/icons/shopping-bag.svg" alt="Comprar">
                        Explorar Produtos
                    </a>
                    <a href="../pages/categorias.html" class="btn-secondary">
                        Ver Categorias
                    </a>
                `;
            }
            return;
        }

        grid.style.display = 'grid';
        emptyState.style.display = 'none';
        grid.innerHTML = '';

        // Aplicar classe de visualização
        grid.className = `favoritos-grid ${this.currentView}-view`;

        this.filteredFavoritos.forEach((favorito, index) => {
            const card = this.createProductCard(favorito, index);
            grid.appendChild(card);
        });

        // Inicializar tooltips
        this.initializeTooltips();
    }

    createProductCard(favorito, index) {
        const card = document.createElement('div');
        card.className = `favorite-product-card ${this.currentView}-view`;
        card.style.animationDelay = `${index * 0.1}s`;

        const addedDate = new Date(favorito.addedAt).toLocaleDateString('pt-BR');
        const formattedPrice = `R$ ${favorito.price.toFixed(2).replace('.', ',')}`;

        card.innerHTML = `
            <div class="product-image">
                <img src="${favorito.image}" alt="${favorito.name}" loading="lazy">
                <button class="card-favorite-btn favorite-btn favorited" 
                        data-product-id="${favorito.id}"
                        data-tooltip="Remover dos favoritos">
                    <img src="../assets/icons/heart-filled.svg" alt="Remover dos favoritos" class="favorite-icon">
                </button>
            </div>
            <div class="product-info">
                <div class="product-details">
                    <h3 class="product-name">${favorito.name}</h3>
                    <p class="product-date">Favoritado em ${addedDate}</p>
                </div>
                <div class="product-price">${formattedPrice}</div>
                <div class="product-actions">
                    <button class="action-btn view tooltip" 
                            data-tooltip="Ver produto"
                            onclick="favoritosPage.viewProduct(${favorito.id})">
                        <img src="../assets/icons/eye.svg" alt="Ver produto">
                    </button>
                    <button class="action-btn cart tooltip" 
                            data-tooltip="Adicionar ao carrinho"
                            onclick="favoritosPage.addToCart(${favorito.id})">
                        <img src="../assets/icons/shopping-cart.svg" alt="Adicionar ao carrinho">
                    </button>
                    <button class="action-btn remove tooltip" 
                            data-tooltip="Remover dos favoritos"
                            onclick="favoritosPage.removeFavorite(${favorito.id})">
                        <img src="../assets/icons/trash.svg" alt="Remover dos favoritos">
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    switchView(view) {
        this.currentView = view;
        
        // Atualizar botões
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        // Re-renderizar com nova visualização
        this.renderFavoritos();
        
        // Salvar preferência
        localStorage.setItem('favoritesView', view);
    }

    async removeFavorite(productId) {
        try {
            // Animação de remoção
            const card = document.querySelector(`[data-product-id="${productId}"]`).closest('.favorite-product-card');
            card.classList.add('removing');

            // Aguardar animação
            await this.delay(500);

            // Remover do sistema de favoritos
            window.favoritesSystem.removeFavorite(productId);

            // Atualizar dados locais
            this.favoritos = this.favoritos.filter(fav => fav.id !== productId);
            this.filteredFavoritos = this.filteredFavoritos.filter(fav => fav.id !== productId);

            // Re-renderizar
            this.renderFavoritos();
            this.updateStats();

            this.showMessage('Produto removido dos favoritos', 'success');

        } catch (error) {
            console.error('Erro ao remover favorito:', error);
            this.showMessage('Erro ao remover favorito', 'error');
        }
    }

    async addToCart(productId) {
        try {
            const favorito = this.favoritos.find(fav => fav.id === productId);
            if (!favorito) return;

            // Simular adição ao carrinho
            let cart = JSON.parse(localStorage.getItem('cart')) || [];
            const existingItem = cart.find(item => item.id === productId);

            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({
                    id: favorito.id,
                    name: favorito.name,
                    price: favorito.price,
                    image: favorito.image,
                    quantity: 1
                });
            }

            localStorage.setItem('cart', JSON.stringify(cart));
            this.updateCartCount();

            // Animação do botão
            const button = document.querySelector(`[onclick="favoritosPage.addToCart(${productId})"]`);
            button.style.transform = 'scale(1.2)';
            button.style.backgroundColor = '#10b981';
            
            setTimeout(() => {
                button.style.transform = '';
                button.style.backgroundColor = '';
            }, 300);

            this.showMessage('Produto adicionado ao carrinho!', 'success');

        } catch (error) {
            console.error('Erro ao adicionar ao carrinho:', error);
            this.showMessage('Erro ao adicionar ao carrinho', 'error');
        }
    }

    viewProduct(productId) {
        // Salvar ID do produto selecionado
        sessionStorage.setItem('selectedProductId', productId);
        
        // Redirecionar para página do produto
        window.location.href = './product.html';
    }

    async clearAllFavorites() {
        if (!confirm('Tem certeza que deseja remover todos os produtos dos favoritos?')) {
            return;
        }

        try {
            this.showLoading(true);

            // Animação de remoção em cascata
            const cards = document.querySelectorAll('.favorite-product-card');
            cards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('removing');
                }, index * 100);
            });

            // Aguardar todas as animações
            await this.delay(cards.length * 100 + 500);

            // Limpar favoritos
            window.favoritesSystem.clearFavorites();
            this.favoritos = [];
            this.filteredFavoritos = [];

            // Re-renderizar
            this.renderFavoritos();
            this.updateStats();

            this.showMessage('Todos os favoritos foram removidos', 'success');

        } catch (error) {
            console.error('Erro ao limpar favoritos:', error);
            this.showMessage('Erro ao limpar favoritos', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    clearFilters() {
        document.getElementById('price-filter').value = '';
        document.getElementById('sort-favorites').value = 'newest';
        this.currentFilter = '';
        this.currentSort = 'newest';
        this.applyFiltersAndSort();
    }

    updateStats() {
        const count = this.filteredFavoritos.length;
        const total = this.filteredFavoritos.reduce((sum, fav) => sum + fav.price, 0);

        document.getElementById('stats-count').textContent = `${count} ${count === 1 ? 'item' : 'itens'}`;
        document.getElementById('stats-value').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;

        // Atualizar descrição
        const description = document.getElementById('favoritos-description');
        if (count === 0) {
            description.textContent = 'Seus produtos favoritos em um só lugar';
        } else {
            description.textContent = `${count} ${count === 1 ? 'produto favorito' : 'produtos favoritos'} • Valor total: R$ ${total.toFixed(2).replace('.', ',')}`;
        }
    }

    updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const count = cart.reduce((total, item) => total + item.quantity, 0);
        const badge = document.getElementById('cart-count');
        
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    initializeTooltips() {
        // Os tooltips são implementados via CSS :hover
        // Esta função pode ser usada para tooltips mais complexos se necessário
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        const content = document.querySelector('.favoritos-content');
        
        if (show) {
            loading.style.display = 'block';
            content.style.opacity = '0.5';
            content.style.pointerEvents = 'none';
            this.isLoading = true;
        } else {
            loading.style.display = 'none';
            content.style.opacity = '1';
            content.style.pointerEvents = '';
            this.isLoading = false;
        }
    }

    showMessage(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `favorites-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">
                    ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
                </span>
                <span class="notification-text">${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Mostrar notificação
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Remover após 4 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Método público para sincronizar com o sistema global de favoritos
    syncWithGlobalFavorites() {
        this.favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
        this.applyFiltersAndSort();
        this.updateStats();
    }

    // Métodos para integração com outras páginas
    goToProduct(productId) {
        sessionStorage.setItem('selectedProductId', productId);
        window.location.href = './product.html';
    }

    goToCart() {
        window.location.href = './carrinho.html';
    }

    shareWishlist() {
        const wishlistData = {
            user: this.currentUser.nome,
            items: this.favoritos.map(fav => ({
                name: fav.name,
                price: fav.price
            })),
            total: this.favoritos.reduce((sum, fav) => sum + fav.price, 0)
        };

        if (navigator.share) {
            navigator.share({
                title: 'Minha Lista de Favoritos - UseDev',
                text: `Confira minha lista de favoritos com ${this.favoritos.length} produtos!`,
                url: window.location.href
            });
        } else {
            // Fallback para copiar URL
            navigator.clipboard.writeText(window.location.href);
            this.showMessage('Link copiado para a área de transferência!', 'success');
        }
    }
}

// Função para gerar dados mock de favoritos (para demonstração)
function generateMockFavorites() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    const existingFavorites = JSON.parse(localStorage.getItem('favoritos')) || [];
    if (existingFavorites.length > 0) return; // Já existem favoritos

    const mockProducts = [
        {
            id: 1,
            name: 'Camiseta React Developer',
            price: 79.90,
            image: '../assets/produtos/camiseta-react.jpg'
        },
        {
            id: 2,
            name: 'Caneca JavaScript Coffee',
            price: 29.90,
            image: '../assets/produtos/caneca-js.jpg'
        },
        {
            id: 3,
            name: 'Mousepad Geek Code',
            price: 45.90,
            image: '../assets/produtos/mousepad-code.jpg'
        },
        {
            id: 4,
            name: 'Livro Clean Code',
            price: 89.90,
            image: '../assets/produtos/livro-clean-code.jpg'
        },
        {
            id: 5,
            name: 'Adesivos Git Commits',
            price: 15.90,
            image: '../assets/produtos/adesivos-git.jpg'
        }
    ];

    const mockFavorites = mockProducts.map((product, index) => ({
        ...product,
        addedAt: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toISOString(),
        userId: currentUser.id
    }));

    localStorage.setItem('favoritos', JSON.stringify(mockFavorites));
}

// Inicializar página de favoritos
let favoritosPage;
document.addEventListener('DOMContentLoaded', () => {
    // Gerar dados mock se necessário
    generateMockFavorites();
    
    // Inicializar página
    favoritosPage = new FavoritosPageManager();
    
    // Carregar preferência de visualização
    const savedView = localStorage.getItem('favoritesView');
    if (savedView && ['grid', 'list'].includes(savedView)) {
        favoritosPage.switchView(savedView);
    }
});

// Escutar mudanças nos favoritos de outras páginas
window.addEventListener('storage', (e) => {
    if (e.key === 'favoritos' && favoritosPage) {
        favoritosPage.syncWithGlobalFavorites();
    }
});

// Atalhos de teclado
document.addEventListener('keydown', (e) => {
    if (!favoritosPage || favoritosPage.isLoading) return;

    switch (e.key) {
        case 'Escape':
            favoritosPage.clearFilters();
            break;
        case 'g':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                favoritosPage.switchView('grid');
            }
            break;
        case 'l':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                favoritosPage.switchView('list');
            }
            break;
    }
});