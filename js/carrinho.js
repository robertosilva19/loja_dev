class CarrinhoPage {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.products = [];
        this.appliedCoupon = null;
        this.discountAmount = 0;
        this.coupons = {
            'WELCOME10': { discount: 0.10, description: '10% de desconto' },
            'DEV20': { discount: 0.20, description: '20% de desconto' },
            'FIRST5': { discount: 0.05, description: '5% de desconto' },
            'GEEK15': { discount: 0.15, description: '15% de desconto' }
        };
        this.init();
    }

    async init() {
        await this.loadProducts();
        this.renderCart();
        this.setupEventListeners();
        this.updateCartCount();
        this.loadRecommendedProducts();
    }

    async loadProducts() {
        try {
            const response = await fetch('../data/products.json');
            const data = await response.json();
            this.products = data.products;
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
        }
    }

    renderCart() {
        const carrinhoVazio = document.getElementById('carrinho-vazio');
        const carrinhoProdutos = document.getElementById('carrinho-produtos');

        if (this.cart.length === 0) {
            carrinhoVazio.style.display = 'block';
            carrinhoProdutos.style.display = 'none';
        } else {
            carrinhoVazio.style.display = 'none';
            carrinhoProdutos.style.display = 'block';
            this.renderCartItems();
            this.updateSummary();
        }
    }

    renderCartItems() {
        const container = document.getElementById('lista-produtos');
        container.innerHTML = '';

        this.cart.forEach((item, index) => {
            const cartItem = document.createElement('div');
            cartItem.className = 'carrinho-item';
            cartItem.dataset.index = index;

            const variantsText = Object.entries(item.variants || {})
                .map(([type, value]) => `${type}: ${value}`)
                .join(', ');

            cartItem.innerHTML = `
                <div class="item-produto">
                    <img src="${item.image}" alt="${item.name}" class="item-imagem">
                    <div class="item-info">
                        <h4>${item.name}</h4>
                        ${variantsText ? `<div class="item-variantes">${variantsText}</div>` : ''}
                    </div>
                </div>
                
                <div class="item-preco">
                    R$ ${item.price.toFixed(2).replace('.', ',')}
                </div>
                
                <div class="quantidade-controles">
                    <button class="qty-btn decrease-btn" data-index="${index}">-</button>
                    <input type="number" class="qty-input" value="${item.quantity}" 
                           min="1" max="99" data-index="${index}">
                    <button class="qty-btn increase-btn" data-index="${index}">+</button>
                </div>
                
                <div class="item-total">
                    R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}
                </div>
                
                <button class="btn-remover" data-index="${index}" title="Remover item">
                    ×
                </button>
            `;

            container.appendChild(cartItem);
        });
    }

    setupEventListeners() {
        // Event delegation para botões dinâmicos
        document.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);

            if (e.target.classList.contains('decrease-btn')) {
                this.decreaseQuantity(index);
            } else if (e.target.classList.contains('increase-btn')) {
                this.increaseQuantity(index);
            } else if (e.target.classList.contains('btn-remover')) {
                this.removeItem(index);
            }
        });

        // Input de quantidade
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('qty-input')) {
                const index = parseInt(e.target.dataset.index);
                const newQuantity = parseInt(e.target.value);
                this.updateQuantity(index, newQuantity);
            }
        });

        // Cupom de desconto
        document.getElementById('aplicar-cupom').addEventListener('click', () => {
            this.applyCoupon();
        });

        // Enter no input do cupom
        document.getElementById('cupom-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.applyCoupon();
            }
        });

        // Limpar carrinho
        document.getElementById('limpar-carrinho').addEventListener('click', () => {
            this.clearCart();
        });

        // Finalizar compra
        document.getElementById('finalizar-compra').addEventListener('click', () => {
            this.openCheckoutModal();
        });

        // Modal
        document.getElementById('modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        document.querySelector('.modal__overlay').addEventListener('click', () => {
            this.closeModal();
        });

        // Formulário de checkout
        document.getElementById('form-checkout').addEventListener('submit', (e) => {
            this.handleCheckout(e);
        });

        // Buscar CEP
        document.getElementById('buscar-cep-checkout').addEventListener('click', () => {
            this.buscarCEP();
        });

        // Atualizar método de pagamento
        document.querySelectorAll('input[name="pagamento"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.updatePaymentMethod();
            });
        });
    }

    decreaseQuantity(index) {
        if (this.cart[index].quantity > 1) {
            this.cart[index].quantity--;
            this.updateCart();
        }
    }

    increaseQuantity(index) {
        if (this.cart[index].quantity < 99) {
            this.cart[index].quantity++;
            this.updateCart();
        }
    }

    updateQuantity(index, newQuantity) {
        if (newQuantity >= 1 && newQuantity <= 99) {
            this.cart[index].quantity = newQuantity;
            this.updateCart();
        } else {
            // Restaurar valor anterior
            this.renderCartItems();
        }
    }

    removeItem(index) {
        if (confirm('Tem certeza que deseja remover este item do carrinho?')) {
            this.cart.splice(index, 1);
            this.updateCart();
            this.showNotification('Item removido do carrinho');
            
            // Se carrinho ficou vazio, renderizar tela vazia
            if (this.cart.length === 0) {
                this.renderCart();
            }
        }
    }

    clearCart() {
        if (confirm('Tem certeza que deseja limpar todo o carrinho?')) {
            this.cart = [];
            this.appliedCoupon = null;
            this.discountAmount = 0;
            this.updateCart();
            this.renderCart();
            this.showNotification('Carrinho limpo com sucesso');
        }
    }

    updateCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
        this.renderCartItems();
        this.updateSummary();
        this.updateCartCount();
    }

    updateSummary() {
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const frete = 0; // Frete grátis
        
        // Calcular desconto
        this.discountAmount = this.appliedCoupon ? subtotal * this.appliedCoupon.discount : 0;
        const total = subtotal + frete - this.discountAmount;

        // Atualizar elementos
        document.getElementById('total-items').textContent = totalItems;
        document.getElementById('subtotal').textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
        document.getElementById('frete').textContent = frete === 0 ? 'Grátis' : `R$ ${frete.toFixed(2).replace('.', ',')}`;
        document.getElementById('total-geral').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;

        // Mostrar/esconder desconto
        const linhaDesconto = document.getElementById('linha-desconto');
        if (this.discountAmount > 0) {
            linhaDesconto.style.display = 'flex';
            document.getElementById('desconto').textContent = `- R$ ${this.discountAmount.toFixed(2).replace('.', ',')}`;
        } else {
            linhaDesconto.style.display = 'none';
        }
    }

    applyCoupon() {
        const cupomInput = document.getElementById('cupom-input');
        const cupomCode = cupomInput.value.trim().toUpperCase();

        if (!cupomCode) {
            alert('Digite um cupom de desconto');
            return;
        }

        if (this.coupons[cupomCode]) {
            if (this.appliedCoupon && this.appliedCoupon.code === cupomCode) {
                alert('Este cupom já foi aplicado');
                return;
            }

            this.appliedCoupon = {
                code: cupomCode,
                ...this.coupons[cupomCode]
            };

            this.updateSummary();
            this.showNotification(`Cupom aplicado: ${this.appliedCoupon.description}`);
            cupomInput.value = '';
            
            // Desabilitar input do cupom
            cupomInput.placeholder = `Cupom aplicado: ${cupomCode}`;
            cupomInput.disabled = true;
            document.getElementById('aplicar-cupom').textContent = 'Remover';
            document.getElementById('aplicar-cupom').onclick = () => this.removeCoupon();
            
        } else {
            alert('Cupom inválido ou expirado');
        }
    }

    removeCoupon() {
        this.appliedCoupon = null;
        this.discountAmount = 0;
        this.updateSummary();
        
        // Habilitar input do cupom
        const cupomInput = document.getElementById('cupom-input');
        cupomInput.placeholder = 'Cupom de desconto';
        cupomInput.disabled = false;
        cupomInput.value = '';
        document.getElementById('aplicar-cupom').textContent = 'Aplicar';
        document.getElementById('aplicar-cupom').onclick = () => this.applyCoupon();
        
        this.showNotification('Cupom removido');
    }

    openCheckoutModal() {
        if (this.cart.length === 0) {
            alert('Seu carrinho está vazio');
            return;
        }

        const modal = document.getElementById('modal-checkout');
        this.fillCheckoutProducts();
        this.updateCheckoutSummary();
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        const modal = document.getElementById('modal-checkout');
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    fillCheckoutProducts() {
        const container = document.getElementById('checkout-lista');
        container.innerHTML = '';

        this.cart.forEach(item => {
            const checkoutItem = document.createElement('div');
            checkoutItem.className = 'checkout-item';

            const variantsText = Object.entries(item.variants || {})
                .map(([type, value]) => `${type}: ${value}`)
                .join(', ');

            checkoutItem.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div class="checkout-item-info">
                    <div class="checkout-item-nome">${item.name}</div>
                    <div class="checkout-item-detalhes">
                        Quantidade: ${item.quantity}
                        ${variantsText ? `<br>${variantsText}` : ''}
                    </div>
                </div>
                <div class="checkout-item-preco">
                    R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}
                </div>
            `;

            container.appendChild(checkoutItem);
        });
    }

    updateCheckoutSummary() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const frete = 0;
        const total = subtotal + frete - this.discountAmount;

        document.getElementById('checkout-subtotal').textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
        document.getElementById('checkout-frete').textContent = frete === 0 ? 'Grátis' : `R$ ${frete.toFixed(2).replace('.', ',')}`;
        document.getElementById('checkout-total').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;

        // Mostrar/esconder desconto no checkout
        const linhaDesconto = document.getElementById('checkout-desconto-linha');
        if (this.discountAmount > 0) {
            linhaDesconto.style.display = 'flex';
            document.getElementById('checkout-desconto').textContent = `- R$ ${this.discountAmount.toFixed(2).replace('.', ',')}`;
        } else {
            linhaDesconto.style.display = 'none';
        }
    }

    updatePaymentMethod() {
        // Atualizar desconto baseado no método de pagamento
        this.updateCheckoutSummary();
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
            
            // Preencher campos automaticamente
            document.querySelector('input[name="endereco"]').value = data.logradouro;
            document.querySelector('input[name="bairro"]').value = data.bairro;
            document.querySelector('input[name="cidade"]').value = data.localidade;
            
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
            alert('Erro ao buscar CEP. Tente novamente.');
        }
    }

    handleCheckout(e) {
        e.preventDefault();
        
        const button = document.querySelector('.btn-confirmar-pedido');
        const originalText = button.textContent;
        
        button.textContent = 'Processando...';
        button.disabled = true;
        
        // Simular processamento
        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
            
            // Gerar número do pedido
            const numeroPedido = Date.now().toString().slice(-6);
            
            alert(`Pedido #${numeroPedido} confirmado com sucesso!\n\nVocê receberá um email de confirmação em breve.`);
            
            // Limpar carrinho e fechar modal
            this.cart = [];
            localStorage.removeItem('cart');
            this.closeModal();
            this.renderCart();
            this.updateCartCount();
            
            // Redirecionar para página inicial
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 2000);
            
        }, 2000);
    }

    loadRecommendedProducts() {
        if (this.products.length === 0) return;

        // Pegar produtos aleatórios
        const shuffled = [...this.products].sort(() => 0.5 - Math.random());
        const recommended = shuffled.slice(0, 4);

        const container = document.getElementById('produtos-recomendados');
        container.innerHTML = '';

        recommended.forEach(product => {
            const productElement = document.createElement('div');
            productElement.className = 'produto-recomendado';
            productElement.dataset.productId = product.id;

            productElement.innerHTML = `
                <img src="${product.image}" alt="${product.name}">
                <h4>${product.name}</h4>
                <p>R$ ${product.price.toFixed(2).replace('.', ',')}</p>
            `;

            productElement.addEventListener('click', () => {
                sessionStorage.setItem('selectedProductId', product.id);
                window.location.href = './product.html';
            });

            container.appendChild(productElement);
        });
    }

    updateCartCount() {
        const count = this.cart.reduce((total, item) => total + item.quantity, 0);
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

// Inicializar página do carrinho
document.addEventListener('DOMContentLoaded', () => {
    new CarrinhoPage();
});

// Adicionar CSS para animação da notificação
const style = document.createElement('style');
style.textContent = `
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
document.head.appendChild(style);