class LojaDevApp {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.products = [];
        this.init();
    }

    async init() {
        await this.loadProducts();
        this.setupEventListeners();
        this.updateCartCount();
        this.makeProductsClickable();
    }

    async loadProducts() {
        try {
            const response = await fetch('../data/products.json');
            const data = await response.json();
            this.products = data.products;
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            // Fallback com dados estáticos se o JSON não carregar
            this.products = this.getFallbackProducts();
        }
    }

    getFallbackProducts() {
        return [
            {
                id: 1,
                name: "Abridor de Garrafas Geek",
                price: 29.90,
                category: "acessorios",
                image: "./assets/produtos/abridor.png",
                description: "Abridor de garrafas temático perfeito para desenvolvedores",
                variants: [
                    { type: "color", options: ["Preto", "Prata", "Dourado"] }
                ],
                stock: 25
            },
            {
                id: 2,
                name: "Camiseta Dev Life",
                price: 39.90,
                category: "roupas",
                image: "./assets/produtos/camiseta.png",
                description: "Camiseta confortável para verdadeiros programadores",
                variants: [
                    { type: "size", options: ["P", "M", "G", "GG"] },
                    { type: "color", options: ["Preto", "Branco", "Azul"] }
                ],
                stock: 50
            },
            {
                id: 3,
                name: "Caneca Code Coffee",
                price: 19.90,
                category: "canecas",
                image: "./assets/produtos/caneca.png",
                description: "Caneca perfeita para o café dos programadores",
                variants: [
                    { type: "design", options: ["JavaScript", "Python", "React"] }
                ],
                stock: 30
            },
            {
                id: 4,
                name: "Camisa Desenvolvedor",
                price: 49.90,
                category: "roupas",
                image: "./assets/produtos/camisa.png",
                description: "Camisa social para o dev moderno",
                variants: [
                    { type: "size", options: ["P", "M", "G", "GG"] }
                ],
                stock: 20
            },
            {
                id: 5,
                name: "Quadro Motivacional",
                price: 59.90,
                category: "decoracao",
                image: "./assets/produtos/quadro.png",
                description: "Quadro decorativo para seu setup",
                variants: [
                    { type: "size", options: ["20x30", "30x40", "40x60"] }
                ],
                stock: 15
            },
            {
                id: 6,
                name: "Copo Térmico",
                price: 29.90,
                category: "canecas",
                image: "./assets/produtos/copo.png",
                description: "Copo térmico para manter sua bebida na temperatura ideal",
                variants: [
                    { type: "color", options: ["Preto", "Branco", "Azul"] }
                ],
                stock: 40
            },
            {
                id: 7,
                name: "Boné Programmer",
                price: 39.90,
                category: "acessorios",
                image: "./assets/produtos/boné.png",
                description: "Boné estiloso para desenvolvedores",
                variants: [
                    { type: "color", options: ["Preto", "Branco", "Azul"] }
                ],
                stock: 35
            },
            {
                id: 8,
                name: "Mousepad Gaming",
                price: 29.90,
                category: "acessorios",
                image: "./assets/produtos/mousepad.png",
                description: "Mousepad para melhorar sua produtividade",
                variants: [
                    { type: "size", options: ["Pequeno", "Médio", "Grande"] }
                ],
                stock: 60
            }
        ];
    }

    setupEventListeners() {
        // Busca
        const searchInput = document.getElementById('search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Newsletter
        const newsletterForm = document.querySelector('.newsletter__container');
        if (newsletterForm) {
            const button = newsletterForm.querySelector('.newsletter__container_botao');
            if (button) {
                button.addEventListener('click', (e) => this.handleNewsletter(e));
            }
        }

        // Banner button
        const bannerButton = document.querySelector('.banner__container-botao');
        if (bannerButton) {
            bannerButton.addEventListener('click', () => {
                document.querySelector('.promocoes')?.scrollIntoView({ behavior: 'smooth' });
            });
        }
    }

    makeProductsClickable() {
        const productItems = document.querySelectorAll('.promocoes__list_item');
        productItems.forEach(item => {
            item.addEventListener('click', () => {
                const productId = parseInt(item.dataset.productId);
                this.openProductPage(productId);
            });
        });
    }

    openProductPage(productId) {
        // Salvar ID do produto no sessionStorage para a página de produto
        sessionStorage.setItem('selectedProductId', productId);
        // Redirecionar para página de produto
        window.location.href = './pages/product.html';
    }

    handleSearch(query) {
        if (query.length < 2) return;
        
        const filteredProducts = this.products.filter(product => 
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.category.toLowerCase().includes(query.toLowerCase())
        );
        
        console.log('Produtos encontrados:', filteredProducts);
        // Aqui você pode implementar a exibição dos resultados
    }

    handleNewsletter(e) {
        e.preventDefault();
        const emailInput = document.getElementById('email');
        const email = emailInput.value.trim();
        
        if (this.validateEmail(email)) {
            // Simular envio (aqui você integraria com backend)
            alert('Email cadastrado com sucesso! Você receberá nossas novidades.');
            emailInput.value = '';
        } else {
            alert('Por favor, insira um email válido.');
        }
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    addToCart(product, quantity = 1, selectedVariants = {}) {
        const cartItem = {
            id: Date.now(), // ID único para o item no carrinho
            productId: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: quantity,
            variants: selectedVariants
        };

        this.cart.push(cartItem);
        this.saveCart();
        this.updateCartCount();
        
        // Mostrar notificação
        this.showNotification('Produto adicionado ao carrinho!');
    }

    removeFromCart(cartItemId) {
        this.cart = this.cart.filter(item => item.id !== cartItemId);
        this.saveCart();
        this.updateCartCount();
    }

    updateCartCount() {
        const cartBadge = document.getElementById('cart-count');
        if (cartBadge) {
            const count = this.cart.reduce((total, item) => total + item.quantity, 0);
            cartBadge.textContent = count;
            cartBadge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    getCart() {
        return this.cart;
    }

    getProduct(id) {
        return this.products.find(product => product.id === id);
    }

    showNotification(message) {
        // Criar notificação simples
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--cor-verde-neon);
            color: var(--cor-preta);
            padding: 15px 20px;
            border-radius: 5px;
            font-weight: 600;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remover após 3 segundos
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Inicializar app quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.lojaApp = new LojaDevApp();
});

// Adicionar CSS para animação da notificação
const mainGlobalStyles = document.createElement('style');
mainGlobalStyles.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(mainGlobalStyles);

// Adicionar no final do arquivo main.js:
function updateAuthState() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const loginLink = document.querySelector('.cabecalho__nav_list_link-login');
    
    if (currentUser && loginLink) {
        loginLink.textContent = `Olá, ${currentUser.nome}`;
        loginLink.href = './pages/perfil.html';
        
        // Add logout option
        loginLink.addEventListener('click', (e) => {
            if (e.ctrlKey || e.metaKey) {
                // Ctrl+click to logout
                e.preventDefault();
                if (confirm('Deseja sair da sua conta?')) {
                    AuthUtils.logout();
                }
            }
        });
    }
}

// Update auth state when page loads
document.addEventListener('DOMContentLoaded', () => {
    updateAuthState();
});

// Adicionar no final do arquivo main.js:
function addFavoriteButtonsToProducts() {
    // Adicionar botões de favorito aos produtos existentes
    document.querySelectorAll('.produto, .product-card').forEach(productCard => {
        // Verificar se já tem botão de favorito
        if (productCard.querySelector('.favorite-btn')) return;
        
        const productId = parseInt(productCard.dataset.productId || productCard.dataset.id || Math.random() * 1000);
        productCard.dataset.productId = productId;
        
        const favoriteBtn = window.favoritesSystem.createFavoriteButton(productId, {
            size: 'small',
            style: 'icon-only',
            className: 'product-favorite-btn'
        });
        
        // Posicionar o botão
        favoriteBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(5px);
            z-index: 10;
        `;
        
        // Certificar que o card tem posição relativa
        if (getComputedStyle(productCard).position === 'static') {
            productCard.style.position = 'relative';
        }
        
        productCard.appendChild(favoriteBtn);
    });
}

// Chamar função quando DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    addFavoriteButtonsToProducts();
    
    // Observer para produtos adicionados dinamicamente
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                    if (node.classList.contains('produto') || node.classList.contains('product-card')) {
                        // Novo produto adicionado
                        addFavoriteButtonsToProducts();
                    } else {
                        // Verificar filhos
                        const products = node.querySelectorAll('.produto, .product-card');
                        if (products.length > 0) {
                            addFavoriteButtonsToProducts();
                        }
                    }
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    updateAuthState();
});