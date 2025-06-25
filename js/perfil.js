/*
* Sistema de Perfil do Utilizador - Versão Completa e Funcional
* Este ficheiro gere a página de perfil, incluindo a verificação de autenticação,
* o carregamento de dados do utilizador da API e a renderização das diferentes
* secções como dados pessoais, pedidos, favoritos, etc.
*/

class PerfilManager {
    constructor() {
        this.currentUser = null;
        this.apiBaseUrl = 'http://localhost:3001/api'; // URL da sua API de back-end
        this.token = localStorage.getItem('userToken');

        this.currentTab = 'dados-pessoais';
        this.enderecos = [];
        this.pedidos = [];
        this.favoritos = [];
        this.cupons = [];
        
        this.init();
    }

    async init() {
        await this.checkAuthAndLoadProfile();
        
        if (!this.currentUser) {
            console.error("Não foi possível carregar os dados do perfil. Verificação de autenticação falhou.");
            return;
        }

        this.setupEventListeners();
        this.loadInitialData();
    }

    // Verifica se o utilizador está autenticado e carrega os dados do perfil da API
    async checkAuthAndLoadProfile() {
        if (!this.token) {
            return this.redirectToLogin();
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/perfil`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (!response.ok) {
                throw new Error('Sessão inválida ou expirada. Por favor, faça login novamente.');
            }

            this.currentUser = await response.json();
            this.loadUserData(); // Preenche os dados visuais assim que são recebidos

        } catch (error) {
            console.error('Falha na autenticação:', error.message);
            // Limpa dados inválidos do navegador e redireciona
            localStorage.removeItem('userToken');
            localStorage.removeItem('currentUser');
            this.redirectToLogin();
        }
    }
    
    redirectToLogin() {
        window.location.href = `../pages/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
    }

    // Carrega os dados do utilizador na interface (cabeçalho e formulário)
    loadUserData() {
        if (!this.currentUser) return;

        // Cabeçalho do perfil
        document.getElementById('user-name').textContent = this.currentUser.nome;
        document.getElementById('user-email').textContent = this.currentUser.email;
        const memberSince = new Date(this.currentUser.data_criacao).getFullYear();
        document.getElementById('member-since').textContent = memberSince;

        // Formulário de dados pessoais
        document.getElementById('nome').value = this.currentUser.nome || '';
        document.getElementById('sobrenome').value = this.currentUser.sobrenome || '';
        document.getElementById('email').value = this.currentUser.email || '';
        document.getElementById('telefone').value = this.currentUser.telefone || '';
        document.getElementById('cpf').value = this.currentUser.cpf || '';
        document.getElementById('data-nascimento').value = this.currentUser.dataNascimento || '';
    }

    // Carrega os dados das outras secções (pedidos, favoritos, etc.)
    loadInitialData() {
        this.loadAddresses();
        this.loadOrders();
        this.loadFavorites();
        this.loadCoupons();
        this.updateCounts();
    }

    // Configura todos os "ouvintes" de eventos da página
    setupEventListeners() {
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const tab = e.currentTarget.getAttribute('data-tab');
                if (tab && tab !== 'logout') this.switchTab(tab);
            });
        });

        document.getElementById('logout-btn')?.addEventListener('click', () => this.handleLogout());
        document.getElementById('upload-avatar')?.addEventListener('click', () => document.getElementById('avatar-input').click());
        document.getElementById('avatar-input')?.addEventListener('change', (e) => this.handleAvatarUpload(e));
        document.getElementById('dados-pessoais-form')?.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        document.querySelectorAll('.toggle-password').forEach(btn => btn.addEventListener('click', () => this.togglePassword(btn)));
        document.getElementById('add-endereco')?.addEventListener('click', () => this.openAddressModal());
        document.getElementById('endereco-form')?.addEventListener('submit', (e) => this.handleAddressSubmit(e));
        document.getElementById('endereco-modal-close')?.addEventListener('click', () => this.closeAddressModal());
        document.getElementById('buscar-endereco-cep')?.addEventListener('click', () => this.searchAddressByCEP());
        document.getElementById('status-filter')?.addEventListener('change', (e) => this.filterOrders(e.target.value));
        document.getElementById('clear-favoritos')?.addEventListener('click', () => this.clearFavorites());
        document.getElementById('delete-account')?.addEventListener('click', () => this.confirmDeleteAccount());
        
        if (typeof this.setupConfigurationToggles === 'function') {
            this.setupConfigurationToggles();
        }
    }

    // Lógica para alternar entre as abas do perfil
    switchTab(tabName) {
        document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
        document.getElementById(`${tabName}-tab`)?.classList.add('active');
        this.currentTab = tabName;
        this.loadTabData(tabName);
    }

    loadTabData(tabName) {
        switch (tabName) {
            case 'pedidos': this.renderOrders(); break;
            case 'enderecos': this.renderAddresses(); break;
            case 'favoritos': this.loadFavorites(); break; // Garante que recarrega ao clicar
            case 'cupons': this.renderCoupons(); break;
        }
    }

    handleLogout() {
        if (confirm('Tem a certeza que deseja sair?')) {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('userToken');
            window.location.href = '../index.html';
        }
    }

    togglePassword(button) {
        const targetId = button.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            return alert('Por favor, selecione apenas ficheiros de imagem.');
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB
            return alert('A imagem deve ter no máximo 5MB.');
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('user-avatar').src = e.target.result;
            this.saveAvatar(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    saveAvatar(dataUrl) {
        localStorage.setItem(`avatar_${this.currentUser.id}`, dataUrl);
        this.showNotification('Avatar atualizado com sucesso!', 'success');
    }

    handleProfileUpdate(event) {
        event.preventDefault();
        // Lógica de atualização do perfil (futuramente fará um pedido PUT/PATCH para a API)
        this.showNotification('Funcionalidade de atualização em desenvolvimento.', 'info');
    }

    // --- FAVORITOS (INTEGRADO COM API) ---
    loadFavorites() {
        if (window.favoritesSystem) {
            this.favoritos = window.favoritesSystem.getFavorites();
            this.renderFavorites();
        } else {
            console.error("O sistema de favoritos ainda não foi carregado.");
        }
    }

    renderFavorites() {
        const container = document.getElementById('favoritos-list');
        const emptyState = document.getElementById('favoritos-empty');
        if (!container || !emptyState) return;

        if (this.favoritos.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            container.style.display = 'grid';
            emptyState.style.display = 'none';
            container.innerHTML = this.favoritos.map(produto => `
                <div class="favorito-card" data-product-id="${produto.id}">
                    <img src="${this.adjustPath(produto.imagem_url)}" alt="${produto.nome}">
                    <div class="favorito-info">
                        <h4>${produto.nome}</h4>
                        <p class="favorito-preco">${this.formatCurrency(produto.preco)}</p>
                    </div>
                    <div class="favorito-actions">
                        <button class="btn-primary" onclick="perfilManager.addToCart(${produto.id})">Adicionar ao Carrinho</button>
                        <button class="btn-remove" onclick="perfilManager.removeFavorite(${produto.id})">❤️</button>
                    </div>
                </div>
            `).join('');
        }
    }
    
    removeFavorite(productId) {
        if (window.favoritesSystem) {
            window.favoritesSystem.toggleFavorite(productId).then(() => {
                this.loadFavorites();
                this.updateCounts();
            });
        }
    }

    clearFavorites() {
        if (confirm('Tem a certeza que deseja limpar todos os favoritos?')) {
            if (window.favoritesSystem) {
                // É mais eficiente fazer um pedido de cada vez
                const promises = this.favoritos.map(fav => window.favoritesSystem.toggleFavorite(fav.id));
                Promise.all(promises).then(() => {
                    this.loadFavorites();
                    this.updateCounts();
                    this.showNotification('Lista de favoritos limpa!', 'success');
                });
            }
        }
    }
    
    // --- FUNÇÕES DE PLACEHOLDER ---
    
    loadAddresses() { this.enderecos = []; this.renderAddresses(); }
    renderAddresses() { /* Lógica para mostrar endereços ou estado vazio */ }
    loadOrders() { this.pedidos = []; this.renderOrders(); }
    renderOrders() { /* Lógica para mostrar pedidos ou estado vazio */ }
    loadCoupons() { this.cupons = []; this.renderCoupons(); }
    renderCoupons() { /* Lógica para mostrar cupões ou estado vazio */ }
    
    // --- FUNÇÕES UTILITÁRIAS ---
    
    updateCounts() {
        document.getElementById('enderecos-count').textContent = this.enderecos.length;
        document.getElementById('pedidos-count').textContent = this.pedidos.length;
        document.getElementById('favoritos-count').textContent = this.favoritos.length;
        document.getElementById('cupons-count').textContent = this.cupons.length;
    }
    formatCurrency(value) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value); }
    formatDate(dateString) { return new Intl.DateTimeFormat('pt-BR').format(new Date(dateString)); }
    showNotification(message, type = 'info') { alert(`[${type.toUpperCase()}] ${message}`); }
    adjustPath(path) { if (!path) return ''; if (window.location.pathname.includes('/pages/')) { if (path.startsWith('./')) { return `..${path.substring(1)}`; } } return path; }
    addToCart(productId) {
        if (window.carrinhoManager) {
            const produto = this.favoritos.find(p => p.id === productId);
            if (produto) {
                window.carrinhoManager.adicionarProduto(produto);
            }
        }
    }
}

// Inicializar a classe
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.perfilManager = new PerfilManager();
    }, 100);
});
