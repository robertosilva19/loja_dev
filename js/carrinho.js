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
        
        this.produtosDisponiveis = []; // Será preenchido assincronamente
        this.init();
    }

    async init() {
        await this.carregarProdutosDisponiveis(); // Carrega os produtos primeiro
        this.setupEventListeners();
        this.atualizarInterface();
        this.carregarProdutosRecomendados();
        this.atualizarContadorCarrinho();
    }
    
    // --- NOVO MÉTODO AUXILIAR ---
    // Ajusta o caminho para funcionar em subpastas no GitHub Pages
    adjustPath(path) {
        if (!path || typeof path !== 'string') {
            return '';
        }
        // Se a página atual está dentro de /pages/, adiciona "../"
        if (window.location.pathname.includes('/pages/')) {
            if (path.startsWith('./')) {
                return `..${path.substring(1)}`;
            }
        }
        return path;
    }


    setupEventListeners() {
        const btnAplicarCupom = document.getElementById('aplicar-cupom');
        if (btnAplicarCupom) {
            btnAplicarCupom.addEventListener('click', () => this.aplicarCupom());
        }

        const cupomInput = document.getElementById('cupom-input');
        if (cupomInput) {
            cupomInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.aplicarCupom();
            });
        }

        const btnLimpar = document.getElementById('limpar-carrinho');
        if (btnLimpar) {
            btnLimpar.addEventListener('click', () => this.confirmarLimpeza());
        }

        const btnFinalizar = document.getElementById('finalizar-compra');
        if (btnFinalizar) {
            btnFinalizar.addEventListener('click', () => this.abrirCheckout());
        }

        this.setupModalCheckout();

        const btnBuscarCep = document.getElementById('buscar-cep-checkout');
        if (btnBuscarCep) {
            btnBuscarCep.addEventListener('click', () => this.buscarCep());
        }

        const formCheckout = document.getElementById('form-checkout');
        if (formCheckout) {
            formCheckout.addEventListener('submit', (e) => this.processarCheckout(e));
        }

        window.addEventListener('storage', (e) => {
            if (e.key === 'carrinho') {
                this.carrinho = this.carregarCarrinho();
                this.atualizarInterface();
            }
        });
    }

    carregarCarrinho() {
        const carrinho = localStorage.getItem('carrinho');
        return carrinho ? JSON.parse(carrinho) : [];
    }

    salvarCarrinho() {
        localStorage.setItem('carrinho', JSON.stringify(this.carrinho));
        this.atualizarContadorCarrinho();
        window.dispatchEvent(new CustomEvent('carrinhoAtualizado', {
            detail: { carrinho: this.carrinho }
        }));
    }

    adicionarProduto(produto, quantidade = 1) {
        const itemExistente = this.carrinho.find(item => item.id === produto.id);
        
        if (itemExistente) {
            itemExistente.quantidade += quantidade;
        } else {
            this.carrinho.push({ ...produto, quantidade: quantidade });
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
            const imagePath = this.adjustPath(produto.image); // --- MUDANÇA AQUI ---
            return `
            <div class="carrinho-item" data-produto-id="${produto.id}">
                <div class="produto-info">
                    <div class="produto-imagem">
                        <img src="${imagePath}" alt="${produto.name}">
                    </div>
                    <div class="produto-detalhes">
                        <h4>${produto.name}</h4>
                        <div class="produto-categoria">${produto.category || 'Produto'}</div>
                        <div class="produto-disponibilidade">✓ Em estoque</div>
                    </div>
                </div>
                <div class="produto-preco">R$ ${produto.price.toFixed(2).replace('.', ',')}</div>
                <div class="quantidade-container">
                    <div class="quantidade-controls">
                        <button class="quantidade-btn" onclick="carrinho.diminuirQuantidade(${produto.id})">-</button>
                        <input type="number" value="${produto.quantidade}" min="1" class="quantidade-input" onchange="carrinho.atualizarQuantidade(${produto.id}, this.value)">
                        <button class="quantidade-btn" onclick="carrinho.aumentarQuantidade(${produto.id})">+</button>
                    </div>
                </div>
                <div class="item-total">R$ ${(produto.price * produto.quantidade).toFixed(2).replace('.', ',')}</div>
                <div class="item-acoes">
                    <button class="btn-favoritar ${this.isFavorito(produto.id) ? 'ativo' : ''}" onclick="carrinho.toggleFavorito(${produto.id})" title="Adicionar aos favoritos">❤️</button>
                    <button class="btn-remover" onclick="carrinho.removerProduto(${produto.id})" title="Remover do carrinho">🗑️</button>
                </div>
            </div>`;
        }).join('');
    }

    atualizarResumo() {
        const subtotal = this.calcularSubtotal();
        const frete = this.calcularFrete(subtotal);
        const desconto = this.calcularDesconto(subtotal);
        const total = subtotal + frete - desconto;

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

        const linhaDesconto = document.getElementById('linha-desconto');
        if (desconto > 0) {
            linhaDesconto.style.display = 'flex';
            document.getElementById('desconto').textContent = `- R$ ${desconto.toFixed(2).replace('.', ',')}`;
        } else {
            linhaDesconto.style.display = 'none';
        }

        document.getElementById('total-geral').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
        
        const btnFinalizar = document.getElementById('finalizar-compra');
        if (btnFinalizar) {
            btnFinalizar.disabled = this.carrinho.length === 0;
        }
    }

    calcularSubtotal() {
        return this.carrinho.reduce((total, produto) => total + (produto.price * produto.quantidade), 0);
    }

    calcularFrete(subtotal) {
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
    
    // --- MUDANÇA AQUI: Carrega produtos do JSON ---
    async carregarProdutosDisponiveis() {
        try {
            const jsonPath = this.adjustPath('./data/products.json');
            const response = await fetch(jsonPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.produtosDisponiveis = data.products;
        } catch (error) {
            console.error("Erro ao carregar produtos disponíveis:", error);
            this.produtosDisponiveis = []; // Fallback para lista vazia
        }
    }

    carregarProdutosRecomendados() {
        const container = document.getElementById('produtos-recomendados');
        if (!container) return;

        const produtosNoCarrinho = this.carrinho.map(item => item.id);
        const recomendados = this.produtosDisponiveis
            .filter(produto => !produtosNoCarrinho.includes(produto.id))
            .slice(0, 4);

        container.innerHTML = recomendados.map(produto => {
             const imagePath = this.adjustPath(produto.image); // --- MUDANÇA AQUI ---
             return `
            <div class="produto-recomendado" data-produto-id="${produto.id}">
                <img src="${imagePath}" alt="${produto.name}">
                <div class="produto-recomendado-info">
                    <h4>${produto.name}</h4>
                    <div class="produto-recomendado-preco">R$ ${produto.price.toFixed(2).replace('.', ',')}</div>
                    <button class="btn-adicionar-recomendado" onclick="carrinho.adicionarProduto(${JSON.stringify(produto).replace(/"/g, '&quot;')})">
                        Adicionar ao Carrinho
                    </button>
                </div>
            </div>`;
        }).join('');
    }

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
        const checkoutLista = document.getElementById('checkout-lista');
        if (checkoutLista) {
            checkoutLista.innerHTML = this.carrinho.map(produto => {
                const imagePath = this.adjustPath(produto.image); // --- MUDANÇA AQUI ---
                return `
                <div class="checkout-item">
                    <div class="checkout-item-info">
                        <img src="${imagePath}" alt="${produto.name}">
                        <div>
                            <strong>${produto.name}</strong>
                            <div>Quantidade: ${produto.quantidade}</div>
                        </div>
                    </div>
                    <div class="checkout-item-preco">R$ ${(produto.price * produto.quantidade).toFixed(2).replace('.', ',')}</div>
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
        if (desconto > 0) {
            descontoLinha.style.display = 'flex';
            document.getElementById('checkout-desconto').textContent = `- R$ ${desconto.toFixed(2).replace('.', ',')}`;
        } else {
            descontoLinha.style.display = 'none';
        }

        document.getElementById('checkout-total').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    }

    async buscarCep() {
        // ... (código original sem alterações)
    }

    async processarCheckout(e) {
        // ... (código original sem alterações)
    }

    confirmarLimpeza() {
        if (confirm('Tem certeza que deseja limpar todo o carrinho?')) {
            this.limparCarrinho();
        }
    }

    atualizarContadorCarrinho() {
        const contador = document.getElementById('cart-count');
        if (contador) {
            const totalItens = this.carrinho.reduce((total, item) => total + item.quantidade, 0);
            contador.textContent = totalItens;
            contador.style.display = totalItens > 0 ? 'flex' : 'none';
        }
    }

    mostrarNotificacao(mensagem, tipo = 'info') {
        // ... (código original sem alterações)
    }

    getIconePorTipo(tipo) {
        const icones = { 'sucesso': '✅', 'erro': '❌', 'info': 'ℹ️', 'aviso': '⚠️' };
        return icones[tipo] || icones.info;
    }
}

// Inicializar carrinho
let carrinho;
document.addEventListener('DOMContentLoaded', () => {
    carrinho = new CarrinhoManager();
});

// API pública para outras páginas
window.CarrinhoAPI = {
    // ... (código original sem alterações)
};

// Adicionar animações CSS dinamicamente (com nome único)
const carrinhoAnimationStyle = document.createElement('style');
carrinhoAnimationStyle.textContent = `
    @keyframes slideIn { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
    @keyframes slideOut { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(100%); } }
`;
document.head.appendChild(carrinhoAnimationStyle);
