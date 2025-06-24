class ProductPage {
    constructor() {
        this.currentProduct = null;
        this.selectedVariants = {};
        this.quantity = 1;
        this.maxQuantity = 1;
        this.init();
    }

    async init() {
        await this.loadProduct();
        this.setupEventListeners();
        this.updateCartCount();
    }

    // --- NOVO MÉTODO AUXILIAR ---
    // Ajusta o caminho da imagem para funcionar em subpastas no GitHub Pages
    adjustImagePath(path) {
        // Verifica se o caminho já foi ajustado ou é inválido
        if (!path || typeof path !== 'string') {
            return ''; // Retorna um caminho vazio ou um placeholder
        }
        
        // Se a página atual não for a index.html, ajusta o caminho relativo
        // A condição verifica se o caminho da URL contém "/pages/"
        if (window.location.pathname.includes('/pages/')) {
             // Transforma "./assets/..." em "../assets/..."
            if (path.startsWith('./')) {
                return `..${path.substring(1)}`;
            }
        }
        return path;
    }

    async loadProduct() {
        try {
            const productId = parseInt(sessionStorage.getItem('selectedProductId'));
            
            if (!productId) {
                this.redirectToHome();
                return;
            }

            // O caminho para o JSON também precisa ser ajustado
            const jsonPath = this.adjustImagePath('./data/products.json');
            const response = await fetch(jsonPath);
            const data = await response.json();
            
            this.currentProduct = data.products.find(p => p.id === productId);
            
            if (!this.currentProduct) {
                this.redirectToHome();
                return;
            }

            this.renderProduct();
            this.loadRelatedProducts(data.products);
            
        } catch (error) {
            console.error('Erro ao carregar produto:', error);
            this.redirectToHome();
        }
    }

    redirectToHome() {
        alert('Produto não encontrado. Redirecionando para a página inicial.');
        window.location.href = '../index.html';
    }

    renderProduct() {
        const product = this.currentProduct;
        
        document.getElementById('produto-nome').textContent = product.name;
        document.getElementById('produto-preco').textContent = `R$ ${product.price.toFixed(2).replace('.', ',')}`;
        document.getElementById('produto-parcela').textContent = `R$ ${(product.price / 3).toFixed(2).replace('.', ',')}`;
        document.getElementById('produto-descricao').textContent = product.description;
        
        const imgElement = document.getElementById('produto-imagem');
        imgElement.src = this.adjustImagePath(product.image);
        imgElement.alt = product.name;
        
        document.getElementById('breadcrumb-category').textContent = this.getCategoryName(product.category);
        document.getElementById('breadcrumb-product').textContent = product.name;
        
        this.renderVariants();
        this.renderDetails();
        
        this.maxQuantity = product.stock;
        document.getElementById('stock-info').textContent = `${product.stock} disponíveis`;
        document.title = `${product.name} - UseDev`;
    }

    getCategoryName(category) {
        const categories = {
            'roupas': 'Roupas',
            'canecas': 'Canecas',
            'acessorios': 'Acessórios',
            'decoracao': 'Decoração'
        };
        return categories[category] || 'Produtos';
    }

    renderVariants() {
        const variantsContainer = document.getElementById('produto-variantes');
        variantsContainer.innerHTML = '';
        
        if (!this.currentProduct.variants) return;
        
        this.currentProduct.variants.forEach(variant => {
            const variantGroup = document.createElement('div');
            variantGroup.className = 'variant-group';
            
            const label = document.createElement('div');
            label.className = 'variant-label';
            label.textContent = variant.label || variant.type;
            
            const options = document.createElement('div');
            options.className = 'variant-options';
            
            variant.options.forEach(option => {
                const optionElement = document.createElement('button');
                optionElement.className = 'variant-option';
                optionElement.textContent = option;
                optionElement.dataset.type = variant.type;
                optionElement.dataset.value = option;
                
                optionElement.addEventListener('click', () => {
                    this.selectVariant(variant.type, option, optionElement);
                });
                
                options.appendChild(optionElement);
            });
            
            variantGroup.appendChild(label);
            variantGroup.appendChild(options);
            variantsContainer.appendChild(variantGroup);
        });
    }

    selectVariant(type, value, element) {
        const siblings = element.parentElement.querySelectorAll('.variant-option');
        siblings.forEach(sibling => sibling.classList.remove('selected'));
        element.classList.add('selected');
        this.selectedVariants[type] = value;
    }

    renderDetails() {
        const detailsContainer = document.getElementById('details-content');
        detailsContainer.innerHTML = '';
        
        if (!this.currentProduct.details) return;
        
        Object.entries(this.currentProduct.details).forEach(([key, value]) => {
            const detailItem = document.createElement('div');
            detailItem.className = 'detail-item';
            
            detailItem.innerHTML = `
                <span class="detail-label">${this.getDetailLabel(key)}:</span>
                <span class="detail-value">${value}</span>
            `;
            
            detailsContainer.appendChild(detailItem);
        });
    }

    getDetailLabel(key) {
        const labels = {
            'material': 'Material',
            'dimensions': 'Dimensões',
            'weight': 'Peso',
            'finish': 'Acabamento',
            'care': 'Cuidados',
            'fit': 'Caimento',
            'capacity': 'Capacidade',
            'dishwasher': 'Lava-louças',
            'microwave': 'Micro-ondas',
            'collar': 'Colarinho',
            'hanging': 'Fixação',
            'frame': 'Moldura',
            'thermal': 'Térmico',
            'lid': 'Tampa',
            'style': 'Estilo',
            'embroidery': 'Bordado',
            'base': 'Base',
            'thickness': 'Espessura',
            'surface': 'Superfície'
        };
        return labels[key] || key;
    }

    loadRelatedProducts(allProducts) {
        const related = allProducts
            .filter(p => p.id !== this.currentProduct.id && p.category === this.currentProduct.category)
            .slice(0, 4);
        
        const container = document.getElementById('produtos-relacionados');
        container.innerHTML = '';
        
        related.forEach(product => {
            const productElement = document.createElement('div');
            productElement.className = 'produto-relacionado';
            productElement.dataset.productId = product.id;
            
            productElement.innerHTML = `
                <img src="${this.adjustImagePath(product.image)}" alt="${product.name}">
                <h4>${product.name}</h4>
                <p>R$ ${product.price.toFixed(2).replace('.', ',')}</p>
            `;
            
            productElement.addEventListener('click', () => {
                sessionStorage.setItem('selectedProductId', product.id);
                window.location.reload();
            });
            
            container.appendChild(productElement);
        });
    }

    setupEventListeners() {
        document.getElementById('decrease-qty').addEventListener('click', () => {
            if (this.quantity > 1) {
                this.quantity--;
                this.updateQuantityInput();
            }
        });

        document.getElementById('increase-qty').addEventListener('click', () => {
            if (this.quantity < this.maxQuantity) {
                this.quantity++;
                this.updateQuantityInput();
            }
        });

        document.getElementById('quantidade').addEventListener('change', (e) => {
            const value = parseInt(e.target.value);
            if (value >= 1 && value <= this.maxQuantity) {
                this.quantity = value;
            } else {
                e.target.value = this.quantity; // Reseta para o valor válido anterior
            }
        });

        document.getElementById('adicionar-carrinho').addEventListener('click', () => this.addToCart());
        document.getElementById('comprar-agora').addEventListener('click', () => this.buyNow());
        document.getElementById('modal-close').addEventListener('click', () => this.closeModal());
        document.querySelector('.modal__overlay').addEventListener('click', () => this.closeModal());
        document.getElementById('form-compra').addEventListener('submit', (e) => this.handlePurchase(e));
        document.getElementById('buscar-cep').addEventListener('click', () => this.buscarCEP());
    }

    updateQuantityInput() {
        document.getElementById('quantidade').value = this.quantity;
    }

    validateVariants() {
        if (!this.currentProduct.variants) return true;
        
        for (const variant of this.currentProduct.variants) {
            if (!this.selectedVariants[variant.type]) {
                alert(`Por favor, selecione: ${variant.label || variant.type}`);
                return false;
            }
        }
        return true;
    }

    addToCart() {
        if (!this.validateVariants()) return;
        
        const cartItem = {
            id: Date.now(),
            productId: this.currentProduct.id,
            name: this.currentProduct.name,
            price: this.currentProduct.price,
            image: this.currentProduct.image,
            quantity: this.quantity,
            variants: { ...this.selectedVariants }
        };

        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        cart.push(cartItem);
        localStorage.setItem('cart', JSON.stringify(cart));
        
        this.updateCartCount();
        this.showNotification('Produto adicionado ao carrinho!');
    }

    buyNow() {
        if (!this.validateVariants()) return;
        this.openModal();
    }

    openModal() {
        const modal = document.getElementById('modal-compra');
        this.fillModalProductInfo();
        this.updateOrderSummary();
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        const modal = document.getElementById('modal-compra');
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    fillModalProductInfo() {
        const container = document.getElementById('modal-produto-info');
        const variantsText = Object.entries(this.selectedVariants)
            .map(([type, value]) => `${type}: ${value}`)
            .join(', ');
        
        container.innerHTML = `
            <img src="${this.adjustImagePath(this.currentProduct.image)}" alt="${this.currentProduct.name}" class="modal__produto-imagem">
            <div class="modal__produto-info">
                <div class="modal__produto-nome">${this.currentProduct.name}</div>
                <div class="modal__produto-preco">R$ ${this.currentProduct.price.toFixed(2).replace('.', ',')}</div>
                ${variantsText ? `<div class="modal__produto-variantes">${variantsText}</div>` : ''}
                <div class="modal__produto-quantidade">Quantidade: ${this.quantity}</div>
            </div>
        `;
    }

    updateOrderSummary() {
        const subtotal = this.currentProduct.price * this.quantity;
        const frete = 0;
        const total = subtotal + frete;
        
        document.getElementById('subtotal').textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
        document.getElementById('frete').textContent = frete === 0 ? 'Grátis' : `R$ ${frete.toFixed(2).replace('.', ',')}`;
        document.getElementById('total').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    }

    async buscarCEP() {
        const cepInput = document.querySelector('input[name="cep"]');
        const cep = cepInput.value.replace(/\D/g, '');
        
        if (cep.length !== 8) {
            alert('CEP deve ter 8 dígitos');
            return;
        }

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            
            if (data.erro) {
                alert('CEP não encontrado');
                return;
            }
            
            document.querySelector('input[name="endereco"]').value = data.logradouro;
            document.querySelector('input[name="bairro"]').value = data.bairro;
            document.querySelector('input[name="cidade"]').value = data.localidade;
            
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
            alert('Erro ao buscar CEP. Tente novamente.');
        }
    }

    handlePurchase(e) {
        e.preventDefault();
        
        const button = document.querySelector('.modal__botao-finalizar');
        button.classList.add('loading');
        button.disabled = true;
        
        setTimeout(() => {
            button.classList.remove('loading');
            button.disabled = false;
            
            alert('Pedido realizado com sucesso! Você receberá um email de confirmação.');
            this.closeModal();
            
            document.getElementById('form-compra').reset();
            
        }, 2000);
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

    showNotification(message) {
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
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Inicializar página de produto
document.addEventListener('DOMContentLoaded', () => {
    new ProductPage();
});
