// Sistema de Carrinho Completo

class CarrinhoManager {
    constructor() {
        this.carrinho = this.carregarCarrinho();
        this.cupomAplicado = null;
        this.descontoAtual = 0;
        this.cuponsValidos = {
            'DESCONTO10': { tipo: 'percentual', valor: 10, descricao: '10% de desconto' },
            'DESCONTO15': { tipo: 'percentual', valor: 15, descricao: '15% de desconto' },
            'FRETE5': { tipo: 'valor', valor: 5, descricao: 'R$ 5,00 de desconto' },
            'BEMVINDO': { tipo: 'percentual', valor: 20, descricao: '20% de desconto - Primeira compra' }
        };
        
        this.produtosDisponiveis = this.getProdutosDisponiveis();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.atualizarInterface();
        this.carregarProdutosRecomendados();
        this.atualizarContadorCarrinho();
    }

    setupEventListeners() {
        // Aplicar cupom
        const btnAplicarCupom = document.getElementById('aplicar-cupom');
        if (btnAplicarCupom) {
            btnAplicarCupom.addEventListener('click', () => this.aplicarCupom());
        }

        // Enter no input do cupom
        const cupomInput = document.getElementById('cupom-input');
        if (cupomInput) {
            cupomInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.aplicarCupom();
                }
            });
        }

        // Limpar carrinho
        const btnLimpar = document.getElementById('limpar-carrinho');
        if (btnLimpar) {
            btnLimpar.addEventListener('click', () => this.confirmarLimpeza());
        }

        // Finalizar compra
        const btnFinalizar = document.getElementById('finalizar-compra');
        if (btnFinalizar) {
            btnFinalizar.addEventListener('click', () => this.abrirCheckout());
        }

        // Modal de checkout
        this.setupModalCheckout();

        // Buscar CEP no checkout
        const btnBuscarCep = document.getElementById('buscar-cep-checkout');
        if (btnBuscarCep) {
            btnBuscarCep.addEventListener('click', () => this.buscarCep());
        }

        // Form de checkout
        const formCheckout = document.getElementById('form-checkout');
        if (formCheckout) {
            formCheckout.addEventListener('submit', (e) => this.processarCheckout(e));
        }

        // Atualizar carrinho quando alterado em outras páginas
        window.addEventListener('storage', (e) => {
            if (e.key === 'carrinho') {
                this.carrinho = this.carregarCarrinho();
                this.atualizarInterface();
            }
        });
    }

    // Gerenciamento do Carrinho
    carregarCarrinho() {
        const carrinho = localStorage.getItem('carrinho');
        return carrinho ? JSON.parse(carrinho) : [];
    }

    salvarCarrinho() {
        localStorage.setItem('carrinho', JSON.stringify(this.carrinho));
        this.atualizarContadorCarrinho();
        
        // Disparar evento para outras páginas
        window.dispatchEvent(new CustomEvent('carrinhoAtualizado', {
            detail: { carrinho: this.carrinho }
        }));
    }

    adicionarProduto(produto, quantidade = 1) {
        const itemExistente = this.carrinho.find(item => item.id === produto.id);
        
        if (itemExistente) {
            itemExistente.quantidade += quantidade;
        } else {
            this.carrinho.push({
                ...produto,
                quantidade: quantidade
            });
        }
        
        this.salvarCarrinho();
        this.atualizarInterface();
        this.mostrarNotificacao(`${produto.name} adicionado ao carrinho!`, 'sucesso');
    }

    removerProduto(produtoId) {
        const produto = this.carrinho.find(item => item.id === produtoId);
        if (produto) {
            this.carrinho = this.carrinho.filter(item => item.id !== produtoId);
            this.salvarCarrinho();
            this.atualizarInterface();
            this.mostrarNotificacao(`${produto.name} removido do carrinho`, 'info');
        }
    }

    atualizarQuantidade(produtoId, novaQuantidade) {
        const produto = this.carrinho.find(item => item.id === produtoId);
        if (produto) {
            if (novaQuantidade <= 0) {
                this.removerProduto(produtoId);
            } else {
                produto.quantidade = parseInt(novaQuantidade);
                this.salvarCarrinho();
                this.atualizarInterface();
            }
        }
    }

    limparCarrinho() {
        this.carrinho = [];
        this.cupomAplicado = null;
        this.descontoAtual = 0;
        this.salvarCarrinho();
        this.atualizarInterface();
        this.mostrarNotificacao('Carrinho limpo com sucesso', 'info');
    }

    // Interface
    atualizarInterface() {
        const carrinhoVazio = document.getElementById('carrinho-vazio');
        const carrinhoProdutos = document.getElementById('carrinho-produtos');

        if (this.carrinho.length === 0) {
            carrinhoVazio.style.display = 'block';
            carrinhoProdutos.style.display = 'none';
        } else {
            carrinhoVazio.style.display = 'none';
            carrinhoProdutos.style.display = 'block';
            this.renderizarProdutos();
            this.atualizarResumo();
        }
    }

    renderizarProdutos() {
        const listaProdutos = document.getElementById('lista-produtos');
        if (!listaProdutos) return;

        listaProdutos.innerHTML = this.carrinho.map(produto => `
            <div class="carrinho-item" data-produto-id="${produto.id}">
                <div class="produto-info">
                    <div class="produto-imagem">
                        <img src="${produto.image}" alt="${produto.name}">
                    </div>
                    <div class="produto-detalhes">
                        <h4>${produto.name}</h4>
                        <div class="produto-categoria">${produto.category || 'Produto'}</div>
                        <div class="produto-disponibilidade">✓ Em estoque</div>
                    </div>
                </div>
                
                <div class="produto-preco">
                    R$ ${produto.price.toFixed(2).replace('.', ',')}
                </div>
                
                <div class="quantidade-container">
                    <div class="quantidade-controls">
                        <button class="quantidade-btn" onclick="carrinho.diminuirQuantidade(${produto.id})">-</button>
                        <input 
                            type="number" 
                            value="${produto.quantidade}" 
                            min="1" 
                            class="quantidade-input"
                            onchange="carrinho.atualizarQuantidade(${produto.id}, this.value)"
                        >
                        <button class="quantidade-btn" onclick="carrinho.aumentarQuantidade(${produto.id})">+</button>
                    </div>
                </div>
                
                <div class="item-total">
                    R$ ${(produto.price * produto.quantidade).toFixed(2).replace('.', ',')}
                </div>
                
                <div class="item-acoes">
                    <button class="btn-favoritar ${this.isFavorito(produto.id) ? 'ativo' : ''}" 
                            onclick="carrinho.toggleFavorito(${produto.id})" 
                            title="Adicionar aos favoritos">
                        ❤️
                    </button>
                    <button class="btn-remover" 
                            onclick="carrinho.removerProduto(${produto.id})" 
                            title="Remover do carrinho">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    }

    atualizarResumo() {
        const subtotal = this.calcularSubtotal();
        const frete = this.calcularFrete(subtotal);
        const desconto = this.calcularDesconto(subtotal);
        const total = subtotal + frete - desconto;

        // Atualizar elementos do resumo
        document.getElementById('total-items').textContent = this.carrinho.length;
        document.getElementById('subtotal').textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
        
        const freteElement = document.getElementById('frete');
        if (frete === 0) {
            freteElement.textContent = 'Grátis';
            freteElement.classList.add('frete-gratis');
        } else {
            freteElement.textContent = `R$ ${frete.toFixed(2).replace('.', ',')}`;
            freteElement.classList.remove('frete-gratis');
        }

        // Mostrar/ocultar linha de desconto
        const linhaDesconto = document.getElementById('linha-desconto');
        if (desconto > 0) {
            linhaDesconto.style.display = 'flex';
            document.getElementById('desconto').textContent = `- R$ ${desconto.toFixed(2).replace('.', ',')}`;
        } else {
            linhaDesconto.style.display = 'none';
        }

        document.getElementById('total-geral').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;

        // Atualizar botão de finalizar
        const btnFinalizar = document.getElementById('finalizar-compra');
        if (btnFinalizar) {
            btnFinalizar.disabled = this.carrinho.length === 0;
        }
    }

    // Cálculos
    calcularSubtotal() {
        return this.carrinho.reduce((total, produto) => {
            return total + (produto.price * produto.quantidade);
        }, 0);
    }

    calcularFrete(subtotal) {
        // Frete grátis acima de R$ 99
        return subtotal >= 99 ? 0 : 15;
    }

    calcularDesconto(subtotal) {
        if (!this.cupomAplicado) return 0;
        
        const cupom = this.cuponsValidos[this.cupomAplicado];
        if (!cupom) return 0;

        if (cupom.tipo === 'percentual') {
            return subtotal * (cupom.valor / 100);
        } else if (cupom.tipo === 'valor') {
            return Math.min(cupom.valor, subtotal);
        }
        
        return 0;
    }

    // Métodos auxiliares para quantidade
    aumentarQuantidade(produtoId) {
        const produto = this.carrinho.find(item => item.id === produtoId);
        if (produto) {
            this.atualizarQuantidade(produtoId, produto.quantidade + 1);
        }
    }

    diminuirQuantidade(produtoId) {
        const produto = this.carrinho.find(item => item.id === produtoId);
        if (produto && produto.quantidade > 1) {
            this.atualizarQuantidade(produtoId, produto.quantidade - 1);
        }
    }

    // Sistema de Cupons
    aplicarCupom() {
        const cupomInput = document.getElementById('cupom-input');
        const cupomCodigo = cupomInput.value.trim().toUpperCase();
        
        if (!cupomCodigo) {
            this.mostrarNotificacao('Digite um código de cupom', 'erro');
            return;
        }

        if (this.cuponsValidos[cupomCodigo]) {
            if (this.cupomAplicado === cupomCodigo) {
                this.mostrarNotificacao('Este cupom já foi aplicado', 'info');
                return;
            }

            this.cupomAplicado = cupomCodigo;
            const cupom = this.cuponsValidos[cupomCodigo];
            
            cupomInput.classList.add('cupom-aplicado');
            cupomInput.classList.remove('cupom-erro');
            
            this.atualizarResumo();
            this.mostrarNotificacao(`Cupom aplicado: ${cupom.descricao}`, 'sucesso');
            
            // Mudar texto do botão
            const btnCupom = document.getElementById('aplicar-cupom');
            btnCupom.textContent = 'Remover';
            btnCupom.onclick = () => this.removerCupom();
            
        } else {
            cupomInput.classList.add('cupom-erro');
            cupomInput.classList.remove('cupom-aplicado');
            this.mostrarNotificacao('Cupom inválido', 'erro');
        }
    }

    removerCupom() {
        this.cupomAplicado = null;
        const cupomInput = document.getElementById('cupom-input');
        const btnCupom = document.getElementById('aplicar-cupom');
        
        cupomInput.value = '';
        cupomInput.classList.remove('cupom-aplicado', 'cupom-erro');
        
        btnCupom.textContent = 'Aplicar';
        btnCupom.onclick = () => this.aplicarCupom();
        
        this.atualizarResumo();
        this.mostrarNotificacao('Cupom removido', 'info');
    }

    // Favoritos
    isFavorito(produtoId) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
        return favoritos.some(fav => fav.id === produtoId);
    }

    toggleFavorito(produtoId) {
        const produto = this.carrinho.find(item => item.id === produtoId);
        if (!produto) return;

        let favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
        const jaFavorito = favoritos.some(fav => fav.id === produtoId);

        if (jaFavorito) {
            favoritos = favoritos.filter(fav => fav.id !== produtoId);
            this.mostrarNotificacao(`${produto.name} removido dos favoritos`, 'info');
        } else {
            favoritos.push(produto);
            this.mostrarNotificacao(`${produto.name} adicionado aos favoritos`, 'sucesso');
        }

        localStorage.setItem('favoritos', JSON.stringify(favoritos));
        this.renderizarProdutos();
    }

    // Produtos Recomendados
    carregarProdutosRecomendados() {
        const container = document.getElementById('produtos-recomendados');
        if (!container) return;

        // Filtrar produtos que não estão no carrinho
        const produtosNoCarrinho = this.carrinho.map(item => item.id);
        const recomendados = this.produtosDisponiveis
            .filter(produto => !produtosNoCarrinho.includes(produto.id))
            .slice(0, 4); // Mostrar apenas 4

        container.innerHTML = recomendados.map(produto => `
            <div class="produto-recomendado" data-produto-id="${produto.id}">
                <img src="${produto.image}" alt="${produto.name}">
                <div class="produto-recomendado-info">
                    <h4>${produto.name}</h4>
                    <div class="produto-recomendado-preco">
                        R$ ${produto.price.toFixed(2).replace('.', ',')}
                    </div>
                    <button class="btn-adicionar-recomendado" 
                            onclick="carrinho.adicionarProduto(${JSON.stringify(produto).replace(/"/g, '&quot;')})">
                        Adicionar ao Carrinho
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Modal e Checkout
    setupModalCheckout() {
        const modal = document.getElementById('modal-checkout');
        const btnClose = document.getElementById('modal-close');
        const overlay = modal?.querySelector('.modal__overlay');

        if (btnClose) {
            btnClose.addEventListener('click', () => this.fecharModal());
        }

        if (overlay) {
            overlay.addEventListener('click', () => this.fecharModal());
        }

        // ESC para fechar modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal?.style.display === 'block') {
                this.fecharModal();
            }
        });
    }

    abrirCheckout() {
        if (this.carrinho.length === 0) {
            this.mostrarNotificacao('Carrinho está vazio', 'erro');
            return;
        }

        const modal = document.getElementById('modal-checkout');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            this.preencherCheckout();
        }
    }

    fecharModal() {
        const modal = document.getElementById('modal-checkout');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    preencherCheckout() {
        // Preencher lista de produtos no checkout
        const checkoutLista = document.getElementById('checkout-lista');
        if (checkoutLista) {
            checkoutLista.innerHTML = this.carrinho.map(produto => `
                <div class="checkout-item">
                    <div class="checkout-item-info">
                        <img src="${produto.image}" alt="${produto.name}">
                        <div>
                            <strong>${produto.name}</strong>
                            <div>Quantidade: ${produto.quantidade}</div>
                        </div>
                    </div>
                    <div class="checkout-item-preco">
                        R$ ${(produto.price * produto.quantidade).toFixed(2).replace('.', ',')}
                    </div>
                </div>
            `).join('');
        }

        // Atualizar resumo do checkout
        this.atualizarResumoCheckout();
    }

    atualizarResumoCheckout() {
        const subtotal = this.calcularSubtotal();
        const frete = this.calcularFrete(subtotal);
        const desconto = this.calcularDesconto(subtotal);
        const total = subtotal + frete - desconto;

        document.getElementById('checkout-subtotal').textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
        document.getElementById('checkout-frete').textContent = frete === 0 ? 'Grátis' : `R$ ${frete.toFixed(2).replace('.', ',')}`;
        
        const descontoLinha = document.getElementById('checkout-desconto-linha');
        if (desconto > 0) {
            descontoLinha.style.display = 'flex';
            document.getElementById('checkout-desconto').textContent = `- R$ ${desconto.toFixed(2).replace('.', ',')}`;
        } else {
            descontoLinha.style.display = 'none';
        }

        document.getElementById('checkout-total').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    }

    async buscarCep() {
        const cepInput = document.querySelector('input[name="cep"]');
        const cep = cepInput.value.replace(/\D/g, '');
        
        if (cep.length !== 8) {
            this.mostrarNotificacao('CEP deve ter 8 dígitos', 'erro');
            return;
        }

        const btnBuscar = document.getElementById('buscar-cep-checkout');
        btnBuscar.classList.add('btn-loading');
        btnBuscar.disabled = true;

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (data.erro) {
                this.mostrarNotificacao('CEP não encontrado', 'erro');
                return;
            }

            // Preencher campos automaticamente
            document.querySelector('input[name="endereco"]').value = data.logradouro || '';
            document.querySelector('input[name="bairro"]').value = data.bairro || '';
            document.querySelector('input[name="cidade"]').value = data.localidade || '';

            this.mostrarNotificacao('CEP encontrado!', 'sucesso');

        } catch (error) {
            this.mostrarNotificacao('Erro ao buscar CEP', 'erro');
        } finally {
            btnBuscar.classList.remove('btn-loading');
            btnBuscar.disabled = false;
        }
    }

    async processarCheckout(e) {
        e.preventDefault();
        
        const btnConfirmar = e.target.querySelector('.btn-confirmar-pedido');
        btnConfirmar.classList.add('btn-loading');
        btnConfirmar.disabled = true;

        // Simular processamento
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Criar pedido
        const formData = new FormData(e.target);
        const pedido = {
            id: Date.now(),
            data: new Date().toISOString(),
            produtos: [...this.carrinho],
            dadosPessoais: Object.fromEntries(formData),
            resumo: {
                subtotal: this.calcularSubtotal(),
                frete: this.calcularFrete(this.calcularSubtotal()),
                desconto: this.calcularDesconto(this.calcularSubtotal()),
                total: this.calcularSubtotal() + this.calcularFrete(this.calcularSubtotal()) - this.calcularDesconto(this.calcularSubtotal())
            },
            cupom: this.cupomAplicado,
            status: 'confirmado'
        };

        // Salvar pedido
        let pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
        pedidos.unshift(pedido);
        localStorage.setItem('pedidos', JSON.stringify(pedidos));

        // Limpar carrinho
        this.limparCarrinho();

        // Fechar modal
        this.fecharModal();

        // Mostrar sucesso
        this.mostrarNotificacao('Pedido realizado com sucesso! Você receberá um email de confirmação.', 'sucesso');

        // Redirecionar para página de sucesso (se existir)
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 2000);
    }

    // Confirmações
    confirmarLimpeza() {
        if (confirm('Tem certeza que deseja limpar todo o carrinho?')) {
            this.limparCarrinho();
        }
    }

    // Contador do Carrinho
    atualizarContadorCarrinho() {
        const contador = document.getElementById('cart-count');
        if (contador) {
            const totalItens = this.carrinho.reduce((total, item) => total + item.quantidade, 0);
            contador.textContent = totalItens;
            
            if (totalItens > 0) {
                contador.classList.remove('hide');
                contador.style.display = 'flex';
            } else {
                contador.classList.add('hide');
            }
        }
    }

    // Notificações
    mostrarNotificacao(mensagem, tipo = 'info') {
        // Remover notificação existente
        const notificacaoExistente = document.querySelector('.notificacao-toast');
        if (notificacaoExistente) {
            notificacaoExistente.remove();
        }

        // Criar nova notificação
        const notificacao = document.createElement('div');
        notificacao.className = `notificacao-toast ${tipo}`;
        notificacao.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${this.getIconePorTipo(tipo)}</span>
                <span class="toast-message">${mensagem}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;

        // Adicionar estilos inline para funcionar sem CSS específico
        notificacao.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${tipo === 'erro' ? '#dc2626' : tipo === 'sucesso' ? '#10b981' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 1rem;
            max-width: 400px;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notificacao);

        // Remover automaticamente após 4 segundos
        setTimeout(() => {
            if (notificacao.parentElement) {
                notificacao.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notificacao.remove(), 300);
            }
        }, 4000);
    }

    getIconePorTipo(tipo) {
        const icones = {
            'sucesso': '✅',
            'erro': '❌',
            'info': 'ℹ️',
            'aviso': '⚠️'
        };
        return icones[tipo] || icones.info;
    }

    // Produtos disponíveis (simulação de banco de dados)
    getProdutosDisponiveis() {
        return [
            {
                id: 1,
                name: 'Camiseta React Developer',
                category: 'Roupas',
                price: 79.90,
                image: '../assets/produtos/camiseta-react.jpg'
            },
            {
                id: 2,
                name: 'Caneca JavaScript Coffee',
                category: 'Canecas',
                price: 29.90,
                image: '../assets/produtos/caneca-js.jpg'
            },
            {
                id: 3,
                name: 'Mousepad Geek Code',
                category: 'Acessórios',
                price: 45.90,
                image: '../assets/produtos/mousepad-code.jpg'
            },
            {
                id: 4,
                name: 'Livro Clean Code',
                category: 'Livros',
                price: 89.90,
                image: '../assets/produtos/livro-clean-code.jpg'
            },
            {
                id: 5,
                name: 'Adesivos Git Commits',
                category: 'Adesivos',
                price: 15.90,
                image: '../assets/produtos/adesivos-git.jpg'
            },
            {
                id: 6,
                name: 'Camiseta Python Programming',
                category: 'Roupas',
                price: 69.90,
                image: '../assets/produtos/camiseta-python.jpg'
            }
        ];
    }
}

// Inicializar carrinho
let carrinho;
document.addEventListener('DOMContentLoaded', () => {
    carrinho = new CarrinhoManager();
});

// API pública para outras páginas
window.CarrinhoAPI = {
    adicionar: (produto, quantidade = 1) => {
        if (carrinho) {
            carrinho.adicionarProduto(produto, quantidade);
        }
    },
    
    remover: (produtoId) => {
        if (carrinho) {
            carrinho.removerProduto(produtoId);
        }
    },
    
    obterItens: () => {
        return carrinho ? carrinho.carrinho : [];
    },
    
    obterTotal: () => {
        if (!carrinho) return 0;
        const subtotal = carrinho.calcularSubtotal();
        const frete = carrinho.calcularFrete(subtotal);
        const desconto = carrinho.calcularDesconto(subtotal);
        return subtotal + frete - desconto;
    }
};

// Adicionar animações CSS dinamicamente
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);