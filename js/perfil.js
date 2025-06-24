/* filepath: c:\Users\janic\OneDrive\Área de Trabalho\Projetos\loja_dev\js\perfil.js */
// Sistema de Perfil do Usuário

class PerfilManager {
    constructor() {
        this.currentUser = null;
        this.currentTab = 'dados-pessoais';
        this.enderecos = [];
        this.pedidos = [];
        this.favoritos = [];
        this.cupons = [];
        
        this.init();
    }

    init() {
        // Verificar autenticação
        this.checkAuth();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Carregar dados do usuário
        this.loadUserData();
        
        // Carregar dados iniciais
        this.loadInitialData();
    }

    // Verificar se usuário está logado
    checkAuth() {
        if (window.AuthAPI && window.AuthAPI.isLoggedIn()) {
            this.currentUser = window.AuthAPI.getCurrentUser();
        } else {
            // Redirecionar para login
            window.location.href = '../pages/login.html?redirect=' + encodeURIComponent(window.location.pathname);
        }
    }

    // Configurar event listeners
    setupEventListeners() {
        // Navegação entre tabs
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const tab = e.currentTarget.getAttribute('data-tab');
                if (tab && tab !== 'logout') {
                    this.switchTab(tab);
                }
            });
        });

        // Logout
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            this.handleLogout();
        });

        // Upload de avatar
        document.getElementById('upload-avatar')?.addEventListener('click', () => {
            document.getElementById('avatar-input').click();
        });

        document.getElementById('avatar-input')?.addEventListener('change', (e) => {
            this.handleAvatarUpload(e);
        });

        // Formulário de dados pessoais
        document.getElementById('dados-pessoais-form')?.addEventListener('submit', (e) => {
            this.handleProfileUpdate(e);
        });

        // Toggle de senhas
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', () => this.togglePassword(btn));
        });

        // Endereços
        document.getElementById('add-endereco')?.addEventListener('click', () => {
            this.openAddressModal();
        });

        document.getElementById('endereco-form')?.addEventListener('submit', (e) => {
            this.handleAddressSubmit(e);
        });

        document.getElementById('endereco-modal-close')?.addEventListener('click', () => {
            this.closeAddressModal();
        });

        document.getElementById('buscar-endereco-cep')?.addEventListener('click', () => {
            this.searchAddressByCEP();
        });

        // Filtros
        document.getElementById('status-filter')?.addEventListener('change', (e) => {
            this.filterOrders(e.target.value);
        });

        // Ações diversas
        document.getElementById('clear-favoritos')?.addEventListener('click', () => {
            this.clearFavorites();
        });

        document.getElementById('delete-account')?.addEventListener('click', () => {
            this.confirmDeleteAccount();
        });

        // Configurações
        this.setupConfigurationToggles();
    }

    // Carregar dados do usuário na interface
    loadUserData() {
        if (!this.currentUser) return;

        // Header do perfil
        document.getElementById('user-name').textContent = 
            `${this.currentUser.nome} ${this.currentUser.sobrenome || ''}`.trim();
        document.getElementById('user-email').textContent = this.currentUser.email;
        
        const memberSince = this.currentUser.registrationTime ? 
            new Date(this.currentUser.registrationTime).getFullYear() : 
            new Date().getFullYear();
        document.getElementById('member-since').textContent = memberSince;

        // Formulário de dados pessoais
        document.getElementById('nome').value = this.currentUser.nome || '';
        document.getElementById('sobrenome').value = this.currentUser.sobrenome || '';
        document.getElementById('email').value = this.currentUser.email || '';
        document.getElementById('telefone').value = this.currentUser.telefone || '';
        document.getElementById('cpf').value = this.currentUser.cpf || '';
        document.getElementById('data-nascimento').value = this.currentUser.dataNascimento || '';
    }

    // Carregar dados iniciais
    loadInitialData() {
        this.loadAddresses();
        this.loadOrders();
        this.loadFavorites();
        this.loadCoupons();
        this.updateCounts();
    }

    // Navegação entre tabs
    switchTab(tabName) {
        // Remover classe active de todos os menus e tabs
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Ativar menu e tab atual
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
        document.getElementById(`${tabName}-tab`)?.classList.add('active');

        this.currentTab = tabName;

        // Carregar dados específicos da tab se necessário
        this.loadTabData(tabName);
    }

    // Carregar dados específicos da tab
    loadTabData(tabName) {
        switch(tabName) {
            case 'pedidos':
                this.renderOrders();
                break;
            case 'enderecos':
                this.renderAddresses();
                break;
            case 'favoritos':
                this.renderFavorites();
                break;
            case 'cupons':
                this.renderCoupons();
                break;
        }
    }

    // Logout
    handleLogout() {
        if (confirm('Tem certeza que deseja sair?')) {
            if (window.AuthAPI) {
                window.AuthAPI.logout();
            }
            window.location.href = '../index.html';
        }
    }

    // Upload de avatar
    handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validar arquivo
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione apenas arquivos de imagem.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB
            alert('A imagem deve ter no máximo 5MB.');
            return;
        }

        // Criar preview
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('user-avatar').src = e.target.result;
            // Aqui você salvaria a imagem no servidor/localStorage
            this.saveAvatar(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    saveAvatar(dataUrl) {
        // Salvar no localStorage (em produção seria enviado para servidor)
        localStorage.setItem(`avatar_${this.currentUser.id}`, dataUrl);
        this.showNotification('Avatar atualizado com sucesso!', 'success');
    }

    // Atualizar perfil
    handleProfileUpdate(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const updatedData = Object.fromEntries(formData);

        // Validar dados
        if (!this.validateProfileData(updatedData)) return;

        // Simular salvamento
        this.currentUser = { ...this.currentUser, ...updatedData };
        
        // Salvar no localStorage (em produção seria enviado para servidor)
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

        this.showNotification('Perfil atualizado com sucesso!', 'success');
        this.loadUserData(); // Recarregar dados na interface
    }

    validateProfileData(data) {
        // Validações básicas
        if (!data.nome || data.nome.trim().length < 2) {
            this.showNotification('Nome deve ter pelo menos 2 caracteres.', 'error');
            return false;
        }

        if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            this.showNotification('Email inválido.', 'error');
            return false;
        }

        // Validar mudança de senha se fornecida
        if (data.novaSenha) {
            if (!data.senhaAtual) {
                this.showNotification('Senha atual é obrigatória para alterar a senha.', 'error');
                return false;
            }

            if (data.novaSenha.length < 6) {
                this.showNotification('Nova senha deve ter pelo menos 6 caracteres.', 'error');
                return false;
            }
        }

        return true;
    }

    // Toggle de senha
    togglePassword(button) {
        const targetId = button.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const img = button.querySelector('img');
        
        if (input.type === 'password') {
            input.type = 'text';
            img.src = '../assets/icons/eye-off.svg';
        } else {
            input.type = 'password';
            img.src = '../assets/icons/eye.svg';
        }
    }

    // === GERENCIAMENTO DE ENDEREÇOS ===
    
    loadAddresses() {
        const stored = localStorage.getItem(`enderecos_${this.currentUser.id}`);
        this.enderecos = stored ? JSON.parse(stored) : [];
    }

    saveAddresses() {
        localStorage.setItem(`enderecos_${this.currentUser.id}`, JSON.stringify(this.enderecos));
        this.updateCounts();
    }

    openAddressModal(address = null) {
        const modal = document.getElementById('endereco-modal');
        const title = document.getElementById('endereco-modal-title');
        const form = document.getElementById('endereco-form');
        
        if (address) {
            title.textContent = 'Editar Endereço';
            this.fillAddressForm(address);
        } else {
            title.textContent = 'Novo Endereço';
            form.reset();
            document.getElementById('endereco-id').value = '';
        }
        
        modal.classList.add('active');
    }

    closeAddressModal() {
        document.getElementById('endereco-modal').classList.remove('active');
    }

    fillAddressForm(address) {
        Object.keys(address).forEach(key => {
            const input = document.getElementById(`endereco-${key}`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = address[key];
                } else {
                    input.value = address[key];
                }
            }
        });
    }

    handleAddressSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const addressData = Object.fromEntries(formData);
        
        // Converter checkbox
        addressData.principal = document.getElementById('endereco-principal').checked;
        
        const addressId = addressData.id;
        delete addressData.id;

        if (addressId) {
            // Editar endereço existente
            const index = this.enderecos.findIndex(addr => addr.id === addressId);
            if (index !== -1) {
                this.enderecos[index] = { ...addressData, id: addressId };
            }
        } else {
            // Novo endereço
            addressData.id = Date.now().toString();
            this.enderecos.push(addressData);
        }

        // Se marcou como principal, desmarcar outros
        if (addressData.principal) {
            this.enderecos.forEach(addr => {
                if (addr.id !== addressData.id) {
                    addr.principal = false;
                }
            });
        }

        this.saveAddresses();
        this.renderAddresses();
        this.closeAddressModal();
        
        this.showNotification(
            addressId ? 'Endereço atualizado!' : 'Endereço adicionado!', 
            'success'
        );
    }

    async searchAddressByCEP() {
        const cep = document.getElementById('endereco-cep').value.replace(/\D/g, '');
        
        if (cep.length !== 8) {
            this.showNotification('CEP deve ter 8 dígitos.', 'error');
            return;
        }

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            
            if (data.erro) {
                this.showNotification('CEP não encontrado.', 'error');
                return;
            }

            // Preencher campos
            document.getElementById('endereco-endereco').value = data.logradouro || '';
            document.getElementById('endereco-bairro').value = data.bairro || '';
            document.getElementById('endereco-cidade').value = data.localidade || '';
            
            this.showNotification('Endereço encontrado!', 'success');
            
        } catch (error) {
            this.showNotification('Erro ao buscar CEP.', 'error');
        }
    }

    renderAddresses() {
        const container = document.getElementById('enderecos-list');
        const emptyState = document.getElementById('enderecos-empty');
        
        if (this.enderecos.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        container.style.display = 'grid';
        emptyState.style.display = 'none';
        
        container.innerHTML = this.enderecos.map(endereco => `
            <div class="endereco-card">
                <div class="endereco-header">
                    <h4>${endereco.nome}</h4>
                    ${endereco.principal ? '<span class="endereco-badge">Principal</span>' : ''}
                </div>
                <div class="endereco-info">
                    <p>${endereco.endereco}, ${endereco.numero}</p>
                    ${endereco.complemento ? `<p>${endereco.complemento}</p>` : ''}
                    <p>${endereco.bairro} - ${endereco.cidade}</p>
                    <p>CEP: ${endereco.cep}</p>
                </div>
                <div class="endereco-actions">
                    <button class="btn-edit" onclick="perfilManager.editAddress('${endereco.id}')">
                        Editar
                    </button>
                    <button class="btn-delete" onclick="perfilManager.deleteAddress('${endereco.id}')">
                        Excluir
                    </button>
                </div>
            </div>
        `).join('');
    }

    editAddress(id) {
        const address = this.enderecos.find(addr => addr.id === id);
        if (address) {
            this.openAddressModal(address);
        }
    }

    deleteAddress(id) {
        if (confirm('Tem certeza que deseja excluir este endereço?')) {
            this.enderecos = this.enderecos.filter(addr => addr.id !== id);
            this.saveAddresses();
            this.renderAddresses();
            this.showNotification('Endereço excluído!', 'success');
        }
    }

    // === GERENCIAMENTO DE PEDIDOS ===
    
    loadOrders() {
        // Simular pedidos (em produção viria do servidor)
        const stored = localStorage.getItem(`pedidos_${this.currentUser.id}`);
        this.pedidos = stored ? JSON.parse(stored) : this.generateSampleOrders();
    }

    generateSampleOrders() {
        return [
            {
                id: 'PED001',
                data: new Date('2024-01-15').toISOString(),
                status: 'entregue',
                total: 299.90,
                itens: [
                    { nome: 'Camiseta React Developer', preco: 79.90, quantidade: 1 },
                    { nome: 'Caneca JavaScript Coffee', preco: 39.90, quantidade: 2 },
                    { nome: 'Mousepad Geek Code', preco: 89.90, quantidade: 2 }
                ]
            },
            {
                id: 'PED002',
                data: new Date('2024-02-20').toISOString(),
                status: 'enviado',
                total: 159.80,
                itens: [
                    { nome: 'Livro Clean Code', preco: 119.90, quantidade: 1 },
                    { nome: 'Adesivos Git Commits', preco: 19.90, quantidade: 2 }
                ]
            }
        ];
    }

    renderOrders() {
        const container = document.getElementById('pedidos-list');
        const emptyState = document.getElementById('pedidos-empty');
        
        if (this.pedidos.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        container.style.display = 'block';
        emptyState.style.display = 'none';
        
        container.innerHTML = this.pedidos.map(pedido => `
            <div class="pedido-card">
                <div class="pedido-header">
                    <div class="pedido-info">
                        <h4>Pedido #${pedido.id}</h4>
                        <p>Data: ${this.formatDate(pedido.data)}</p>
                    </div>
                    <div class="pedido-status">
                        <span class="status-badge ${pedido.status}">${this.getStatusText(pedido.status)}</span>
                        <span class="pedido-total">${this.formatCurrency(pedido.total)}</span>
                    </div>
                </div>
                <div class="pedido-itens">
                    ${pedido.itens.map(item => `
                        <div class="pedido-item">
                            <span>${item.nome}</span>
                            <span>${item.quantidade}x ${this.formatCurrency(item.preco)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="pedido-actions">
                    <button class="btn-secondary" onclick="perfilManager.viewOrder('${pedido.id}')">
                        Ver Detalhes
                    </button>
                    ${pedido.status === 'pendente' ? `
                        <button class="btn-danger" onclick="perfilManager.cancelOrder('${pedido.id}')">
                            Cancelar
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    filterOrders(status) {
        // Implementar filtro de pedidos
        const filteredOrders = status ? 
            this.pedidos.filter(pedido => pedido.status === status) : 
            this.pedidos;
        
        // Re-renderizar com pedidos filtrados
        // (implementação simplificada)
        this.renderOrders();
    }

    getStatusText(status) {
        const statusMap = {
            'pendente': 'Pendente',
            'confirmado': 'Confirmado',
            'enviado': 'Enviado',
            'entregue': 'Entregue',
            'cancelado': 'Cancelado'
        };
        return statusMap[status] || status;
    }

    // === GERENCIAMENTO DE FAVORITOS ===
    
    loadFavorites() {
        const stored = localStorage.getItem('favoritos');
        this.favoritos = stored ? JSON.parse(stored) : [];
    }

    renderFavorites() {
        const container = document.getElementById('favoritos-list');
        const emptyState = document.getElementById('favoritos-empty');
        
        if (this.favoritos.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        container.style.display = 'grid';
        emptyState.style.display = 'none';
        
        container.innerHTML = this.favoritos.map(produto => `
            <div class="favorito-card">
                <img src="${produto.imagem}" alt="${produto.nome}">
                <div class="favorito-info">
                    <h4>${produto.nome}</h4>
                    <p class="favorito-preco">${this.formatCurrency(produto.preco)}</p>
                </div>
                <div class="favorito-actions">
                    <button class="btn-primary" onclick="perfilManager.addToCart('${produto.id}')">
                        Adicionar ao Carrinho
                    </button>
                    <button class="btn-remove" onclick="perfilManager.removeFavorite('${produto.id}')">
                        ❤️
                    </button>
                </div>
            </div>
        `).join('');
    }

    clearFavorites() {
        if (confirm('Tem certeza que deseja limpar todos os favoritos?')) {
            this.favoritos = [];
            localStorage.setItem('favoritos', JSON.stringify(this.favoritos));
            this.renderFavorites();
            this.updateCounts();
            this.showNotification('Lista de favoritos limpa!', 'success');
        }
    }

    // === GERENCIAMENTO DE CUPONS ===
    
    loadCoupons() {
        // Simular cupons disponíveis
        this.cupons = [
            {
                id: 'BEMVINDO20',
                descricao: '20% de desconto',
                codigo: 'BEMVINDO20',
                desconto: 20,
                tipo: 'percentual',
                valido: true,
                expira: new Date('2024-12-31').toISOString()
            },
            {
                id: 'FRETE10',
                descricao: 'R$ 10 de desconto no frete',
                codigo: 'FRETE10',
                desconto: 10,
                tipo: 'valor',
                valido: true,
                expira: new Date('2024-06-30').toISOString()
            }
        ];
    }

    renderCoupons() {
        const container = document.getElementById('cupons-list');
        const emptyState = document.getElementById('cupons-empty');
        
        if (this.cupons.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        container.style.display = 'grid';
        emptyState.style.display = 'none';
        
        container.innerHTML = this.cupons.map(cupom => `
            <div class="cupom-card ${!cupom.valido ? 'usado' : ''}">
                <div class="cupom-header">
                    <h4>${cupom.descricao}</h4>
                    <span class="cupom-codigo">${cupom.codigo}</span>
                </div>
                <div class="cupom-info">
                    <p>Válido até: ${this.formatDate(cupom.expira)}</p>
                    <p class="cupom-desconto">
                        ${cupom.tipo === 'percentual' ? cupom.desconto + '%' : this.formatCurrency(cupom.desconto)}
                    </p>
                </div>
                <div class="cupom-actions">
                    ${cupom.valido ? `
                        <button class="btn-primary" onclick="perfilManager.copyCoupon('${cupom.codigo}')">
                            Copiar Código
                        </button>
                    ` : `
                        <span class="cupom-usado">Já utilizado</span>
                    `}
                </div>
            </div>
        `).join('');
    }

    copyCoupon(codigo) {
        navigator.clipboard.writeText(codigo).then(() => {
            this.showNotification(`Código ${codigo} copiado!`, 'success');
        });
    }

    // === CONFIGURAÇÕES ===
    
    setupConfigurationToggles() {
        // Carregar configurações salvas
        const configs = JSON.parse(localStorage.getItem(`configs_${this.currentUser.id}`)) || {};
        
        // Aplicar configurações aos toggles
        Object.keys(configs).forEach(key => {
            const toggle = document.getElementById(key);
            if (toggle) {
                toggle.checked = configs[key];
            }
        });

        // Salvar mudanças
        document.querySelectorAll('.config-toggle input').forEach(toggle => {
            toggle.addEventListener('change', () => {
                this.saveConfiguration(toggle.id, toggle.checked);
            });
        });
    }

    saveConfiguration(key, value) {
        const configs = JSON.parse(localStorage.getItem(`configs_${this.currentUser.id}`)) || {};
        configs[key] = value;
        localStorage.setItem(`configs_${this.currentUser.id}`, JSON.stringify(configs));
        
        this.showNotification('Configuração salva!', 'success');
    }

    // === UTILITÁRIOS ===
    
    updateCounts() {
        document.getElementById('enderecos-count').textContent = this.enderecos.length;
        document.getElementById('pedidos-count').textContent = this.pedidos.length;
        document.getElementById('favoritos-count').textContent = this.favoritos.length;
        document.getElementById('cupons-count').textContent = this.cupons.filter(c => c.valido).length;
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    formatDate(dateString) {
        return new Intl.DateTimeFormat('pt-BR').format(new Date(dateString));
    }

    showNotification(message, type = 'info') {
        // Usar sistema de notificações do main.js se disponível
        if (window.MainAPI && window.MainAPI.showNotification) {
            window.MainAPI.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    // Confirmar exclusão de conta
    confirmDeleteAccount() {
        const confirmation = prompt(
            'Esta ação é irreversível. Digite "EXCLUIR" para confirmar:'
        );
        
        if (confirmation === 'EXCLUIR') {
            // Remover todos os dados do usuário
            localStorage.removeItem('currentUser');
            localStorage.removeItem(`enderecos_${this.currentUser.id}`);
            localStorage.removeItem(`pedidos_${this.currentUser.id}`);
            localStorage.removeItem(`configs_${this.currentUser.id}`);
            localStorage.removeItem(`avatar_${this.currentUser.id}`);
            
            alert('Conta excluída com sucesso.');
            window.location.href = '../index.html';
        }
    }

    // APIs públicas
    addToCart(productId) {
        // Integrar com sistema de carrinho
        if (window.carrinho) {
            // Encontrar produto nos favoritos
            const produto = this.favoritos.find(p => p.id === productId);
            if (produto) {
                window.carrinho.adicionarItem(produto);
                this.showNotification('Produto adicionado ao carrinho!', 'success');
            }
        }
    }

    removeFavorite(productId) {
        this.favoritos = this.favoritos.filter(p => p.id !== productId);
        localStorage.setItem('favoritos', JSON.stringify(this.favoritos));
        this.renderFavorites();
        this.updateCounts();
        this.showNotification('Produto removido dos favoritos!', 'success');
    }

    viewOrder(orderId) {
        // Implementar visualização detalhada do pedido
        alert(`Ver detalhes do pedido ${orderId}`);
    }

    cancelOrder(orderId) {
        if (confirm('Tem certeza que deseja cancelar este pedido?')) {
            const order = this.pedidos.find(p => p.id === orderId);
            if (order) {
                order.status = 'cancelado';
                this.renderOrders();
                this.showNotification('Pedido cancelado!', 'success');
            }
        }
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.perfilManager = new PerfilManager();
});