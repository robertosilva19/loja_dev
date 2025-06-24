/* filepath: c:\Users\janic\OneDrive\Área de Trabalho\Projetos\loja_dev\js\reviews.js */
/* Sistema de Reviews - Funcionalidade Básica */

class ReviewsSystem {
    constructor() {
        this.reviews = [];
        this.currentProductId = null;
        this.currentUser = null;
        this.filters = {
            rating: 'all',
            sort: 'newest'
        };
        
        this.init();
    }

    init() {
        // Carregar reviews do localStorage
        this.loadReviews();
        
        // Verificar usuário logado
        this.checkCurrentUser();
        
        // Configurar event listeners se o container existir
        if (document.querySelector('.reviews-section')) {
            this.setupEventListeners();
        }
    }

    // Carregar reviews do localStorage
    loadReviews() {
        const stored = localStorage.getItem('usedev-reviews');
        this.reviews = stored ? JSON.parse(stored) : this.generateSampleReviews();
    }

    // Gerar reviews de exemplo
    generateSampleReviews() {
        return [
            {
                id: 'rev_001',
                productId: 'prod_001',
                userId: 'user_001',
                userName: 'João Silva',
                userAvatar: 'J',
                rating: 5,
                title: 'Produto excelente!',
                content: 'Superou minhas expectativas. Qualidade incrível e entrega rápida. Recomendo muito!',
                date: new Date('2024-01-15').toISOString(),
                helpful: 12,
                notHelpful: 1,
                verified: true,
                images: []
            },
            {
                id: 'rev_002',
                productId: 'prod_001',
                userId: 'user_002',
                userName: 'Maria Santos',
                userAvatar: 'M',
                rating: 4,
                title: 'Muito bom',
                content: 'Produto de qualidade, chegou conforme anunciado. Apenas o prazo de entrega poderia ser melhor.',
                date: new Date('2024-01-10').toISOString(),
                helpful: 8,
                notHelpful: 0,
                verified: true,
                images: []
            },
            {
                id: 'rev_003',
                productId: 'prod_001',
                userId: 'user_003',
                userName: 'Pedro Costa',
                userAvatar: 'P',
                rating: 3,
                title: 'Razoável',
                content: 'O produto é ok, mas esperava um pouco mais pela qualidade. Atende, mas não impressiona.',
                date: new Date('2024-01-05').toISOString(),
                helpful: 3,
                notHelpful: 2,
                verified: false,
                images: []
            }
        ];
    }

    // Verificar usuário atual
    checkCurrentUser() {
        // Integração com sistema de auth se existir
        if (window.AuthAPI && window.AuthAPI.isLoggedIn()) {
            this.currentUser = window.AuthAPI.getCurrentUser();
        } else {
            // Simular usuário para demonstração
            this.currentUser = {
                id: 'user_demo',
                nome: 'Usuário Demo',
                email: 'demo@usedev.com'
            };
        }
    }

    // Configurar event listeners
    setupEventListeners() {
        // Botão adicionar review
        const addBtn = document.querySelector('.add-review-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.openReviewForm();
            });
        }

        // Filtros
        const ratingFilter = document.getElementById('rating-filter');
        if (ratingFilter) {
            ratingFilter.addEventListener('change', (e) => {
                this.filters.rating = e.target.value;
                this.renderReviews();
            });
        }

        const sortFilter = document.getElementById('sort-filter');
        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                this.filters.sort = e.target.value;
                this.renderReviews();
            });
        }
    }

    // Renderizar seção completa de reviews
    renderReviewsSection(productId, containerId = 'reviews-container') {
        this.currentProductId = productId;
        const container = document.getElementById(containerId);
        
        if (!container) return;

        const productReviews = this.getProductReviews(productId);
        const averageRating = this.calculateAverageRating(productReviews);
        const totalReviews = productReviews.length;

        container.innerHTML = `
            <div class="reviews-section">
                <div class="reviews-header">
                    <div>
                        <h3 class="reviews-title">Avaliações dos Clientes</h3>
                        <div class="reviews-summary">
                            <div class="reviews-rating">
                                <span class="rating-average">${averageRating.toFixed(1)}</span>
                                <div class="rating-stars">
                                    ${this.generateStarsHTML(averageRating)}
                                </div>
                                <span class="reviews-count">(${totalReviews} ${totalReviews === 1 ? 'avaliação' : 'avaliações'})</span>
                            </div>
                        </div>
                    </div>
                    <button class="add-review-btn" onclick="reviewsSystem.openReviewForm()">
                        <span>✍️</span>
                        Avaliar Produto
                    </button>
                </div>

                ${totalReviews > 0 ? `
                    <div class="reviews-filters">
                        <div class="filter-group">
                            <label for="rating-filter">Filtrar por:</label>
                            <select id="rating-filter" class="filter-select">
                                <option value="all">Todas as avaliações</option>
                                <option value="5">5 estrelas</option>
                                <option value="4">4 estrelas</option>
                                <option value="3">3 estrelas</option>
                                <option value="2">2 estrelas</option>
                                <option value="1">1 estrela</option>
                            </select>
                        </div>
                        <div class="filter-group reviews-sort">
                            <label for="sort-filter">Ordenar por:</label>
                            <select id="sort-filter" class="filter-select">
                                <option value="newest">Mais recentes</option>
                                <option value="oldest">Mais antigas</option>
                                <option value="highest">Maior nota</option>
                                <option value="lowest">Menor nota</option>
                                <option value="helpful">Mais úteis</option>
                            </select>
                        </div>
                    </div>

                    <div class="reviews-list" id="reviews-list">
                        ${this.generateReviewsHTML(productReviews)}
                    </div>
                ` : `
                    <div class="reviews-empty">
                        <img src="./assets/icons/review.svg" alt="Nenhuma avaliação">
                        <h3>Nenhuma avaliação ainda</h3>
                        <p>Seja o primeiro a avaliar este produto!</p>
                    </div>
                `}
            </div>
        `;

        // Reconfigurar event listeners
        this.setupEventListeners();
        this.setupReviewActions();
    }

    // Obter reviews de um produto específico
    getProductReviews(productId) {
        return this.reviews.filter(review => review.productId === productId);
    }

    // Calcular média de avaliações
    calculateAverageRating(reviews) {
        if (reviews.length === 0) return 0;
        
        const total = reviews.reduce((sum, review) => sum + review.rating, 0);
        return total / reviews.length;
    }

    // Gerar HTML das estrelas
    generateStarsHTML(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let starsHTML = '';
        
        // Estrelas cheias
        for (let i = 0; i < fullStars; i++) {
            starsHTML += '<span class="star filled"></span>';
        }
        
        // Meia estrela
        if (hasHalfStar) {
            starsHTML += '<span class="star half"></span>';
        }
        
        // Estrelas vazias
        for (let i = 0; i < emptyStars; i++) {
            starsHTML += '<span class="star"></span>';
        }
        
        return starsHTML;
    }

    // Gerar HTML dos reviews
    generateReviewsHTML(reviews) {
        const filteredReviews = this.filterAndSortReviews(reviews);
        
        return filteredReviews.map(review => `
            <div class="review-item" data-review-id="${review.id}">
                <div class="review-header">
                    <div class="review-user">
                        <div class="review-avatar">${review.userAvatar}</div>
                        <div class="review-user-info">
                            <h4>${review.userName} ${review.verified ? '<span class="verified-purchase"><img src="./assets/icons/verified.svg" alt="Verificado">Compra verificada</span>' : ''}</h4>
                            <div class="review-date">${this.formatDate(review.date)}</div>
                        </div>
                    </div>
                    <div class="review-rating">
                        <div class="rating-stars">
                            ${this.generateStarsHTML(review.rating)}
                        </div>
                    </div>
                </div>

                <div class="review-content">
                    <h5 class="review-title">${review.title}</h5>
                    <p class="review-text">${review.content}</p>
                    
                    ${review.images && review.images.length > 0 ? `
                        <div class="review-images">
                            ${review.images.map(img => `
                                <img src="${img}" alt="Foto do cliente" class="review-image" onclick="reviewsSystem.openImageModal('${img}')">
                            `).join('')}
                        </div>
                    ` : ''}
                </div>

                <div class="review-actions">
                    <div class="review-helpful">
                        <span>Esta avaliação foi útil?</span>
                        <button class="helpful-btn" onclick="reviewsSystem.markHelpful('${review.id}', true)">
                            <img src="./assets/icons/thumbs-up.svg" alt="Útil">
                            Sim (${review.helpful})
                        </button>
                        <button class="helpful-btn" onclick="reviewsSystem.markHelpful('${review.id}', false)">
                            <img src="./assets/icons/thumbs-down.svg" alt="Não útil">
                            Não (${review.notHelpful})
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Filtrar e ordenar reviews
    filterAndSortReviews(reviews) {
        let filtered = [...reviews];

        // Aplicar filtro de rating
        if (this.filters.rating !== 'all') {
            const targetRating = parseInt(this.filters.rating);
            filtered = filtered.filter(review => review.rating === targetRating);
        }

        // Aplicar ordenação
        switch (this.filters.sort) {
            case 'newest':
                filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'oldest':
                filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'highest':
                filtered.sort((a, b) => b.rating - a.rating);
                break;
            case 'lowest':
                filtered.sort((a, b) => a.rating - b.rating);
                break;
            case 'helpful':
                filtered.sort((a, b) => b.helpful - a.helpful);
                break;
        }

        return filtered;
    }

    // Configurar ações dos reviews (útil/não útil)
    setupReviewActions() {
        // Event listeners para botões de helpful já são configurados via onclick
        // mas podemos adicionar outros listeners aqui se necessário
    }

    // Marcar review como útil ou não
    markHelpful(reviewId, isHelpful) {
        const review = this.reviews.find(r => r.id === reviewId);
        if (!review) return;

        // Verificar se usuário já votou (simples implementação)
        const voteKey = `vote_${reviewId}_${this.currentUser?.id}`;
        const existingVote = localStorage.getItem(voteKey);

        if (existingVote) {
            this.showMessage('Você já avaliou esta review!', 'warning');
            return;
        }

        // Registrar voto
        if (isHelpful) {
            review.helpful++;
        } else {
            review.notHelpful++;
        }

        // Salvar voto do usuário
        localStorage.setItem(voteKey, isHelpful ? 'helpful' : 'not-helpful');

        // Salvar reviews atualizadas
        this.saveReviews();

        // Re-renderizar
        this.renderReviews();

        this.showMessage('Obrigado pelo seu feedback!', 'success');
    }

    // Re-renderizar apenas a lista de reviews
    renderReviews() {
        if (!this.currentProductId) return;

        const reviewsList = document.getElementById('reviews-list');
        if (!reviewsList) return;

        const productReviews = this.getProductReviews(this.currentProductId);
        reviewsList.innerHTML = this.generateReviewsHTML(productReviews);
        this.setupReviewActions();
    }

    // Salvar reviews no localStorage
    saveReviews() {
        localStorage.setItem('usedev-reviews', JSON.stringify(this.reviews));
    }

    // Abrir formulário de review (versão melhorada)
    openReviewForm() {
        if (!this.currentUser) {
            this.showMessage('Você precisa estar logado para avaliar um produto.', 'warning');
            return;
        }

        // Verificar se usuário já avaliou este produto
        const existingReview = this.reviews.find(review => 
            review.productId === this.currentProductId && 
            review.userId === this.currentUser.id
        );

        if (existingReview) {
            this.showMessage('Você já avaliou este produto!', 'warning');
            return;
        }

        // Dados do produto (podem vir de uma API ou base de dados)
        const productData = {
            name: 'Produto Exemplo', // Buscar nome real do produto
            price: 'R$ 49,90',        // Buscar preço real do produto
            image: './assets/produtos/camiseta.png' // Buscar imagem real
        };

        // Abrir formulário avançado
        if (window.ReviewForm) {
            window.ReviewForm.open(this.currentProductId, productData);
        } else {
            // Fallback para método simples se formulário não estiver carregado
            this.openSimpleReviewForm();
        }
    }

    // Método simples como fallback
    openSimpleReviewForm() {
        const rating = prompt('Qual sua nota para este produto? (1 a 5)');
        if (!rating || rating < 1 || rating > 5) return;

        const title = prompt('Título da sua avaliação:');
        if (!title) return;

        const content = prompt('Escreva sua avaliação:');
        if (!content) return;

        const newReview = {
            id: 'rev_' + Date.now(),
            productId: this.currentProductId,
            userId: this.currentUser.id,
            userName: this.currentUser.nome,
            userAvatar: this.currentUser.nome.charAt(0).toUpperCase(),
            rating: parseInt(rating),
            title: title,
            content: content,
            date: new Date().toISOString(),
            helpful: 0,
            notHelpful: 0,
            verified: true,
            images: []
        };

        this.reviews.push(newReview);
        this.saveReviews();
        this.renderReviewsSection(this.currentProductId);
        
        this.showMessage('Sua avaliação foi publicada!', 'success');
    }

    // Formatar data
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Mostrar mensagem (usar sistema existente se disponível)
    showMessage(message, type = 'info') {
        if (window.MainAPI && window.MainAPI.showNotification) {
            window.MainAPI.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    // Abrir modal de imagem (implementação futura)
    openImageModal(imageSrc) {
        // Implementar modal de imagem na próxima parte
        console.log('Abrir imagem:', imageSrc);
    }

    // API pública
    getAverageRating(productId) {
        const reviews = this.getProductReviews(productId);
        return this.calculateAverageRating(reviews);
    }

    getTotalReviews(productId) {
        return this.getProductReviews(productId).length;
    }

    addReview(reviewData) {
        this.reviews.push(reviewData);
        this.saveReviews();
    }
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.reviewsSystem = new ReviewsSystem();
});

// API global
window.Reviews = {
    render: (productId, containerId) => window.reviewsSystem?.renderReviewsSection(productId, containerId),
    getAverage: (productId) => window.reviewsSystem?.getAverageRating(productId) || 0,
    getTotal: (productId) => window.reviewsSystem?.getTotalReviews(productId) || 0
};