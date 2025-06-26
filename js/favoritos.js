// Sistema de Favoritos Completo - Conectado à API

class FavoritesSystem {
    constructor() {
        this.favoritos = []; // A lista agora é preenchida pela API
        this.token = localStorage.getItem('userToken'); // Pega o token de autenticação
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.apiBaseUrl = 'http://localhost:3001/api'; // URL do nosso back-end
        
        this.init();
    }

    async init() {
        // Se o utilizador estiver logado, carrega os favoritos da base de dados
        if (this.token) {
            await this.loadFavoritesFromAPI();
        }
        this.setupEventListeners();
        this.updateFavoriteCount(); // Atualiza o contador no cabeçalho
    }

    setupEventListeners() {
        // Listener global para todos os botões de favorito
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.favorite-btn');
            if (btn) {
                e.preventDefault();
                e.stopPropagation();
                const productId = parseInt(btn.dataset.productId);
                if (!isNaN(productId)) {
                    this.toggleFavorite(productId, btn);
                }
            }
        });

        // Listener para produtos dinâmicos (pode ser útil se carregar mais produtos com scroll)
        document.addEventListener('DOMContentLoaded', () => {
            this.updateFavoriteButtons();
        });
    }

    // --- LÓGICA DE API ---

    async loadFavoritesFromAPI() {
        if (!this.token) return;
        try {
            const response = await fetch(`${this.apiBaseUrl}/favoritos`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!response.ok) throw new Error('Falha ao carregar favoritos da API.');
            
            this.favoritos = await response.json();
            this.updateAllUI();
        } catch (error) {
            console.error(error.message);
            this.favoritos = []; // Garante que a lista fica vazia em caso de erro
        }
    }
    
    async toggleFavorite(productId, buttonElement = null) {
        if (!this.token) {
            return this.showLoginPrompt();
        }

        const isFavorited = this.isFavorite(productId);
        const method = isFavorited ? 'DELETE' : 'POST';
        let url = `${this.apiBaseUrl}/favoritos`;
        if (method === 'DELETE') {
            url += `/${productId}`;
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: method === 'POST' ? JSON.stringify({ produtoId: productId }) : undefined
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Não foi possível atualizar os favoritos.');
            }
            
            // Após a ação bem-sucedida, recarrega a lista do servidor para garantir consistência
            await this.loadFavoritesFromAPI();
            
            this.showMessage(isFavorited ? 'Produto removido dos favoritos.' : 'Produto adicionado aos favoritos!', isFavorited ? 'info' : 'success');

            if (buttonElement) {
                this.animateFavoriteButton(buttonElement, !isFavorited);
            }

        } catch (error) {
            console.error('Ocorreu um erro na chamada à API de favoritos:', error.message);
            this.showMessage('Ocorreu um erro. Tente novamente.', 'error');
        }
    }

    // --- MÉTODOS DE ESTADO E UI ---

    isFavorite(productId) {
        return this.favoritos.some(p => p.id === productId);
    }

    getFavoriteCount() {
        return this.favoritos.length;
    }

    getFavorites() {
        return [...this.favoritos];
    }
    
    async clearFavorites() {
        if (!confirm('Tem a certeza que deseja limpar todos os favoritos?')) return;
        try {
            // É mais eficiente ter um endpoint para limpar tudo, mas isto funciona
            for (const fav of this.favoritos) {
                await fetch(`${this.apiBaseUrl}/favoritos/${fav.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${this.token}` }
                });
            }
            await this.loadFavoritesFromAPI();
            this.showMessage('Lista de favoritos limpa!', 'info');
        } catch (error) {
            this.showMessage('Erro ao limpar os favoritos.', 'error');
        }
    }
    
    updateAllUI() {
        this.updateFavoriteButtons();
        this.updateFavoriteCount();
        if (window.perfilManager && typeof window.perfilManager.renderFavorites === 'function') {
            window.perfilManager.favoritos = this.getFavorites();
            window.perfilManager.renderFavorites();
        }
    }

    updateFavoriteButtons() {
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            const productId = parseInt(btn.dataset.productId);
            if (!isNaN(productId)) {
                this.updateButtonState(btn, this.isFavorite(productId));
            }
        });
    }

    updateButtonState(button, isFavorited) {
        const icon = button.querySelector('i');
        const text = button.querySelector('.favorite-text');
        
        button.classList.toggle('favorited', isFavorited);
        button.setAttribute('aria-label', isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
        
        if (icon) {
            icon.classList.remove('fa-solid', 'fa-regular');
            icon.classList.add(isFavorited ? 'fa-solid' : 'fa-regular');
        }
        if (text) {
            text.textContent = isFavorited ? 'Favoritado' : 'Favoritar';
        }
    }

    updateFavoriteCount() {
        const count = this.getFavoriteCount();
        document.querySelectorAll('.favorites-count, .favoritos-count').forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        });
    }

    animateFavoriteButton(button, isAdding) {
        button.classList.remove('favorite-adding', 'favorite-removing');
        void button.offsetWidth; // Força reflow para reiniciar a animação
        if (isAdding) {
            button.classList.add('favorite-adding');
            this.createHeartBurst(button);
        } else {
            button.classList.add('favorite-removing');
        }
        setTimeout(() => {
            button.classList.remove('favorite-adding', 'favorite-removing');
        }, 600);
    }
    
    createHeartBurst(element) {
        const rect = element.getBoundingClientRect();
        for (let i = 0; i < 8; i++) {
            const heart = document.createElement('div');
            heart.innerHTML = '❤️';
            heart.style.cssText = `position: fixed; left: ${rect.left + rect.width / 2}px; top: ${rect.top + rect.height / 2}px; font-size: 1.2rem; pointer-events: none; z-index: 10000; animation: heartBurst${i} 1s ease-out forwards;`;
            document.body.appendChild(heart);
            const angle = (i * 45) * (Math.PI / 180);
            const distance = 50 + Math.random() * 30;
            const duration = 0.8 + Math.random() * 0.4;
            const keyframes = `@keyframes heartBurst${i} { 0% { transform: translate(0, 0) scale(0); opacity: 1; } 50% { transform: translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(1.2); opacity: 0.8; } 100% { transform: translate(${Math.cos(angle) * distance * 1.5}px, ${Math.sin(angle) * distance * 1.5}px) scale(0); opacity: 0; } }`;
            const style = document.createElement('style');
            style.textContent = keyframes;
            document.head.appendChild(style);
            setTimeout(() => { heart.remove(); style.remove(); }, duration * 1000);
        }
    }

    createHeartAnimation() {
        const heart = document.createElement('div');
        heart.innerHTML = '💖';
        heart.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 3rem; pointer-events: none; z-index: 10000; animation: floatingHeart 1.5s ease-out forwards;`;
        document.body.appendChild(heart);
        setTimeout(() => heart.remove(), 1500);
    }

    async getProductById(productId) {
        let product = this.getProductFromLocalData(productId);
        if (!product) product = this.getProductFromCurrentPage(productId);
        if (!product) {
            product = { id: productId, name: `Produto ${productId}`, price: 0, image: '../assets/produtos/placeholder.jpg' };
        }
        return product;
    }

    getProductFromLocalData(productId) {
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        return products.find(p => p.id === productId);
    }

    getProductFromCurrentPage(productId) {
        const productCard = document.querySelector(`[data-product-id="${productId}"]`);
        if (!productCard) return null;
        const name = productCard.querySelector('.produto__nome, .product-name, h3, h2')?.textContent || `Produto ${productId}`;
        const priceText = productCard.querySelector('.produto__preco, .product-price, .preco')?.textContent || 'R$ 0,00';
        const price = parseFloat(priceText.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        const image = productCard.querySelector('img')?.src || '../assets/produtos/placeholder.jpg';
        return { id: productId, name: name.trim(), price, image };
    }

    showLoginPrompt() {
        const modal = this.createLoginPromptModal();
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
    }

    createLoginPromptModal() {
        const modal = document.createElement('div');
        modal.className = 'favorites-modal';
        modal.innerHTML = `
            <div class="favorites-modal__overlay"></div>
            <div class="favorites-modal__content">
                <button class="favorites-modal__close">&times;</button>
                <div class="favorites-modal__icon"><i class="fa-solid fa-heart"></i></div>
                <h2>Faça login para salvar favoritos</h2>
                <p>Crie uma conta ou faça login para salvar os seus produtos favoritos e acedê-los em qualquer dispositivo.</p>
                <div class="favorites-modal__actions">
                    <a href="/pages/login.html" class="btn-primary">Fazer Login</a>
                    <button class="btn-secondary favorites-modal__close">Agora não</button>
                </div>
            </div>`;
        modal.querySelectorAll('.favorites-modal__close, .favorites-modal__overlay').forEach(el => {
            el.addEventListener('click', () => {
                modal.classList.remove('show');
                setTimeout(() => modal.remove(), 300);
            });
        });
        return modal;
    }

    showMessage(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `favorites-notification ${type}`;
        notification.innerHTML = `<div class="notification-content"><span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span><span class="notification-text">${message}</span></div>`;
        document.body.appendChild(notification);
        setTimeout(() => { notification.classList.add('show'); }, 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    createFavoriteButton(productId, options = {}) {
        const { size = 'medium', style = 'icon-text', className = '' } = options;
        const button = document.createElement('button');
        button.className = `favorite-btn favorite-btn--${size} favorite-btn--${style} ${className}`;
        button.dataset.productId = productId;
        const icon = document.createElement('i');
        icon.className = `favorite-icon fa-heart`;
        button.appendChild(icon);
        if (style === 'icon-text') {
            const text = document.createElement('span');
            text.className = 'favorite-text';
            button.appendChild(text);
        }
        this.updateButtonState(button, this.isFavorite(productId));
        return button;
    }
}

// Inicializar a classe
document.addEventListener('DOMContentLoaded', () => {
    if (!window.favoritesSystem) {
        window.favoritesSystem = new FavoritesSystem();
    }
});

// Adiciona os estilos dinamicamente, com um nome de variável único
const favoritesComponentCSS = `
    .favorite-btn.favorited { color: #dc2626; }
    .favorites-modal__icon i { font-size: 50px; color: #dc2626; }
    /* ... (resto do seu CSS para botões, modais, etc.) ... */
`;
const favoritesStyleElement = document.createElement('style');
favoritesStyleElement.textContent = favoritesComponentCSS;
document.head.appendChild(favoritesStyleElement);

