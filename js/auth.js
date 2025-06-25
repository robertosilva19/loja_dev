/*
* Sistema de Autenticação Completo - Conectado à API
* Este ficheiro gere os formulários de login, registo e a comunicação
* com o back-end para autenticação de utilizadores.
*/

class AuthManager {
    constructor() {
        this.currentUser = this.loadCurrentUser();
        this.isLoading = false;
        // URL base da nossa API. Facilita a manutenção.
        this.apiBaseUrl = 'http://localhost:3001/api'; 
        
        // Regras de validação para os formulários
        this.validationRules = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            password: {
                minLength: 6,
                // Pode reativar estas regras se as implementar no back-end
                // requireUppercase: true, 
                // requireNumber: true,
            }
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        // Outras inicializações como validações em tempo real podem ser adicionadas aqui
    }

    // Configura todos os "ouvintes" de eventos da página
    setupEventListeners() {
        // Navegação entre os cartões de login, registo e esqueci a senha
        document.getElementById('show-register')?.addEventListener('click', (e) => { e.preventDefault(); this.showForm('register-card'); });
        document.getElementById('show-login')?.addEventListener('click', (e) => { e.preventDefault(); this.showForm('login-card'); });
        document.getElementById('forgot-password-link')?.addEventListener('click', (e) => { e.preventDefault(); this.showForm('forgot-password-card'); });
        document.getElementById('back-to-login')?.addEventListener('click', (e) => { e.preventDefault(); this.showForm('login-card'); });

        // Submissão dos formulários
        document.getElementById('login-form')?.addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form')?.addEventListener('submit', (e) => this.handleRegister(e));
        
        // Botão de mostrar/ocultar senha
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', () => this.togglePassword(btn));
        });
    }

    // Altera a visibilidade dos formulários (login, registo, etc.)
    showForm(formIdToShow) {
        const forms = ['login-card', 'register-card', 'forgot-password-card'];
        forms.forEach(formId => {
            const formElement = document.getElementById(formId);
            if (formElement) {
                formElement.style.display = formId === formIdToShow ? 'block' : 'none';
            }
        });
        // Pode adicionar aqui uma lógica para limpar mensagens de erro
    }
    
    // --- LÓGICA DE REGISTO LIGADA À API ---
    async handleRegister(e) {
        e.preventDefault();
        if (this.isLoading) return;
        
        const form = e.target;
        const nome = form.querySelector('#register-nome')?.value;
        const email = form.querySelector('#register-email')?.value;
        const senha = form.querySelector('#register-password')?.value;

        this.setLoading(true, 'register-button');

        try {
            // Faz a chamada 'fetch' para a nova rota da API
            const response = await fetch(`${this.apiBaseUrl}/usuarios/registrar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, senha }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Mostra o erro vindo da API (ex: "E-mail já registado")
                throw new Error(data.error || 'Falha ao registar.');
            }
            
            this.showMessage('Conta criada com sucesso! Por favor, faça o login.', 'success');
            setTimeout(() => this.showForm('login-card'), 2000);

        } catch (error) {
            this.showMessage(error.message, 'error');
        } finally {
            this.setLoading(false, 'register-button');
        }
    }

    // --- LÓGICA DE LOGIN LIGADA À API ---
    async handleLogin(e) {
        e.preventDefault();
        if (this.isLoading) return;

        const form = e.target;
        const email = form.querySelector('#login-email')?.value;
        const senha = form.querySelector('#login-password')?.value;

        if (!email || !senha) {
            return this.showMessage('E-mail e senha são obrigatórios.', 'error');
        }

        this.setLoading(true, 'login-button');

        try {
            const response = await fetch(`${this.apiBaseUrl}/usuarios/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Credenciais inválidas.');
            }

            // Se o login for bem-sucedido, guarda o token e os dados do utilizador
            this.setCurrentUser(data.utilizador, data.token);
            
            this.showMessage('Login efetuado com sucesso! A redirecionar...', 'success');
            
            // Redireciona para a página de perfil ou para a página de onde veio
            setTimeout(() => {
                const urlParams = new URLSearchParams(window.location.search);
                const redirectUrl = urlParams.get('redirect') || '../pages/perfil.html';
                window.location.href = redirectUrl;
            }, 1000);

        } catch (error) {
            this.showMessage(error.message, 'error');
        } finally {
            this.setLoading(false, 'login-button');
        }
    }
    
    // --- GESTÃO DO UTILIZADOR E TOKEN NO NAVEGADOR ---
    setCurrentUser(user, token) {
        this.currentUser = user;
        // Guarda o objeto do utilizador e o token no localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('userToken', token);
    }

    logout() {
        this.currentUser = null;
        // Limpa tanto o utilizador como o token
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userToken');
        // Redireciona para a página inicial
        window.location.href = '../index.html';
    }

    loadCurrentUser() {
        const storedUser = localStorage.getItem('currentUser');
        const storedToken = localStorage.getItem('userToken');
        // Considera logado apenas se ambos existirem
        return (storedUser && storedToken) ? JSON.parse(storedUser) : null;
    }

    // --- FUNÇÕES UTILITÁRIAS DA INTERFACE ---

    togglePassword(toggleBtn) {
        const passwordInput = toggleBtn.closest('.password-field').querySelector('input');
        const icon = toggleBtn.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }
    
    setLoading(loading, buttonId) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        
        button.disabled = loading;
        if (loading) {
            button.classList.add('loading');
        } else {
            button.classList.remove('loading');
        }
    }

    showMessage(message, type = 'info') {
        // Lógica para mostrar uma notificação de feedback ao utilizador
        // Pode ser um alert simples ou um elemento toast mais elegante
        alert(`[${type.toUpperCase()}] ${message}`);
    }
}

// Inicializar o gestor de autenticação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// API pública para outros scripts (como perfil.js) poderem interagir
window.AuthAPI = {
    getCurrentUser: () => window.authManager?.getCurrentUser(),
    logout: () => window.authManager?.logout(),
    isLoggedIn: () => !!window.authManager?.loadCurrentUser()
};
