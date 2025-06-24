class FavoritesSystem {
    constructor() {
        this.favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.init();
    }

    init() {
        this.updateFavoriteButtons();
        this.updateFavoriteCount();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listener global para botões de favorito
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.favorite-btn');
            if (btn) {
                e.preventDefault();
                e.stopPropagation();
                const productId = parseInt(btn.dataset.productId);
                this.toggleFavorite(productId, btn);
            }
        });

        // Listener para produtos dinâmicos
        document.addEventListener('DOMContentLoaded', () => {
            this.updateFavoriteButtons();
        });
    }

    async toggleFavorite(productId, buttonElement = null) {
        try {
            if (!this.currentUser) {
                this.showLoginPrompt();
                return;
            }

            const isFavorited = this.isFavorite(productId);
            
            if (isFavorited) {
                await this.removeFavorite(productId);
                this.showMessage('Produto removido dos favoritos', 'info');
            } else {
                const product = await this.getProductById(productId);
                if (product) {
                    await this.addFavorite(product);
                    this.showMessage('Produto adicionado aos favoritos!', 'success');
                }
            }

            this.updateFavoriteButtons();
            this.updateFavoriteCount();
            
            if (buttonElement) {
                this.animateFavoriteButton(buttonElement, !isFavorited);
            }

            if (window.perfilPage) {
                window.perfilPage.loadFavoritos();
                window.perfilPage.updateCounts();
            }

        } catch (error) {
            console.error('Erro ao atualizar favoritos:', error);
            this.showMessage('Erro ao atualizar favoritos', 'error');
        }
    }

    async addFavorite(product) {
        if (this.isFavorite(product.id)) {
            return;
        }

        const favoriteItem = {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            addedAt: new Date().toISOString(),
            userId: this.currentUser?.id
        };

        this.favoritos.push(favoriteItem);
        this.saveFavorites();
        this.createHeartAnimation();
    }

    async removeFavorite(productId) {
        this.favoritos = this.favoritos.filter(fav => fav.id !== productId);
        this.saveFavorites();
    }

    isFavorite(productId) {
        return this.favoritos.some(fav => fav.id === productId);
    }

    getFavoriteCount() {
        return this.favoritos.length;
    }

    getFavorites() {
        return [...this.favoritos];
    }

    clearFavorites() {
        this.favoritos = [];
        this.saveFavorites();
        this.updateFavoriteButtons();
        this.updateFavoriteCount();
    }

    saveFavorites() {
        localStorage.setItem('favoritos', JSON.stringify(this.favoritos));
    }

    updateFavoriteButtons() {
        const favoriteButtons = document.querySelectorAll('.favorite-btn');
        favoriteButtons.forEach(btn => {
            const productId = parseInt(btn.dataset.productId);
            if (!isNaN(productId)) {
                const isFavorited = this.isFavorite(productId);
                this.updateButtonState(btn, isFavorited);
            }
        });
    }

    // <-- MUDANÇA PRINCIPAL: Manipula classes do Font Awesome em vez de 'src' da imagem
    updateButtonState(button, isFavorited) {
        const icon = button.querySelector('i'); // Agora procuramos pela tag <i>
        const text = button.querySelector('.favorite-text');
        
        if (isFavorited) {
            button.classList.add('favorited');
            button.setAttribute('aria-label', 'Remover dos favoritos');
            
            if (icon) {
                icon.classList.remove('fa-regular');
                icon.classList.add('fa-solid'); // Ícone de coração preenchido
            }
            if (text) text.textContent = 'Favoritado';

        } else {
            button.classList.remove('favorited');
            button.setAttribute('aria-label', 'Adicionar aos favoritos');
            
            if (icon) {
                icon.classList.remove('fa-solid');
                icon.classList.add('fa-regular'); // Ícone de coração com borda
            }
            if (text) text.textContent = 'Favoritar';
        }
    }

    updateFavoriteCount() {
        const count = this.getFavoriteCount();
        const badges = document.querySelectorAll('.favorites-count, .favoritos-count');
        
        badges.forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        });

        const perfilCount = document.getElementById('favoritos-count');
        if (perfilCount) {
            perfilCount.textContent = count;
        }
    }

    animateFavoriteButton(button, isAdding) {
        button.classList.remove('favorite-adding', 'favorite-removing');
        button.offsetHeight;
        
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
        // ... (código da animação permanece o mesmo)
    }

    createHeartAnimation() {
        // ... (código da animação permanece o mesmo)
    }

    async getProductById(productId) {
        // ... (código permanece o mesmo)
    }

    getProductFromLocalData(productId) {
        // ... (código permanece o mesmo)
    }

    getProductFromCurrentPage(productId) {
        // ... (código permanece o mesmo)
    }

    showLoginPrompt() {
        const modal = this.createLoginPromptModal();
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
    }

    // <-- MUDANÇA: Substituído <img> por <i> do Font Awesome no modal
    createLoginPromptModal() {
        const modal = document.createElement('div');
        modal.className = 'favorites-modal';
        modal.innerHTML = `
            <div class="favorites-modal__overlay"></div>
            <div class="favorites-modal__content">
                <button class="favorites-modal__close">&times;</button>
                <div class="favorites-modal__icon">
                    <i class="fa-solid fa-heart"></i>
                </div>
                <h2>Faça login para salvar favoritos</h2>
                <p>Crie uma conta ou faça login para salvar seus produtos favoritos e acessá-los em qualquer dispositivo.</p>
                <div class="favorites-modal__actions">
                    <a href="/pages/login.html" class="btn-primary">Fazer Login</a>
                    <button class="btn-secondary favorites-modal__close">Agora não</button>
                </div>
            </div>
        `;

        modal.querySelectorAll('.favorites-modal__close, .favorites-modal__overlay').forEach(el => {
            el.addEventListener('click', () => {
                modal.classList.remove('show');
                setTimeout(() => modal.remove(), 300);
            });
        });
        return modal;
    }

    showMessage(message, type = 'info') {
        // ... (código permanece o mesmo)
    }

    // <-- MUDANÇA: Função agora cria ícones do Font Awesome, não mais <img>
    createFavoriteButton(productId, options = {}) {
        const { size = 'medium', style = 'icon-text', className = '' } = options;
        const isFavorited = this.isFavorite(productId);
        
        const button = document.createElement('button');
        button.className = `favorite-btn favorite-btn--${size} favorite-btn--${style} ${className} ${isFavorited ? 'favorited' : ''}`;
        button.dataset.productId = productId;
        button.setAttribute('aria-label', isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos');

        const icon = document.createElement('i');
        icon.className = `favorite-icon ${isFavorited ? 'fa-solid' : 'fa-regular'} fa-heart`;
        button.appendChild(icon);

        if (style === 'icon-text') {
            const text = document.createElement('span');
            text.className = 'favorite-text';
            text.textContent = isFavorited ? 'Favoritado' : 'Favoritar';
            button.appendChild(text);
        }

        return button;
    }
}

// Criar instância global
window.favoritesSystem = new FavoritesSystem();

// <-- MUDANÇA: Renomeado 'favoritesCSS' para evitar conflito
const favoritesComponentStyle = `
/* ... (todo o seu CSS permanece o mesmo aqui) ... */
.favorites-modal__icon i {
    font-size: 50px;
    color: #dc2626;
}
`;

// <-- MUDANÇA: Renomeado 'style' para evitar conflito com outros scripts
const styleElement = document.createElement('style');
styleElement.textContent = favoritesComponentStyle;
document.head.appendChild(styleElement);