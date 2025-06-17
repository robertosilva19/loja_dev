class PerfilPage {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.enderecos = JSON.parse(localStorage.getItem('enderecos')) || [];
        this.pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
        this.favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
        this.configuracoes = JSON.parse(localStorage.getItem('configuracoes')) || this.getDefaultConfig();
        this.currentTab = 'dados-pessoais';
        this.editingEndereco = null;
        this.init();
    }

    init() {
        // Verificar se usuário está logado
        if (!this.currentUser) {
            window.location.href = '../pages/login.html';
            return;
        }

        this.setupEventListeners();
        this.loadUserData();
        this.updateCounts();
        this.updateCartCount();
        this.loadAvatar();
        this.generateMockData(); // Para demonstração
    }

    setupEventListeners() {
        // Menu lateral
        document.querySelectorAll('.menu-item:not(.logout-btn)').forEach(item => {
            item.addEventListener('click', () => {
                const tabName = item.dataset.tab;
                if (tabName) {
                    this.switchTab(tabName);
                }
            });
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // Upload de avatar
        document.getElementById('upload-avatar').addEventListener('click', () => {
            document.getElementById('avatar-input').click();
        });

        document.getElementById('avatar-input').addEventListener('change', (e) => {
            this.handleAvatarUpload(e);
        });

        // Formulário de dados pessoais
        document.getElementById('dados-pessoais-form').addEventListener('submit', (e) => {
            this.handleUpdateProfile(e);
        });

        // Toggles de senha
        document.querySelectorAll('.toggle-password').forEach(toggle => {
            toggle.addEventListener('click', () => {
                this.togglePassword(toggle);
            });
        });

        // Endereços
        document.getElementById('add-endereco').addEventListener('click', () => {
            this.openEnderecoModal();
        });

        document.getElementById('endereco-form').addEventListener('submit', (e) => {
            this.handleSaveEndereco(e);
        });

        document.getElementById('buscar-endereco-cep').addEventListener('click', () => {
            this.buscarCEP();
        });

        // Modal de endereço
        document.getElementById('endereco-modal-close').addEventListener('click', () => {
            this.closeEnderecoModal();
        });

        document.querySelector('#endereco-modal .modal__overlay').addEventListener('click', () => {
            this.closeEnderecoModal();
        });

        // Configurações
        document.querySelectorAll('.config-toggle input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateConfig();
            });
        });

        // Deletar conta
        document.getElementById('delete-account').addEventListener('click', () => {
            this.deleteAccount();
        });

        // Filtros
        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.filterPedidos();
            });
        }

        // Favoritos
        const clearFavoritos = document.getElementById('clear-favoritos');
        if (clearFavoritos) {
            clearFavoritos.addEventListener('click', () => {
                this.clearFavoritos();
            });
        }

        // Máscara de telefone
        const telefoneInput = document.getElementById('telefone');
        if (telefoneInput) {
            telefoneInput.addEventListener('input', (e) => {
                this.applyPhoneMask(e.target);
            });
        }

        // CEP mask
        const cepInput = document.getElementById('endereco-cep');
        if (cepInput) {
            cepInput.addEventListener('input', (e) => {
                this.applyCepMask(e.target);
            });
        }
    }

    switchTab(tabName) {
        // Update active menu item
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.currentTab = tabName;

        // Load tab-specific data
        switch (tabName) {
            case 'enderecos':
                this.loadEnderecos();
                break;
            case 'pedidos':
                this.loadPedidos();
                break;
            case 'favoritos':
                this.loadFavoritos();
                break;
            case 'cupons':
                this.loadCupons();
                break;
            case 'configuracoes':
                this.loadConfiguracoes();
                break;
        }
    }

    loadUserData() {
        // Header do usuário
        document.getElementById('user-name').textContent = `${this.currentUser.nome} ${this.currentUser.sobrenome}`;
        document.getElementById('user-email').textContent = this.currentUser.email;
        
        // Data de cadastro
        const createdDate = new Date(this.currentUser.createdAt || Date.now());
        document.getElementById('member-since').textContent = createdDate.getFullYear();

        // Formulário de dados pessoais
        document.getElementById('nome').value = this.currentUser.nome || '';
        document.getElementById('sobrenome').value = this.currentUser.sobrenome || '';
        document.getElementById('email').value = this.currentUser.email || '';
        document.getElementById('telefone').value = this.currentUser.telefone || '';
        document.getElementById('cpf').value = this.currentUser.cpf || '';
        document.getElementById('data-nascimento').value = this.currentUser.dataNascimento || '';

        // Update auth state in header
        this.updateHeaderAuth();
    }

    updateHeaderAuth() {
        const loginLink = document.querySelector('.cabecalho__nav_list_link-login');
        if (loginLink) {
            loginLink.textContent = `Olá, ${this.currentUser.nome}`;
            loginLink.href = './perfil.html';
        }
    }

    async handleUpdateProfile(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const senhaAtual = formData.get('senhaAtual');
        const novaSenha = formData.get('novaSenha');

        // Validar senha atual se estiver tentando alterar
        if (novaSenha && senhaAtual !== this.currentUser.password) {
            this.showMessage('Senha atual incorreta', 'error');
            return;
        }

        // Criar objeto com dados atualizados
        const updatedUser = {
            ...this.currentUser,
            nome: formData.get('nome'),
            sobrenome: formData.get('sobrenome'),
            email: formData.get('email'),
            telefone: formData.get('telefone'),
            dataNascimento: formData.get('dataNascimento'),
            updatedAt: new Date().toISOString()
        };

        // Atualizar senha se fornecida
        if (novaSenha) {
            updatedUser.password = novaSenha;
        }

        try {
            // Simular delay de API
            await this.delay(1000);

            // Atualizar usuário atual
            this.currentUser = updatedUser;
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

            // Atualizar na lista de usuários
            const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
            if (userIndex !== -1) {
                this.users[userIndex] = updatedUser;
                localStorage.setItem('users', JSON.stringify(this.users));
            }

            // Atualizar interface
            this.loadUserData();
            this.showMessage('Perfil atualizado com sucesso!', 'success');

            // Limpar campos de senha
            document.getElementById('senha-atual').value = '';
            document.getElementById('nova-senha').value = '';

        } catch (error) {
            this.showMessage('Erro ao atualizar perfil', 'error');
        }
    }

    handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
            this.showMessage('Por favor, selecione uma imagem válida', 'error');
            return;
        }

        // Validar tamanho (máximo 2MB)
        if (file.size > 2 * 1024 * 1024) {
            this.showMessage('Imagem muito grande. Máximo 2MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            
            // Salvar avatar
            localStorage.setItem(`avatar_${this.currentUser.id}`, dataUrl);
            
            // Atualizar interface
            document.getElementById('user-avatar').src = dataUrl;
            
            this.showMessage('Avatar atualizado com sucesso!', 'success');
        };
        
        reader.readAsDataURL(file);
    }

    loadAvatar() {
        const savedAvatar = localStorage.getItem(`avatar_${this.currentUser.id}`);
        if (savedAvatar) {
            document.getElementById('user-avatar').src = savedAvatar;
        }
    }

    // Endereços
    loadEnderecos() {
        const userEnderecos = this.enderecos.filter(e => e.userId === this.currentUser.id);
        const container = document.getElementById('enderecos-list');
        const emptyState = document.getElementById('enderecos-empty');

        if (userEnderecos.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        container.style.display = 'grid';
        emptyState.style.display = 'none';
        container.innerHTML = '';

        userEnderecos.forEach(endereco => {
            const enderecoCard = this.createEnderecoCard(endereco);
            container.appendChild(enderecoCard);
        });
    }

    createEnderecoCard(endereco) {
        const card = document.createElement('div');
        card.className = `endereco-card ${endereco.principal ? 'principal' : ''}`;
        card.innerHTML = `
            <div class="card-header">
                <h3 class="card-title">${endereco.nome}</h3>
                <div class="card-actions">
                    <button class="card-btn edit" onclick="perfilPage.editEndereco(${endereco.id})">
                        <img src="../assets/icons/edit.svg" alt="Editar">
                    </button>
                    <button class="card-btn delete" onclick="perfilPage.deleteEndereco(${endereco.id})">
                        <img src="../assets/icons/trash.svg" alt="Excluir">
                    </button>
                </div>
            </div>
            <div class="endereco-info">
                <p><strong>${endereco.endereco}, ${endereco.numero}</strong></p>
                ${endereco.complemento ? `<p>${endereco.complemento}</p>` : ''}
                <p>${endereco.bairro} - ${endereco.cidade}</p>
                <p>CEP: ${endereco.cep}</p>
            </div>
        `;
        return card;
    }

    openEnderecoModal(endereco = null) {
        this.editingEndereco = endereco;
        const modal = document.getElementById('endereco-modal');
        const title = document.getElementById('endereco-modal-title');
        const form = document.getElementById('endereco-form');

        if (endereco) {
            title.textContent = 'Editar Endereço';
            this.fillEnderecoForm(endereco);
        } else {
            title.textContent = 'Novo Endereço';
            form.reset();
            document.getElementById('endereco-id').value = '';
        }

        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeEnderecoModal() {
        const modal = document.getElementById('endereco-modal');
        modal.classList.remove('show');
        document.body.style.overflow = '';
        this.editingEndereco = null;
    }

    fillEnderecoForm(endereco) {
        document.getElementById('endereco-id').value = endereco.id;
        document.getElementById('endereco-nome').value = endereco.nome;
        document.getElementById('endereco-cep').value = endereco.cep;
        document.getElementById('endereco-endereco').value = endereco.endereco;
        document.getElementById('endereco-numero').value = endereco.numero;
        document.getElementById('endereco-complemento').value = endereco.complemento || '';
        document.getElementById('endereco-bairro').value = endereco.bairro;
        document.getElementById('endereco-cidade').value = endereco.cidade;
        document.getElementById('endereco-principal').checked = endereco.principal;
    }

    async handleSaveEndereco(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const enderecoId = formData.get('id');
        const isPrincipal = formData.get('principal') === 'on';

        const endereco = {
            id: enderecoId ? parseInt(enderecoId) : Date.now(),
            userId: this.currentUser.id,
            nome: formData.get('nome'),
            cep: formData.get('cep'),
            endereco: formData.get('endereco'),
            numero: formData.get('numero'),
            complemento: formData.get('complemento'),
            bairro: formData.get('bairro'),
            cidade: formData.get('cidade'),
            principal: isPrincipal,
            createdAt: new Date().toISOString()
        };

        try {
            await this.delay(500);

            if (enderecoId) {
                // Editar endereço existente
                const index = this.enderecos.findIndex(e => e.id === parseInt(enderecoId));
                if (index !== -1) {
                    this.enderecos[index] = endereco;
                }
            } else {
                // Novo endereço
                this.enderecos.push(endereco);
            }

            // Se marcado como principal, desmarcar outros
            if (isPrincipal) {
                this.enderecos.forEach(e => {
                    if (e.userId === this.currentUser.id && e.id !== endereco.id) {
                        e.principal = false;
                    }
                });
            }

            localStorage.setItem('enderecos', JSON.stringify(this.enderecos));
            this.loadEnderecos();
            this.updateCounts();
            this.closeEnderecoModal();
            
            this.showMessage('Endereço salvo com sucesso!', 'success');

        } catch (error) {
            this.showMessage('Erro ao salvar endereço', 'error');
        }
    }

    editEndereco(id) {
        const endereco = this.enderecos.find(e => e.id === id);
        if (endereco) {
            this.openEnderecoModal(endereco);
        }
    }

    deleteEndereco(id) {
        if (confirm('Tem certeza que deseja excluir este endereço?')) {
            this.enderecos = this.enderecos.filter(e => e.id !== id);
            localStorage.setItem('enderecos', JSON.stringify(this.enderecos));
            this.loadEnderecos();
            this.updateCounts();
            this.showMessage('Endereço excluído com sucesso!', 'success');
        }
    }

    async buscarCEP() {
        const cepInput = document.getElementById('endereco-cep');
        const cep = cepInput.value.replace(/\D/g, '');
        
        if (cep.length !== 8) {
            this.showMessage('CEP deve ter 8 dígitos', 'error');
            return;
        }

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            
            if (data.erro) {
                this.showMessage('CEP não encontrado', 'error');
                return;
            }
            
            // Preencher campos automaticamente
            document.getElementById('endereco-endereco').value = data.logradouro;
            document.getElementById('endereco-bairro').value = data.bairro;
            document.getElementById('endereco-cidade').value = data.localidade;
            
            this.showMessage('CEP encontrado!', 'success');
            
        } catch (error) {
            this.showMessage('Erro ao buscar CEP', 'error');
        }
    }

    // Pedidos
    loadPedidos() {
        const userPedidos = this.pedidos.filter(p => p.userId === this.currentUser.id);
        const container = document.getElementById('pedidos-list');
        const emptyState = document.getElementById('pedidos-empty');

        if (userPedidos.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        container.style.display = 'block';
        emptyState.style.display = 'none';
        container.innerHTML = '';

        // Ordenar por data mais recente
        userPedidos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        userPedidos.forEach(pedido => {
            const pedidoCard = this.createPedidoCard(pedido);
            container.appendChild(pedidoCard);
        });
    }

    createPedidoCard(pedido) {
        const card = document.createElement('div');
        card.className = 'pedido-card';
        
        const items = pedido.items.map(item => `
            <div class="pedido-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="pedido-item-info">
                    <div class="pedido-item-nome">${item.name}</div>
                    <div class="pedido-item-detalhes">Quantidade: ${item.quantity} • R$ ${item.price.toFixed(2).replace('.', ',')}</div>
                </div>
            </div>
        `).join('');

        card.innerHTML = `
            <div class="pedido-header">
                <div class="pedido-numero">Pedido #${pedido.numero}</div>
                <div class="pedido-status status-${pedido.status}">${this.getStatusText(pedido.status)}</div>
            </div>
            <div class="pedido-items">
                ${items}
            </div>
            <div class="pedido-footer">
                <div class="pedido-data">${new Date(pedido.createdAt).toLocaleDateString('pt-BR')}</div>
                <div class="pedido-total">R$ ${pedido.total.toFixed(2).replace('.', ',')}</div>
            </div>
        `;
        
        return card;
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

    filterPedidos() {
        const filterValue = document.getElementById('status-filter').value;
        const pedidoCards = document.querySelectorAll('.pedido-card');
        
        pedidoCards.forEach(card => {
            const status = card.querySelector('.pedido-status').className.split('status-')[1];
            if (!filterValue || status === filterValue) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Favoritos
    loadFavoritos() {
        const container = document.getElementById('favoritos-list');
        const emptyState = document.getElementById('favoritos-empty');

        if (this.favoritos.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        container.style.display = 'grid';
        emptyState.style.display = 'none';
        container.innerHTML = '';

        this.favoritos.forEach(produto => {
            const favoritoCard = this.createFavoritoCard(produto);
            container.appendChild(favoritoCard);
        });
    }

    createFavoritoCard(produto) {
        const card = document.createElement('div');
        card.className = 'favorito-card';
        card.innerHTML = `
            <div class="card-header">
                <h3 class="card-title">${produto.name}</h3>
                <div class="card-actions">
                    <button class="card-btn delete" onclick="perfilPage.removeFavorito(${produto.id})">
                        <img src="../assets/icons/heart-filled.svg" alt="Remover dos favoritos">
                    </button>
                </div>
            </div>
            <img src="${produto.image}" alt="${produto.name}" style="width: 100%; height: 200px; object-fit: contain; margin: 1rem 0;">
            <div class="favorito-info">
                <p class="favorito-preco">R$ ${produto.price.toFixed(2).replace('.', ',')}</p>
                <button class="btn-primary" onclick="perfilPage.viewProduct(${produto.id})">
                    Ver Produto
                </button>
            </div>
        `;
        return card;
    }

    removeFavorito(productId) {
        this.favoritos = this.favoritos.filter(p => p.id !== productId);
        localStorage.setItem('favoritos', JSON.stringify(this.favoritos));
        this.loadFavoritos();
        this.updateCounts();
        this.showMessage('Produto removido dos favoritos', 'success');
    }

    viewProduct(productId) {
        sessionStorage.setItem('selectedProductId', productId);
        window.location.href = './product.html';
    }

    clearFavoritos() {
        if (confirm('Tem certeza que deseja limpar toda a lista de favoritos?')) {
            this.favoritos = [];
            localStorage.setItem('favoritos', JSON.stringify(this.favoritos));
            this.loadFavoritos();
            this.updateCounts();
            this.showMessage('Lista de favoritos limpa', 'success');
        }
    }

    // Cupons
    loadCupons() {
        const cuponsDisponiveis = [
            { code: 'WELCOME10', discount: 0.10, description: '10% de desconto', expiry: '2024-12-31' },
            { code: 'DEV20', discount: 0.20, description: '20% de desconto', expiry: '2024-12-31' },
            { code: 'GEEK15', discount: 0.15, description: '15% de desconto', expiry: '2024-12-31' }
        ];

        const container = document.getElementById('cupons-list');
        container.innerHTML = '';

        cuponsDisponiveis.forEach(cupom => {
            const cupomCard = this.createCupomCard(cupom);
            container.appendChild(cupomCard);
        });
    }

    createCupomCard(cupom) {
        const card = document.createElement('div');
        card.className = 'cupom-card';
        card.innerHTML = `
            <div class="card-header">
                <h3 class="card-title">${cupom.code}</h3>
                <div class="cupom-discount">${Math.round(cupom.discount * 100)}% OFF</div>
            </div>
            <div class="cupom-info">
                <p>${cupom.description}</p>
                <p><small>Válido até: ${new Date(cupom.expiry).toLocaleDateString('pt-BR')}</small></p>
                <button class="btn-primary" onclick="perfilPage.copyCupom('${cupom.code}')">
                    Copiar Código
                </button>
            </div>
        `;
        return card;
    }

    copyCupom(code) {
        navigator.clipboard.writeText(code).then(() => {
            this.showMessage(`Cupom ${code} copiado!`, 'success');
        });
    }

    // Configurações
    loadConfiguracoes() {
        // Carregar configurações salvas
        document.getElementById('email-promocoes').checked = this.configuracoes.emailPromocoes;
        document.getElementById('email-pedidos').checked = this.configuracoes.emailPedidos;
        document.getElementById('push-notifications').checked = this.configuracoes.pushNotifications;
        document.getElementById('perfil-publico').checked = this.configuracoes.perfilPublico;
        document.getElementById('historico-compras').checked = this.configuracoes.historicoCompras;
    }

    updateConfig() {
        this.configuracoes = {
            emailPromocoes: document.getElementById('email-promocoes').checked,
            emailPedidos: document.getElementById('email-pedidos').checked,
            pushNotifications: document.getElementById('push-notifications').checked,
            perfilPublico: document.getElementById('perfil-publico').checked,
            historicoCompras: document.getElementById('historico-compras').checked
        };

        localStorage.setItem('configuracoes', JSON.stringify(this.configuracoes));
        this.showMessage('Configurações atualizadas', 'success');
    }

    getDefaultConfig() {
        return {
            emailPromocoes: true,
            emailPedidos: true,
            pushNotifications: false,
            perfilPublico: false,
            historicoCompras: true
        };
    }

    // Utility functions
    updateCounts() {
        const userEnderecos = this.enderecos.filter(e => e.userId === this.currentUser.id);
        const userPedidos = this.pedidos.filter(p => p.userId === this.currentUser.id);
        
        document.getElementById('enderecos-count').textContent = userEnderecos.length;
        document.getElementById('pedidos-count').textContent = userPedidos.length;
        document.getElementById('favoritos-count').textContent = this.favoritos.length;
        document.getElementById('cupons-count').textContent = '3'; // Cupons disponíveis
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

    togglePassword(toggle) {
        const targetId = toggle.dataset.target;
        const input = document.getElementById(targetId);
        const img = toggle.querySelector('img');
        
        if (input.type === 'password') {
            input.type = 'text';
            img.src = '../assets/icons/eye-off.svg';
        } else {
            input.type = 'password';
            img.src = '../assets/icons/eye.svg';
        }
    }

    applyPhoneMask(input) {
        let value = input.value.replace(/\D/g, '');
        value = value.replace(/(\d{2})(\d)/, '($1) $2');
        value = value.replace(/(\d{5})(\d)/, '$1-$2');
        input.value = value;
    }

    applyCepMask(input) {
        let value = input.value.replace(/\D/g, '');
        value = value.replace(/(\d{5})(\d)/, '$1-$2');
        input.value = value;
    }

    showMessage(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            max-width: 350px;
        `;
        
        const colors = {
            success: '#10b981',
            error: '#dc2626',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }

    logout() {
        if (confirm('Tem certeza que deseja sair da sua conta?')) {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('rememberUser');
            window.location.href = '../index.html';
        }
    }

    deleteAccount() {
        if (confirm('ATENÇÃO: Esta ação irá excluir permanentemente sua conta e todos os seus dados. Esta ação não pode ser desfeita. Tem certeza?')) {
            if (confirm('Digite "CONFIRMAR" para prosseguir:') && prompt('Digite "CONFIRMAR":') === 'CONFIRMAR') {
                // Remover usuário da lista
                this.users = this.users.filter(u => u.id !== this.currentUser.id);
                localStorage.setItem('users', JSON.stringify(this.users));
                
                // Remover dados relacionados
                localStorage.removeItem('currentUser');
                localStorage.removeItem(`avatar_${this.currentUser.id}`);
                
                // Remover endereços do usuário
                this.enderecos = this.enderecos.filter(e => e.userId !== this.currentUser.id);
                localStorage.setItem('enderecos', JSON.stringify(this.enderecos));
                
                alert('Conta excluída com sucesso. Você será redirecionado.');
                window.location.href = '../index.html';
            }
        }
    }

    // Gerar dados mock para demonstração
    generateMockData() {
        // Adicionar alguns endereços mock se não existirem
        const userEnderecos = this.enderecos.filter(e => e.userId === this.currentUser.id);
        if (userEnderecos.length === 0) {
            const mockEnderecos = [
                {
                    id: Date.now(),
                    userId: this.currentUser.id,
                    nome: 'Casa',
                    cep: '01234-567',
                    endereco: 'Rua das Flores',
                    numero: '123',
                    complemento: 'Apto 45',
                    bairro: 'Centro',
                    cidade: 'São Paulo',
                    principal: true,
                    createdAt: new Date().toISOString()
                }
            ];
            
            this.enderecos.push(...mockEnderecos);
            localStorage.setItem('enderecos', JSON.stringify(this.enderecos));
        }

        // Adicionar alguns pedidos mock se não existirem
        const userPedidos = this.pedidos.filter(p => p.userId === this.currentUser.id);
        if (userPedidos.length === 0) {
            const mockPedidos = [
                {
                    id: Date.now(),
                    userId: this.currentUser.id,
                    numero: Date.now().toString().slice(-6),
                    status: 'entregue',
                    items: [
                        {
                            id: 1,
                            name: 'Camiseta React',
                            price: 79.90,
                            quantity: 1,
                            image: '../assets/produtos/camiseta-react.jpg'
                        }
                    ],
                    total: 79.90,
                    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: Date.now() + 1,
                    userId: this.currentUser.id,
                    numero: (Date.now() + 1).toString().slice(-6),
                    status: 'enviado',
                    items: [
                        {
                            id: 2,
                            name: 'Caneca JavaScript',
                            price: 29.90,
                            quantity: 2,
                            image: '../assets/produtos/caneca-js.jpg'
                        }
                    ],
                    total: 59.80,
                    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
                }
            ];
            
            this.pedidos.push(...mockPedidos);
            localStorage.setItem('pedidos', JSON.stringify(this.pedidos));
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Inicializar página de perfil
let perfilPage;
document.addEventListener('DOMContentLoaded', () => {
    perfilPage = new PerfilPage();
});

// Adicionar CSS para animações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes modalSlideIn {
        from {
            transform: scale(0.7);
            opacity: 0;
        }
        to {
            transform: scale(1);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);