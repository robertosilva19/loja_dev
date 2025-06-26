// Sistema de Carrinho Completo - Conectado à API

class CarrinhoManager {
    constructor() {
        this.carrinho = []; // A lista agora é preenchida pela API
        this.token = localStorage.getItem('userToken');
        this.apiBaseUrl = 'http://localhost:3001/api';

        this.cupomAplicado = null;
        this.descontoAtual = 0;
        this.cuponsValidos = {
            'DESCONTO10': { tipo: 'percentual', valor: 10, descricao: '10% de desconto' },
            'DESCONTO15': { tipo: 'percentual', valor: 15, descricao: '15% de desconto' },
            'FRETE5': { tipo: 'valor', valor: 5, descricao: 'R$ 5,00 de desconto' },
            'BEMVINDO': { tipo: 'percentual', valor: 20, descricao: '20% de desconto - Primeira compra' }
        };
        
        this.produtosDisponiveis = []; // Será preenchido assincronamente
        this.init();
    }

    async init() {
        await this.carregarProdutosDisponiveis(); 
        
        if (this.token) {
            await this.loadCartFromAPI();
        } else {
            // Se não houver login, o carrinho permanece vazio.
            this.carrinho = []; 
            this.atualizarInterfaceCompleta();
        }
        
        this.setupEventListeners();
        this.carregarProdutosRecomendados();
    }

    // --- LÓGICA DE API ---

    async loadCartFromAPI() {
        if (!this.token) return;
        try {
            const response = await fetch(`${this.apiBaseUrl}/carrinho`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!response.ok) throw new Error('Falha ao carregar carrinho da API.');
            
            this.carrinho = await response.json();
            this.atualizarInterfaceCompleta();
        } catch (error) {
            console.error('Erro ao carregar carrinho da API:', error);
            this.carrinho = []; // Garante que o carrinho fica vazio em caso de erro
            this.atualizarInterfaceCompleta();
        }
    }

    async adicionarProduto(produto, quantidade = 1) {
        if (!this.token) {
            return alert('Por favor, faça login para adicionar produtos ao carrinho.');
        }
        try {
            await fetch(`${this.apiBaseUrl}/carrinho`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ produtoId: produto.id, quantidade })
            });
            await this.loadCartFromAPI();
            this.mostrarNotificacao(`${produto.name} adicionado ao carrinho!`, 'sucesso');
        } catch (error) {
            this.mostrarNotificacao('Erro ao adicionar produto.', 'error');
        }
    }

    async removerProduto(produtoId) {
        if (!this.token) return;
        try {
            const response = await fetch(`${this.apiBaseUrl}/carrinho/${produtoId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (response.ok) {
                await this.loadCartFromAPI();
                this.mostrarNotificacao('Produto removido do carrinho.', 'info');
            } else {
                throw new Error("Falha ao remover o produto.");
            }
        } catch (error) {
            console.error('Erro ao remover produto:', error);
        }
    }

    async atualizarQuantidade(produtoId, novaQuantidade) {
        novaQuantidade = parseInt(novaQuantidade);
        if (isNaN(novaQuantidade) || novaQuantidade <= 0) {
            return this.removerProduto(produtoId);
        }
        if (!this.token) return;
        try {
            await fetch(`${this.apiBaseUrl}/carrinho/${produtoId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantidade: novaQuantidade })
            });
            await this.loadCartFromAPI();
        } catch (error) {
            console.error('Erro ao atualizar quantidade:', error);
        }
    }
    
    confirmarLimpeza() {
        if (confirm('Tem certeza que deseja limpar todo o carrinho?')) {
            this.limparCarrinho();
        }
    }

    async limparCarrinho() {
        try {
            for (const item of this.carrinho) {
                await fetch(`${this.apiBaseUrl}/carrinho/${item.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${this.token}` }
                });
            }
            await this.loadCartFromAPI();
            this.mostrarNotificacao('Carrinho limpo com sucesso', 'info');
        } catch(error) {
            this.mostrarNotificacao('Erro ao limpar o carrinho.', 'error');
        }
    }
    
    // --- MÉTODOS DE UI E UTILITÁRIOS ---

    adjustPath(path) {
        if (!path) return '';
        if (window.location.pathname.includes('/pages/')) {
            if (path.startsWith('./')) {
                return `..${path.substring(1)}`;
            }
        }
        return path;
    }

    setupEventListeners() {
        const btnAplicarCupom = document.getElementById('aplicar-cupom');
        if (btnAplicarCupom) btnAplicarCupom.addEventListener('click', () => this.aplicarCupom());
        const cupomInput = document.getElementById('cupom-input');
        if (cupomInput) cupomInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.aplicarCupom(); });
        const btnLimpar = document.getElementById('limpar-carrinho');
        if (btnLimpar) btnLimpar.addEventListener('click', () => this.confirmarLimpeza());
        const btnFinalizar = document.getElementById('finalizar-compra');
        if (btnFinalizar) btnFinalizar.addEventListener('click', () => this.abrirCheckout());
        this.setupModalCheckout();
        const btnBuscarCep = document.getElementById('buscar-cep-checkout');
        if (btnBuscarCep) btnBuscarCep.addEventListener('click', () => this.buscarCep());
        const formCheckout = document.getElementById('form-checkout');
        if (formCheckout) formCheckout.addEventListener('submit', (e) => this.processarCheckout(e));
    }

    atualizarInterfaceCompleta() {
        this.atualizarInterface();
        this.atualizarContadorCarrinho();
        this.carregarProdutosRecomendados();
    }
    
    atualizarInterface() {
        const carrinhoVazio = document.getElementById('carrinho-vazio');
        const carrinhoProdutos = document.getElementById('carrinho-produtos');
        if (!carrinhoVazio || !carrinhoProdutos) return;

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

        listaProdutos.innerHTML = this.carrinho.map(produto => {
            const imagePath = this.adjustPath(produto.imagem_url || './assets/placeholder.png');
            const preco = parseFloat(produto.preco).toFixed(2).replace('.', ',');
            const totalItem = (produto.preco * produto.quantidade).toFixed(2).replace('.', ',');

            return `
            <div class="carrinho-item" data-produto-id="${produto.id}">
                <div class="produto-info">
                    <div class="produto-imagem"><img src="${imagePath}" alt="${produto.nome}"></div>
                    <div class="produto-detalhes">
                        <h4>${produto.nome}</h4>
                        <div class="produto-categoria">${produto.category || 'Produto'}</div>
                        <div class="produto-disponibilidade">✓ Em estoque</div>
                    </div>
                </div>
                <div class="produto-preco">R$ ${preco}</div>
                <div class="quantidade-container">
                    <div class="quantidade-controls">
                        <button class="quantidade-btn" onclick="carrinhoManager.diminuirQuantidade(${produto.id})">-</button>
                        <input type="number" value="${produto.quantidade}" min="1" class="quantidade-input" onchange="carrinhoManager.atualizarQuantidade(${produto.id}, this.value)">
                        <button class="quantidade-btn" onclick="carrinhoManager.aumentarQuantidade(${produto.id})">+</button>
                    </div>
                </div>
                <div class="item-total">R$ ${totalItem}</div>
                <div class="item-acoes">
                    <button class="btn-remover" onclick="carrinhoManager.removerProduto(${produto.id})" title="Remover do carrinho"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>`;
        }).join('');
    }

    atualizarResumo() {
        const subtotal = this.calcularSubtotal();
        const frete = this.calcularFrete(subtotal);
        const desconto = this.calcularDesconto(subtotal);
        const total = subtotal + frete - desconto;
        
        document.getElementById('total-items').textContent = this.carrinho.reduce((acc, item) => acc + item.quantidade, 0);
        document.getElementById('subtotal').textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
        
        const freteElement = document.getElementById('frete');
        freteElement.textContent = frete === 0 ? 'Grátis' : `R$ ${frete.toFixed(2).replace('.', ',')}`;
        freteElement.classList.toggle('frete-gratis', frete === 0);

        const linhaDesconto = document.getElementById('linha-desconto');
        linhaDesconto.style.display = desconto > 0 ? 'flex' : 'none';
        document.getElementById('desconto').textContent = `- R$ ${desconto.toFixed(2).replace('.', ',')}`;
        
        document.getElementById('total-geral').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
        const btnFinalizar = document.getElementById('finalizar-compra');
        if (btnFinalizar) btnFinalizar.disabled = this.carrinho.length === 0;
    }

    calcularSubtotal() { return this.carrinho.reduce((total, produto) => total + (parseFloat(produto.preco) * produto.quantidade), 0); }
    calcularFrete(subtotal) { return subtotal >= 99 ? 0 : 15; }
    calcularDesconto(subtotal) {
        if (!this.cupomAplicado) return 0;
        const cupom = this.cuponsValidos[this.cupomAplicado];
        if (!cupom) return 0;
        return cupom.tipo === 'percentual' ? subtotal * (cupom.valor / 100) : Math.min(cupom.valor, subtotal);
    }
    
    aumentarQuantidade(produtoId) {
        const produto = this.carrinho.find(item => item.id === produtoId);
        if (produto) this.atualizarQuantidade(produtoId, produto.quantidade + 1);
    }

    diminuirQuantidade(produtoId) {
        const produto = this.carrinho.find(item => item.id === produtoId);
        if (produto && produto.quantidade > 1) {
            this.atualizarQuantidade(produtoId, produto.quantidade - 1);
        } else if (produto && produto.quantidade === 1) {
            if(confirm(`Deseja remover ${produto.nome} do carrinho?`)) {
                this.removerProduto(produtoId);
            }
        }
    }

    aplicarCupom() { /* ... Sua lógica de cupom ... */ }
    removerCupom() { /* ... Sua lógica de cupom ... */ }
    
    async carregarProdutosDisponiveis() {
        try {
            const jsonPath = this.adjustPath('./data/products.json');
            const response = await fetch(jsonPath);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            this.produtosDisponiveis = data.products;
        } catch (error) {
            console.error("Erro ao carregar produtos disponíveis:", error);
            this.produtosDisponiveis = [];
        }
    }

    carregarProdutosRecomendados() {
        const container = document.getElementById('produtos-recomendados');
        if (!container) return;
        const produtosNoCarrinho = this.carrinho.map(item => item.id);
        const recomendados = this.produtosDisponiveis.filter(p => !produtosNoCarrinho.includes(p.id)).slice(0, 4);
        container.innerHTML = recomendados.map(produto => {
             const imagePath = this.adjustPath(produto.image);
             return `
            <div class="produto-recomendado" onclick="sessionStorage.setItem('selectedProductId', ${produto.id}); window.location.href='../pages/product.html'">
                <img src="${imagePath}" alt="${produto.name}">
                <div class="produto-recomendado-info">
                    <h4>${produto.name}</h4>
                    <div class="produto-recomendado-preco">R$ ${parseFloat(produto.price).toFixed(2).replace('.', ',')}</div>
                    <button class="btn-adicionar-recomendado" onclick="event.stopPropagation(); carrinhoManager.adicionarProduto(JSON.parse('${JSON.stringify(produto).replace(/'/g, "\\'")}'))">
                        Adicionar
                    </button>
                </div>
            </div>`;
        }).join('');
    }

    setupModalCheckout() {
        const modal = document.getElementById('modal-checkout');
        const btnClose = document.getElementById('modal-close');
        const overlay = modal?.querySelector('.modal__overlay');
        if (btnClose) btnClose.addEventListener('click', () => this.fecharModal());
        if (overlay) overlay.addEventListener('click', () => this.fecharModal());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal?.style.display === 'block') this.fecharModal();
        });
    }

    abrirCheckout() {
        if (this.carrinho.length === 0) return this.mostrarNotificacao('O carrinho está vazio', 'erro');
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
        const checkoutLista = document.getElementById('checkout-lista');
        if (checkoutLista) {
            checkoutLista.innerHTML = this.carrinho.map(produto => {
                const imagePath = this.adjustPath(produto.imagem_url || produto.image);
                return `
                <div class="checkout-item">
                    <div class="checkout-item-info">
                        <img src="${imagePath}" alt="${produto.nome}">
                        <div>
                            <strong>${produto.nome}</strong>
                            <div>Quantidade: ${produto.quantidade}</div>
                        </div>
                    </div>
                    <div class="checkout-item-preco">R$ ${(produto.preco * produto.quantidade).toFixed(2).replace('.', ',')}</div>
                </div>`;
            }).join('');
        }
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
        if(descontoLinha){
            descontoLinha.style.display = desconto > 0 ? 'flex' : 'none';
            document.getElementById('checkout-desconto').textContent = `- R$ ${desconto.toFixed(2).replace('.', ',')}`;
        }
        document.getElementById('checkout-total').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    }

    async buscarCep() { /* ... sua lógica de CEP ... */ }
    async processarCheckout(e) { /* ... sua lógica de checkout ... */ }

    atualizarContadorCarrinho() {
        const contador = document.getElementById('cart-count');
        if (contador) {
            const totalItens = this.carrinho.reduce((total, item) => total + item.quantidade, 0);
            contador.textContent = totalItens;
            contador.style.display = totalItens > 0 ? 'flex' : 'none';
        }
    }
    
    mostrarNotificacao(mensagem, tipo = 'info') {
        const notificacaoExistente = document.querySelector('.notificacao-toast');
        if (notificacaoExistente) notificacaoExistente.remove();
        const notificacao = document.createElement('div');
        notificacao.className = `notificacao-toast ${tipo}`;
        notificacao.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${this.getIconePorTipo(tipo)}</span>
                <span class="toast-message">${mensagem}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        // Estilos e lógica de remoção
        document.body.appendChild(notificacao);
        setTimeout(() => notificacao.remove(), 4000);
    }

    getIconePorTipo(tipo) {
        const icones = { 'sucesso': '✅', 'erro': '❌', 'info': 'ℹ️', 'aviso': '⚠️' };
        return icones[tipo] || icones.info;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Garante que uma instância global seja criada
    if (!window.carrinhoManager) {
        window.carrinhoManager = new CarrinhoManager();
    }
});

// API pública para outras páginas
window.CarrinhoAPI = {
    adicionar: (produto, quantidade = 1) => window.carrinhoManager?.adicionarProduto(produto, quantidade),
    remover: (produtoId) => window.carrinhoManager?.removerProduto(produtoId),
    obterItens: () => window.carrinhoManager?.carrinho || [],
    obterTotal: () => {
        if (!window.carrinhoManager) return 0;
        const cm = window.carrinhoManager;
        const subtotal = cm.calcularSubtotal();
        const frete = cm.calcularFrete(subtotal);
        const desconto = cm.calcularDesconto(subtotal);
        return subtotal + frete - desconto;
    }
};

const carrinhoAnimationStyle = document.createElement('style');
carrinhoAnimationStyle.textContent = `
    @keyframes slideIn { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
    @keyframes slideOut { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(100%); } }
`;
document.head.appendChild(carrinhoAnimationStyle);
