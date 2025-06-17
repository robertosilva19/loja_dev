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
            if (e.target.closest('.favorite-btn')) {
                const btn = e.target.closest('.favorite-btn');
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
            // Verificar se usuário está logado
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

            // Atualizar interface
            this.updateFavoriteButtons();
            this.updateFavoriteCount();
            
            // Animação no botão
            if (buttonElement) {
                this.animateFavoriteButton(buttonElement, !isFavorited);
            }

            // Atualizar página de perfil se estiver aberta
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
        // Verificar se já existe
        if (this.isFavorite(product.id)) {
            return;
        }

        // Adicionar aos favoritos
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

        // Animação de coração
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
            const isFavorited = this.isFavorite(productId);
            
            this.updateButtonState(btn, isFavorited);
        });
    }

    updateButtonState(button, isFavorited) {
        const icon = button.querySelector('.favorite-icon');
        const text = button.querySelector('.favorite-text');
        
        if (isFavorited) {
            button.classList.add('favorited');
            button.setAttribute('aria-label', 'Remover dos favoritos');
            button.setAttribute('title', 'Remover dos favoritos');
            
            if (icon) {
                icon.src = icon.dataset.filledIcon || '../assets/icons/heart-filled.svg';
                icon.alt = 'Remover dos favoritos';
            }
            
            if (text) {
                text.textContent = 'Favoritado';
            }
        } else {
            button.classList.remove('favorited');
            button.setAttribute('aria-label', 'Adicionar aos favoritos');
            button.setAttribute('title', 'Adicionar aos favoritos');
            
            if (icon) {
                icon.src = icon.dataset.emptyIcon || '../assets/icons/heart.svg';
                icon.alt = 'Adicionar aos favoritos';
            }
            
            if (text) {
                text.textContent = 'Favoritar';
            }
        }
    }

    updateFavoriteCount() {
        const count = this.getFavoriteCount();
        const badges = document.querySelectorAll('.favorites-count, .favoritos-count');
        
        badges.forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        });

        // Atualizar contador no perfil
        const perfilCount = document.getElementById('favoritos-count');
        if (perfilCount) {
            perfilCount.textContent = count;
        }
    }

    animateFavoriteButton(button, isAdding) {
        // Remover classes de animação existentes
        button.classList.remove('favorite-adding', 'favorite-removing');
        
        // Força reflow
        button.offsetHeight;
        
        // Adicionar nova animação
        if (isAdding) {
            button.classList.add('favorite-adding');
            this.createHeartBurst(button);
        } else {
            button.classList.add('favorite-removing');
        }

        // Remover classe após animação
        setTimeout(() => {
            button.classList.remove('favorite-adding', 'favorite-removing');
        }, 600);
    }

    createHeartBurst(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Criar múltiplos corações
        for (let i = 0; i < 8; i++) {
            const heart = document.createElement('div');
            heart.innerHTML = '❤️';
            heart.style.cssText = `
                position: fixed;
                left: ${centerX}px;
                top: ${centerY}px;
                font-size: 1.2rem;
                pointer-events: none;
                z-index: 10000;
                animation: heartBurst${i} 1s ease-out forwards;
            `;

            document.body.appendChild(heart);

            // Criar animação única para cada coração
            const angle = (i * 45) * (Math.PI / 180);
            const distance = 50 + Math.random() * 30;
            const duration = 0.8 + Math.random() * 0.4;

            const keyframes = `
                @keyframes heartBurst${i} {
                    0% {
                        transform: translate(0, 0) scale(0);
                        opacity: 1;
                    }
                    50% {
                        transform: translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(1.2);
                        opacity: 0.8;
                    }
                    100% {
                        transform: translate(${Math.cos(angle) * distance * 1.5}px, ${Math.sin(angle) * distance * 1.5}px) scale(0);
                        opacity: 0;
                    }
                }
            `;

            // Adicionar keyframes ao documento
            const style = document.createElement('style');
            style.textContent = keyframes;
            document.head.appendChild(style);

            // Remover elementos após animação
            setTimeout(() => {
                heart.remove();
                style.remove();
            }, duration * 1000);
        }
    }

    createHeartAnimation() {
        // Animação de coração flutuante global
        const heart = document.createElement('div');
        heart.innerHTML = '💖';
        heart.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 3rem;
            pointer-events: none;
            z-index: 10000;
            animation: floatingHeart 1.5s ease-out forwards;
        `;

        document.body.appendChild(heart);

        // Remover após animação
        setTimeout(() => {
            heart.remove();
        }, 1500);
    }

    async getProductById(productId) {
        // Tentar obter produto dos dados locais primeiro
        let product = this.getProductFromLocalData(productId);
        
        if (!product) {
            // Buscar nos produtos da página atual
            product = this.getProductFromCurrentPage(productId);
        }

        if (!product) {
            // Como fallback, criar produto básico
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
        // Buscar em dados locais se existirem
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        return products.find(p => p.id === productId);
    }

    getProductFromCurrentPage(productId) {
        // Buscar produto na página atual
        const productCard = document.querySelector(`[data-product-id="${productId}"]`);
        if (!productCard) return null;

        const name = productCard.querySelector('.produto__nome, .product-name, h3, h2')?.textContent || `Produto ${productId}`;
        const priceText = productCard.querySelector('.produto__preco, .product-price, .preco')?.textContent || 'R$ 0,00';
        const price = parseFloat(priceText.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        const image = productCard.querySelector('img')?.src || '../assets/produtos/placeholder.jpg';

        return {
            id: productId,
            name: name.trim(),
            price,
            image
        };
    }

    showLoginPrompt() {
        const modal = this.createLoginPromptModal();
        document.body.appendChild(modal);
        
        // Mostrar modal
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    createLoginPromptModal() {
        const modal = document.createElement('div');
        modal.className = 'favorites-modal';
        modal.innerHTML = `
            <div class="favorites-modal__overlay"></div>
            <div class="favorites-modal__content">
                <button class="favorites-modal__close">&times;</button>
                <div class="favorites-modal__icon">
                    <img src="../assets/icons/heart-filled.svg" alt="Favoritos">
                </div>
                <h2>Faça login para salvar favoritos</h2>
                <p>Crie uma conta ou faça login para salvar seus produtos favoritos e acessá-los em qualquer dispositivo.</p>
                <div class="favorites-modal__actions">
                    <a href="./pages/login.html" class="btn-primary">Fazer Login</a>
                    <button class="btn-secondary favorites-modal__close">Agora não</button>
                </div>
            </div>
        `;

        // Event listeners
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

    // Métodos para integração com outras páginas
    createFavoriteButton(productId, options = {}) {
        const {
            size = 'medium',
            style = 'icon-text',
            className = ''
        } = options;

        const isFavorited = this.isFavorite(productId);
        
        const button = document.createElement('button');
        button.className = `favorite-btn favorite-btn--${size} favorite-btn--${style} ${className} ${isFavorited ? 'favorited' : ''}`;
        button.dataset.productId = productId;
        button.setAttribute('aria-label', isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
        button.setAttribute('title', isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos');

        if (style === 'icon-only') {
            button.innerHTML = `
                <img class="favorite-icon" 
                     src="${isFavorited ? '../assets/icons/heart-filled.svg' : '../assets/icons/heart.svg'}" 
                     alt="${isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}"
                     data-empty-icon="../assets/icons/heart.svg"
                     data-filled-icon="../assets/icons/heart-filled.svg">
            `;
        } else {
            button.innerHTML = `
                <img class="favorite-icon" 
                     src="${isFavorited ? '../assets/icons/heart-filled.svg' : '../assets/icons/heart.svg'}" 
                     alt="${isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}"
                     data-empty-icon="../assets/icons/heart.svg"
                     data-filled-icon="../assets/icons/heart-filled.svg">
                <span class="favorite-text">${isFavorited ? 'Favoritado' : 'Favoritar'}</span>
            `;
        }

        return button;
    }

    // Integração com o perfil do usuário
    updateUserFavorites() {
        if (window.perfilPage) {
            window.perfilPage.favoritos = this.getFavorites();
            window.perfilPage.loadFavoritos();
            window.perfilPage.updateCounts();
        }
    }
}

// Criar instância global
window.favoritesSystem = new FavoritesSystem();

// CSS para o sistema de favoritos
const favoritesCSS = `
/* Botões de Favorito */
.favorite-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border: none;
    background: none;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.3s ease;
    font-size: 0.9rem;
    color: var(--cor-cinza-escuro);
    position: relative;
    overflow: hidden;
}

.favorite-btn:hover {
    background-color: rgba(220, 38, 38, 0.1);
    color: #dc2626;
}

.favorite-btn.favorited {
    color: #dc2626;
}

.favorite-btn.favorited:hover {
    background-color: rgba(220, 38, 38, 0.2);
}

.favorite-btn--small {
    padding: 0.25rem;
    font-size: 0.8rem;
}

.favorite-btn--large {
    padding: 0.75rem 1rem;
    font-size: 1rem;
}

.favorite-btn--icon-only {
    width: 40px;
    height: 40px;
    justify-content: center;
    border-radius: 50%;
}

.favorite-btn--icon-only.favorite-btn--small {
    width: 32px;
    height: 32px;
}

.favorite-btn--icon-only.favorite-btn--large {
    width: 48px;
    height: 48px;
}

.favorite-icon {
    width: 20px;
    height: 20px;
    transition: all 0.3s ease;
}

.favorite-btn--small .favorite-icon {
    width: 16px;
    height: 16px;
}

.favorite-btn--large .favorite-icon {
    width: 24px;
    height: 24px;
}

/* Animações */
.favorite-btn.favorite-adding {
    animation: favoriteAdding 0.6s ease;
}

.favorite-btn.favorite-removing {
    animation: favoriteRemoving 0.3s ease;
}

@keyframes favoriteAdding {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
}

@keyframes favoriteRemoving {
    0% { transform: scale(1); }
    50% { transform: scale(0.8); }
    100% { transform: scale(1); }
}

@keyframes floatingHeart {
    0% {
        transform: translate(-50%, -50%) scale(0);
        opacity: 0;
    }
    20% {
        transform: translate(-50%, -50%) scale(1.2);
        opacity: 1;
    }
    80% {
        transform: translate(-50%, -70%) scale(1);
        opacity: 1;
    }
    100% {
        transform: translate(-50%, -90%) scale(0);
        opacity: 0;
    }
}

/* Modal de Login */
.favorites-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.favorites-modal.show {
    opacity: 1;
}

.favorites-modal__overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(5px);
}

.favorites-modal__content {
    position: relative;
    background: white;
    border-radius: 16px;
    padding: 2rem;
    max-width: 400px;
    width: 90%;
    text-align: center;
    transform: scale(0.8);
    transition: transform 0.3s ease;
}

.favorites-modal.show .favorites-modal__content {
    transform: scale(1);
}

.favorites-modal__close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--cor-cinza-escuro);
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.3s ease;
}

.favorites-modal__close:hover {
    background-color: var(--cor-cinza-claro);
}

.favorites-modal__icon {
    margin-bottom: 1rem;
}

.favorites-modal__icon img {
    width: 60px;
    height: 60px;
    opacity: 0.8;
}

.favorites-modal h2 {
    font-family: var(--fonte-titulo);
    color: var(--cor-preta);
    margin-bottom: 1rem;
    font-size: 1.5rem;
}

.favorites-modal p {
    color: var(--cor-cinza-escuro);
    margin-bottom: 2rem;
    line-height: 1.6;
}

.favorites-modal__actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
}

.favorites-modal .btn-primary,
.favorites-modal .btn-secondary {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    border: none;
    cursor: pointer;
}

.favorites-modal .btn-primary {
    background-color: var(--cor-verde-neon);
    color: var(--cor-preta);
}

.favorites-modal .btn-primary:hover {
    background-color: var(--cor-verde-hover);
    transform: translateY(-2px);
}

.favorites-modal .btn-secondary {
    background-color: transparent;
    color: var(--cor-cinza-escuro);
    border: 2px solid var(--cor-cinza-claro);
}

.favorites-modal .btn-secondary:hover {
    border-color: var(--cor-cinza-escuro);
    color: var(--cor-preta);
}

/* Notificações */
.favorites-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 8px;
    padding: 1rem 1.5rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    border-left: 4px solid #3b82f6;
    z-index: 10000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    max-width: 350px;
}

.favorites-notification.show {
    transform: translateX(0);
}

.favorites-notification.success {
    border-left-color: #10b981;
}

.favorites-notification.error {
    border-left-color: #dc2626;
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.notification-icon {
    font-size: 1.2rem;
}

.notification-text {
    color: var(--cor-preta);
    font-weight: 600;
    font-size: 0.9rem;
}

/* Badge de contagem */
.favorites-count,
.favoritos-count {
    background: #dc2626;
    color: white;
    padding: 0.2rem 0.5rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    min-width: 20px;
    text-align: center;
    display: none;
}

/* Responsividade */
@media screen and (max-width: 768px) {
    .favorites-modal__content {
        padding: 1.5rem;
        margin: 1rem;
    }
    
    .favorites-modal__actions {
        flex-direction: column;
    }
    
    .favorites-notification {
        top: 10px;
        right: 10px;
        left: 10px;
        max-width: none;
    }
}
`;

// Adicionar CSS ao documento
const style = document.createElement('style');
style.textContent = favoritesCSS;
document.head.appendChild(style);