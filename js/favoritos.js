// Sistema de Favoritos Completo - Conectado à API

class FavoritesSystem {
    constructor() {
        this.favoritos = [];
        this.token = localStorage.getItem('userToken');
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.apiBaseUrl = 'http://localhost:3001/api';

        this.init();
    }

    async init() {
        console.log('Inicializando sistema de favoritos...');
        console.log('Token presente:', !!this.token);

        if (this.token) {
            await this.loadFavoritesFromAPI();
        }
        this.setupEventListeners();
        this.updateFavoriteCount();

        console.log('Sistema de favoritos inicializado. Favoritos carregados:', this.favoritos.length);
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.favorite-btn');
            if (btn) {
                e.preventDefault();
                e.stopPropagation();

                const productId = parseInt(btn.dataset.productId);
                console.log('Clique no botão de favoritos detectado. Product ID:', productId);

                if (!isNaN(productId)) {
                    this.toggleFavorite(productId, btn);
                } else {
                    console.error('Product ID inválido no botão:', btn.dataset.productId);
                }
            }
        });
    }

    async loadFavoritesFromAPI() {
        if (!this.token) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/favoritos`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) return this.handleInvalidToken();
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            this.favoritos = await response.json();
            this.updateAllUI();

        } catch (error) {
            console.error('Erro ao carregar favoritos da API:', error.message);
            this.favoritos = [];
        }
    }

    async toggleFavorite(productId, buttonElement = null) {
        if (!this.token) return this.showLoginPrompt();

        const isFavorited = this.isFavorite(productId);
        const method = isFavorited ? 'DELETE' : 'POST';
        let url = `${this.apiBaseUrl}/favoritos`;
        if (method === 'DELETE') url += `/${productId}`;

        if (buttonElement) {
            buttonElement.disabled = true;
            this.updateButtonState(buttonElement, !isFavorited);
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

            await this.loadFavoritesFromAPI();
            this.showMessage(isFavorited ? 'Produto removido dos favoritos.' : 'Produto adicionado aos favoritos!', isFavorited ? 'info' : 'success');

            if (buttonElement) this.animateFavoriteButton(buttonElement, !isFavorited);

        } catch (error) {
            console.error('Erro na requisição à API de favoritos:', error.message);
            if (buttonElement) this.updateButtonState(buttonElement, isFavorited);
            this.showMessage('Ocorreu um erro. Tente novamente.', 'error');

        } finally {
            if (buttonElement) buttonElement.disabled = false;
        }
    }

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
        if (!confirm('Tem certeza que deseja limpar todos os favoritos?')) return;
        if (!this.token) return this.showMessage('Faça login para gerenciar favoritos.', 'error');

        try {
            const promises = this.favoritos.map(fav =>
                fetch(`${this.apiBaseUrl}/favoritos/${fav.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${this.token}` }
                })
            );
            await Promise.all(promises);
            await this.loadFavoritesFromAPI();
            this.showMessage('Lista de favoritos limpa!', 'info');
        } catch (error) {
            console.error('Erro ao limpar favoritos:', error);
            this.showMessage('Erro ao limpar os favoritos.', 'error');
        }
    }

    updateAllUI() {
        this.updateFavoriteButtons();
        this.updateFavoriteCount();

        if (window.perfilManager?.renderFavorites) {
            window.perfilManager.favoritos = this.getFavorites();
            window.perfilManager.renderFavorites();
        }
    }

    updateFavoriteButtons() {
        const buttons = document.querySelectorAll('.favorite-btn');
        buttons.forEach(btn => {
            const productId = parseInt(btn.dataset.productId);
            if (!isNaN(productId)) {
                this.updateButtonState(btn, this.isFavorite(productId));
            }
        });
    }

    updateButtonState(button, isFavorited) {
        const icon = button.querySelector('i');
        const text = button.querySelector('.favorite-text, span');

        button.classList.toggle('favorited', isFavorited);
        button.setAttribute('aria-label', isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos');

        if (icon) {
            icon.classList.remove('fa-solid', 'fa-regular');
            icon.classList.add(isFavorited ? 'fa-solid' : 'fa-regular');
        }

        if (text) {
            text.textContent = isFavorited ? 'Favoritado' : 'Adicionar aos Favoritos';
        }
    }

    updateFavoriteCount() {
        const count = this.getFavoriteCount();
        const badges = document.querySelectorAll('.favorites-count, .favoritos-count');
        badges.forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        });
    }

    animateFavoriteButton(button, isAdding) {
        button.classList.remove('favorite-adding', 'favorite-removing');
        void button.offsetWidth;

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
        const heartsCount = 6;

        for (let i = 0; i < heartsCount; i++) {
            const heart = document.createElement('div');
            heart.innerHTML = '❤️';
            heart.style.cssText = `
                position: fixed; 
                left: ${rect.left + rect.width / 2}px; 
                top: ${rect.top + rect.height / 2}px; 
                font-size: 1.2rem; 
                pointer-events: none; 
                z-index: 10000;
                animation: heartBurst${i} 1s ease-out forwards;
            `;
            document.body.appendChild(heart);

            const angle = (i * 60) * (Math.PI / 180);
            const distance = 40 + Math.random() * 20;

            const keyframes = `
                @keyframes heartBurst${i} { 
                    0% { transform: translate(0, 0) scale(0); opacity: 1; } 
                    50% { transform: translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(1.2); opacity: 0.8; } 
                    100% { transform: translate(${Math.cos(angle) * distance * 1.5}px, ${Math.sin(angle) * distance * 1.5}px) scale(0); opacity: 0; }
                }
            `;

            const style = document.createElement('style');
            style.textContent = keyframes;
            document.head.appendChild(style);

            setTimeout(() => {
                heart.remove();
                style.remove();
            }, 1000);
        }
    }

    handleInvalidToken() {
        localStorage.removeItem('userToken');
        localStorage.removeItem('currentUser');
        this.token = null;
        this.currentUser = null;
        this.favoritos = [];
        this.updateAllUI();

        if (window.updateHeaderState) {
            window.updateHeaderState();
        }
    }

    async getProductById(productId) {
        let product = this.getProductFromLocalData(productId);
        if (!product) product = this.getProductFromCurrentPage(productId);
        if (!product) {
            product = {
                id: productId,
                name: `Produto ${productId}`,
                price: 0,
                image: '../assets/produtos/placeholder.jpg'
            };
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
                <p>Crie uma conta ou faça login para adicionar produtos aos seus favoritos.</p>
                <div class="favorites-modal__actions">
                    <a href="/login.html" class="btn btn-primary">Fazer Login</a>
                    <a href="/register.html" class="btn btn-secondary">Criar Conta</a>
                </div>
            </div>
        `;

        modal.querySelector('.favorites-modal__close').addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });

        modal.querySelector('.favorites-modal__overlay').addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });

        return modal;
    }

    showMessage(msg, type = 'info') {
        alert(`[${type.toUpperCase()}] ${msg}`); // Substitua com seu sistema de mensagens
    }
}

// Inicialização do sistema
document.addEventListener('DOMContentLoaded', () => {
    window.favoritesSystem = new FavoritesSystem();
});
