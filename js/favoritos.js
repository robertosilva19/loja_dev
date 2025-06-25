// Sistema de Favoritos Completo - Conectado à API

class FavoritesSystem {
    constructor() {
        this.favoritos = []; // A lista será preenchida pela API
        this.token = localStorage.getItem('userToken'); // Pega o token de autenticação
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
    }

    // --- LÓGICA DE API ---

    // NOVO: Carrega a lista de favoritos da API
    async loadFavoritesFromAPI() {
        if (!this.token) return;
        try {
            const response = await fetch(`${this.apiBaseUrl}/favoritos`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!response.ok) throw new Error('Falha ao carregar favoritos da API.');
            
            this.favoritos = await response.json();
            this.updateFavoriteButtons(); // Atualiza a aparência dos botões na página
        } catch (error) {
            console.error(error.message);
        }
    }
    
    // ATUALIZADO: Adiciona ou remove um favorito via API
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
                throw new Error('Não foi possível atualizar os favoritos.');
            }

            // Após a ação bem-sucedida, recarrega a lista do servidor
            await this.loadFavoritesFromAPI();
            this.updateFavoriteCount();
            
            this.showMessage(isFavorited ? 'Produto removido dos favoritos.' : 'Produto adicionado aos favoritos!', isFavorited ? 'info' : 'success');

            if (buttonElement) {
                this.animateFavoriteButton(buttonElement, !isFavorited);
            }

            // Atualiza a página de perfil, se estiver aberta
            if (window.perfilPage) {
                window.perfilPage.loadFavorites(); 
            }

        } catch (error) {
            console.error(error.message);
            this.showMessage('Ocorreu um erro. Tente novamente.', 'error');
        }
    }

    // --- MÉTODOS DE ESTADO E UI (INTERFACE DO UTILIZADOR) ---

    isFavorite(productId) {
        return this.favoritos.some(p => p.id === productId);
    }

    getFavoriteCount() {
        return this.favoritos.length;
    }

    getFavorites() {
        return [...this.favoritos];
    }
    
    // Função para criar um botão de favorito (usada pelo main.js)
    createFavoriteButton(productId, options = {}) {
        const { size = 'medium', style = 'icon-text', className = '' } = options;
        const isFavorited = this.isFavorite(productId);
        
        const button = document.createElement('button');
        button.className = `favorite-btn favorite-btn--${size} favorite-btn--${style} ${className}`;
        button.dataset.productId = productId;
        
        const icon = document.createElement('i');
        // Usa Font Awesome em vez de <img>
        icon.className = `favorite-icon ${isFavorited ? 'fa-solid' : 'fa-regular'} fa-heart`;
        button.appendChild(icon);

        if (style === 'icon-text') {
            const text = document.createElement('span');
            text.className = 'favorite-text';
            text.textContent = isFavorited ? 'Favoritado' : 'Favoritar';
            button.appendChild(text);
        }
        
        this.updateButtonState(button, isFavorited); // Aplica o estado visual correto
        return button;
    }

    // Atualiza a aparência de TODOS os botões de favorito na página
    updateFavoriteButtons() {
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            const productId = parseInt(btn.dataset.productId);
            if (!isNaN(productId)) {
                const isFavorited = this.isFavorite(productId);
                this.updateButtonState(btn, isFavorited);
            }
        });
    }

    // Atualiza a aparência de UM botão específico
    updateButtonState(button, isFavorited) {
        const icon = button.querySelector('i');
        const text = button.querySelector('.favorite-text');
        
        button.setAttribute('aria-label', isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
        
        if (isFavorited) {
            button.classList.add('favorited');
            if (icon) {
                icon.classList.remove('fa-regular');
                icon.classList.add('fa-solid');
            }
            if (text) text.textContent = 'Favoritado';
        } else {
            button.classList.remove('favorited');
            if (icon) {
                icon.classList.remove('fa-solid');
                icon.classList.add('fa-regular');
            }
            if (text) text.textContent = 'Favoritar';
        }
    }

    updateFavoriteCount() {
        const count = this.getFavoriteCount();
        document.querySelectorAll('.favorites-count, .favoritos-count').forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        });
    }

    // O resto das suas funções de UI, animações, etc.
    animateFavoriteButton(button, isAdding) { /* ... seu código de animação ... */ }
    createHeartBurst(element) { /* ... seu código de animação ... */ }
    createHeartAnimation() { /* ... seu código de animação ... */ }
    async getProductById(productId) { /* ... sua lógica para encontrar um produto ... */ }
    showLoginPrompt() { /* ... sua lógica do modal ... */ }
    showMessage(message, type = 'info') { /* ... sua lógica de notificação ... */ }
}

// Inicializar a classe
document.addEventListener('DOMContentLoaded', () => {
    // Garante que uma instância global seja criada para que outras páginas possam aceder
    if (!window.favoritesSystem) {
        window.favoritesSystem = new FavoritesSystem();
    }
});
