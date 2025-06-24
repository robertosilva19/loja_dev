/* filepath: c:\Users\janic\OneDrive\Área de Trabalho\Projetos\loja_dev\js\rating-system.js */
// Sistema de Rating e Estrelas

class RatingSystem {
    constructor() {
        this.ratings = JSON.parse(localStorage.getItem('product-ratings')) || {};
        this.init();
    }

    init() {
        this.createStarComponents();
        this.setupEventListeners();
    }

    // Criar componentes de estrelas em elementos com rating
    createStarComponents() {
        document.querySelectorAll('[data-rating]').forEach(element => {
            this.renderStars(element);
        });
    }

    // Renderizar estrelas
    renderStars(element, rating = null, interactive = false) {
        const ratingValue = rating !== null ? rating : parseFloat(element.dataset.rating) || 0;
        const maxStars = parseInt(element.dataset.maxRating) || 5;
        const size = element.dataset.starSize || 'normal';
        const showText = element.dataset.showText !== 'false';
        
        const starsContainer = document.createElement('div');
        starsContainer.className = `rating-stars ${interactive ? 'interactive' : ''}`;
        
        // Criar estrelas
        for (let i = 1; i <= maxStars; i++) {
            const star = this.createStar(i, ratingValue, size, interactive);
            starsContainer.appendChild(star);
        }
        
        // Adicionar texto do rating se solicitado
        if (showText && !interactive) {
            const ratingText = this.createRatingText(ratingValue, element.dataset.reviewCount);
            starsContainer.appendChild(ratingText);
        }
        
        // Limpar elemento e adicionar estrelas
        element.innerHTML = '';
        element.appendChild(starsContainer);
        
        // Se for interativo, configurar eventos
        if (interactive) {
            this.setupInteractiveStars(starsContainer, element);
        }
    }

    // Criar uma estrela individual
    createStar(index, rating, size, interactive) {
        const star = document.createElement('span');
        star.className = `rating-star ${size === 'large' ? 'large' : size === 'small' ? 'small' : ''}`;
        star.dataset.rating = index;
        
        const filled = rating >= index;
        const half = rating >= (index - 0.5) && rating < index;
        
        if (filled) {
            star.classList.add('filled');
        } else if (half) {
            star.classList.add('half');
        }
        
        star.innerHTML = this.getStarSVG();
        
        return star;
    }

    // SVG da estrela
    getStarSVG() {
        return `
            <svg viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
        `;
    }

    // Criar texto do rating
    createRatingText(rating, reviewCount) {
        const textContainer = document.createElement('div');
        textContainer.className = 'rating-display';
        
        textContainer.innerHTML = `
            <span class="rating-value">${rating.toFixed(1)}</span>
            ${reviewCount ? `<span class="rating-count">(${reviewCount} ${reviewCount === 1 ? 'avaliação' : 'avaliações'})</span>` : ''}
        `;
        
        return textContainer;
    }

    // Configurar estrelas interativas
    setupInteractiveStars(container, element) {
        const stars = container.querySelectorAll('.rating-star');
        
        stars.forEach((star, index) => {
            // Hover effect
            star.addEventListener('mouseenter', () => {
                this.highlightStars(stars, index + 1);
            });
            
            // Click to select rating
            star.addEventListener('click', () => {
                const rating = index + 1;
                this.selectRating(container, rating, element);
            });
        });
        
        // Reset hover on mouse leave
        container.addEventListener('mouseleave', () => {
            const selectedRating = container.dataset.selectedRating || 0;
            this.highlightStars(stars, selectedRating);
        });
    }

    // Destacar estrelas no hover
    highlightStars(stars, rating) {
        stars.forEach((star, index) => {
            const starElement = star;
            if (index < rating) {
                starElement.classList.add('hover');
            } else {
                starElement.classList.remove('hover');
            }
        });
    }

    // Selecionar rating
    selectRating(container, rating, element) {
        container.dataset.selectedRating = rating;
        const stars = container.querySelectorAll('.rating-star');
        
        // Atualizar visual das estrelas
        stars.forEach((star, index) => {
            star.classList.remove('filled', 'hover');
            if (index < rating) {
                star.classList.add('filled');
                star.classList.add('animate');
                
                // Remover animação após completar
                setTimeout(() => {
                    star.classList.remove('animate');
                }, 300);
            }
        });
        
        // Disparar evento customizado
        const event = new CustomEvent('ratingSelected', {
            detail: { rating, element }
        });
        element.dispatchEvent(event);
        
        // Atualizar label se existir
        const label = element.querySelector('.rating-input-label');
        if (label) {
            label.textContent = this.getRatingLabel(rating);
        }
    }

    // Obter label descritivo do rating
    getRatingLabel(rating) {
        const labels = {
            1: 'Muito ruim',
            2: 'Ruim',
            3: 'Regular',
            4: 'Bom',
            5: 'Excelente'
        };
        return labels[rating] || '';
    }

    // Configurar event listeners globais
    setupEventListeners() {
        // Auto-inicializar novos elementos com rating
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        const ratingElements = node.querySelectorAll('[data-rating]');
                        ratingElements.forEach(element => {
                            if (!element.querySelector('.rating-stars')) {
                                this.renderStars(element);
                            }
                        });
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // API pública para criar rating interativo
    createInteractiveRating(element, options = {}) {
        const {
            maxRating = 5,
            size = 'normal',
            initialRating = 0,
            onRatingSelect = null
        } = options;
        
        element.dataset.rating = initialRating;
        element.dataset.maxRating = maxRating;
        element.dataset.starSize = size;
        
        this.renderStars(element, initialRating, true);
        
        if (onRatingSelect) {
            element.addEventListener('ratingSelected', (e) => {
                onRatingSelect(e.detail.rating);
            });
        }
    }

    // Salvar rating de produto
    saveProductRating(productId, rating) {
        this.ratings[productId] = rating;
        localStorage.setItem('product-ratings', JSON.stringify(this.ratings));
    }

    // Obter rating de produto
    getProductRating(productId) {
        return this.ratings[productId] || 0;
    }

    // Atualizar rating exibido
    updateDisplayRating(element, newRating, reviewCount) {
        element.dataset.rating = newRating;
        element.dataset.reviewCount = reviewCount;
        this.renderStars(element);
    }

    // Calcular rating médio
    calculateAverageRating(reviews) {
        if (!reviews || reviews.length === 0) return 0;
        
        const total = reviews.reduce((sum, review) => sum + review.rating, 0);
        return total / reviews.length;
    }

    // Obter distribuição de ratings
    getRatingDistribution(reviews) {
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        
        reviews.forEach(review => {
            if (distribution[review.rating] !== undefined) {
                distribution[review.rating]++;
            }
        });
        
        return distribution;
    }
}

// Inicializar sistema de rating
document.addEventListener('DOMContentLoaded', () => {
    window.RatingSystem = new RatingSystem();
});

// API global
window.Rating = {
    create: (element, options) => window.RatingSystem?.createInteractiveRating(element, options),
    update: (element, rating, reviewCount) => window.RatingSystem?.updateDisplayRating(element, rating, reviewCount),
    calculate: (reviews) => window.RatingSystem?.calculateAverageRating(reviews),
    distribution: (reviews) => window.RatingSystem?.getRatingDistribution(reviews)
};