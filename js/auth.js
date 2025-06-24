/* filepath: c:\Users\janic\OneDrive\Área de Trabalho\Projetos\loja_dev\js\auth.js */
// Sistema de Autenticação Completo

class AuthManager {
    constructor() {
        this.currentUser = this.loadCurrentUser();
        this.isLoading = false;
        this.validationRules = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phone: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
            cpf: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
            password: {
                minLength: 6,
                requireUppercase: true,
                requireNumber: true,
                requireSpecial: false
            }
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFormValidation();
        this.setupPasswordStrength();
        this.setupMasks();
        this.checkAuthState();
    }

    // Event Listeners
    setupEventListeners() {
        // Navegação entre formulários
        document.getElementById('show-register')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showForm('register');
        });

        document.getElementById('show-login')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showForm('login');
        });

        document.getElementById('forgot-password-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showForm('forgot-password');
        });

        document.getElementById('back-to-login')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showForm('login');
        });

        // Formulários
        document.getElementById('login-form')?.addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form')?.addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('forgot-password-form')?.addEventListener('submit', (e) => this.handleForgotPassword(e));

        // Toggle de senha
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', () => this.togglePassword(btn));
        });

        // Login social
        document.querySelector('.google-login')?.addEventListener('click', () => this.handleSocialLogin('google'));
        document.querySelector('.facebook-login')?.addEventListener('click', () => this.handleSocialLogin('facebook'));
        document.querySelector('.google-register')?.addEventListener('click', () => this.handleSocialLogin('google'));
        document.querySelector('.facebook-register')?.addEventListener('click', () => this.handleSocialLogin('facebook'));
    }

    // Navegação entre formulários
    showForm(formType) {
        const forms = ['login-card', 'register-card', 'forgot-password-card'];
        
        forms.forEach(formId => {
            const form = document.getElementById(formId);
            if (form) {
                form.style.display = 'none';
            }
        });

        const targetForm = document.getElementById(`${formType}-card`);
        if (targetForm) {
            targetForm.style.display = 'block';
            targetForm.style.animation = 'slideUp 0.6s ease-out';
        }

        // Limpar erros
        this.clearErrors();
    }

    // Validação em tempo real
    setupFormValidation() {
        // Email validation
        document.querySelectorAll('input[type="email"]').forEach(input => {
            input.addEventListener('blur', () => this.validateEmail(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });

        // Password validation
        document.querySelectorAll('input[type="password"]').forEach(input => {
            if (input.id.includes('register-password') && !input.id.includes('confirm')) {
                input.addEventListener('input', () => this.validatePassword(input));
            }
            if (input.id.includes('confirm')) {
                input.addEventListener('input', () => this.validatePasswordConfirm(input));
            }
        });

        // CPF validation
        document.getElementById('register-cpf')?.addEventListener('blur', (e) => this.validateCPF(e.target));

        // Phone validation
        document.getElementById('register-telefone')?.addEventListener('blur', (e) => this.validatePhone(e.target));

        // Nome validation
        document.querySelectorAll('input[name="nome"], input[name="sobrenome"]').forEach(input => {
            input.addEventListener('blur', () => this.validateName(input));
        });
    }

    // Força da senha
    setupPasswordStrength() {
        const passwordInput = document.getElementById('register-password');
        const strengthIndicator = document.getElementById('password-strength');
        
        if (passwordInput && strengthIndicator) {
            passwordInput.addEventListener('input', () => {
                const strength = this.calculatePasswordStrength(passwordInput.value);
                this.updatePasswordStrength(strength);
            });
        }
    }

    // Máscaras de input
    setupMasks() {
        // Máscara de telefone
        const phoneInput = document.getElementById('register-telefone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length <= 11) {
                    value = value.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
                }
                e.target.value = value;
            });
        }

        // Máscara de CPF
        const cpfInput = document.getElementById('register-cpf');
        if (cpfInput) {
            cpfInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length <= 11) {
                    value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                }
                e.target.value = value;
            });
        }
    }

    // Validações específicas
    validateEmail(input) {
        const email = input.value.trim();
        const isValid = this.validationRules.email.test(email);
        
        if (!isValid && email) {
            this.showFieldError(input, 'Email inválido');
            return false;
        }
        
        this.showFieldSuccess(input);
        return true;
    }

    validatePassword(input) {
        const password = input.value;
        const rules = this.validationRules.password;
        const errors = [];

        if (password.length < rules.minLength) {
            errors.push(`Mínimo ${rules.minLength} caracteres`);
        }
        
        if (rules.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Uma letra maiúscula');
        }
        
        if (rules.requireNumber && !/\d/.test(password)) {
            errors.push('Um número');
        }
        
        if (rules.requireSpecial && !/[!@#$%^&*]/.test(password)) {
            errors.push('Um caractere especial');
        }

        if (errors.length > 0 && password) {
            this.showFieldError(input, `Senha deve ter: ${errors.join(', ')}`);
            return false;
        }

        this.showFieldSuccess(input);
        return true;
    }

    validatePasswordConfirm(input) {
        const password = document.getElementById('register-password').value;
        const confirmPassword = input.value;

        if (password !== confirmPassword && confirmPassword) {
            this.showFieldError(input, 'Senhas não coincidem');
            return false;
        }

        this.showFieldSuccess(input);
        return true;
    }

    validateCPF(input) {
        const cpf = input.value.replace(/\D/g, '');
        
        if (!this.isValidCPF(cpf) && cpf) {
            this.showFieldError(input, 'CPF inválido');
            return false;
        }

        this.showFieldSuccess(input);
        return true;
    }

    validatePhone(input) {
        const phone = input.value;
        const isValid = this.validationRules.phone.test(phone);

        if (!isValid && phone) {
            this.showFieldError(input, 'Telefone inválido');
            return false;
        }

        this.showFieldSuccess(input);
        return true;
    }

    validateName(input) {
        const name = input.value.trim();
        
        if (name.length < 2) {
            this.showFieldError(input, 'Mínimo 2 caracteres');
            return false;
        }

        this.showFieldSuccess(input);
        return true;
    }

    // Utilitários de validação
    isValidCPF(cpf) {
        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
        
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.charAt(9))) return false;
        
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        return remainder === parseInt(cpf.charAt(10));
    }

    calculatePasswordStrength(password) {
        let score = 0;
        if (password.length >= 6) score++;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[!@#$%^&*]/.test(password)) score++;
        
        return Math.min(score, 4);
    }

    updatePasswordStrength(strength) {
        const strengthFill = document.querySelector('.strength-fill');
        const strengthText = document.querySelector('.strength-text');
        
        if (!strengthFill || !strengthText) return;

        const levels = ['weak', 'fair', 'good', 'strong'];
        const texts = ['Fraca', 'Razoável', 'Boa', 'Forte'];
        
        strengthFill.className = `strength-fill ${levels[strength - 1] || ''}`;
        strengthText.textContent = strength > 0 ? `Senha: ${texts[strength - 1]}` : 'Digite uma senha';
    }

    // Interface de erro/sucesso
    showFieldError(input, message) {
        const formGroup = input.closest('.form-group');
        const errorElement = formGroup.querySelector('.form-error');
        
        formGroup.classList.add('error');
        formGroup.classList.remove('success');
        input.classList.add('error');
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    showFieldSuccess(input) {
        const formGroup = input.closest('.form-group');
        const errorElement = formGroup.querySelector('.form-error');
        
        formGroup.classList.add('success');
        formGroup.classList.remove('error');
        input.classList.remove('error');
        
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    clearFieldError(input) {
        const formGroup = input.closest('.form-group');
        const errorElement = formGroup.querySelector('.form-error');
        
        formGroup.classList.remove('error', 'success');
        input.classList.remove('error');
        
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    clearErrors() {
        document.querySelectorAll('.form-error').forEach(error => {
            error.classList.remove('show');
        });
        
        document.querySelectorAll('.form-group').forEach(group => {
            group.classList.remove('error', 'success');
        });
        
        document.querySelectorAll('input').forEach(input => {
            input.classList.remove('error');
        });
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

    // Handlers de formulário
    async handleLogin(e) {
        e.preventDefault();
        
        if (this.isLoading) return;
        
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        const remember = formData.get('remember');

        // Validação
        if (!this.validateLoginForm(email, password)) return;

        this.setLoading(true, 'login-button');

        try {
            // Simular autenticação
            await this.simulateLogin(email, password);
            
            const user = {
                id: Date.now(),
                email: email,
                nome: email.split('@')[0],
                loginTime: new Date().toISOString(),
                rememberMe: !!remember
            };

            this.setCurrentUser(user);
            this.showMessage('Login realizado com sucesso!', 'success');
            
            // Redirecionar após 1 segundo
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1000);

        } catch (error) {
            this.showMessage(error.message, 'error');
        } finally {
            this.setLoading(false, 'login-button');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        if (this.isLoading) return;
        
        const formData = new FormData(e.target);
        const userData = Object.fromEntries(formData);

        // Validação completa
        if (!this.validateRegisterForm(userData)) return;

        this.setLoading(true, 'register-button');

        try {
            // Simular registro
            await this.simulateRegister(userData);
            
            const user = {
                id: Date.now(),
                ...userData,
                registrationTime: new Date().toISOString(),
                verified: false
            };

            this.setCurrentUser(user);
            this.showMessage('Conta criada com sucesso!', 'success');
            
            // Redirecionar após 1 segundo
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1000);

        } catch (error) {
            this.showMessage(error.message, 'error');
        } finally {
            this.setLoading(false, 'register-button');
        }
    }

    async handleForgotPassword(e) {
        e.preventDefault();
        
        if (this.isLoading) return;
        
        const formData = new FormData(e.target);
        const email = formData.get('email');

        if (!this.validateEmail(document.getElementById('forgot-email'))) return;

        this.setLoading(true, 'forgot-button');

        try {
            // Simular envio de email
            await this.simulateForgotPassword(email);
            
            this.showMessage('Link de recuperação enviado para seu email!', 'success');
            
            // Voltar para login após 2 segundos
            setTimeout(() => {
                this.showForm('login');
            }, 2000);

        } catch (error) {
            this.showMessage(error.message, 'error');
        } finally {
            this.setLoading(false, 'forgot-button');
        }
    }

    // Login social
    async handleSocialLogin(provider) {
        try {
            this.showMessage(`Redirecionando para ${provider}...`, 'info');
            
            // Simular login social
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const user = {
                id: Date.now(),
                email: `user@${provider}.com`,
                nome: `Usuário ${provider}`,
                provider: provider,
                loginTime: new Date().toISOString()
            };

            this.setCurrentUser(user);
            this.showMessage(`Login com ${provider} realizado!`, 'success');
            
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1000);

        } catch (error) {
            this.showMessage(`Erro no login com ${provider}`, 'error');
        }
    }

    // Validações de formulário
    validateLoginForm(email, password) {
        let isValid = true;
        
        if (!email) {
            this.showFieldError(document.getElementById('login-email'), 'Email é obrigatório');
            isValid = false;
        }
        
        if (!password) {
            this.showFieldError(document.getElementById('login-password'), 'Senha é obrigatória');
            isValid = false;
        }
        
        return isValid;
    }

    validateRegisterForm(userData) {
        let isValid = true;
        
        // Validar todos os campos obrigatórios
        const requiredFields = ['nome', 'sobrenome', 'email', 'telefone', 'cpf', 'password'];
        
        requiredFields.forEach(field => {
            if (!userData[field]) {
                const input = document.getElementById(`register-${field}`);
                this.showFieldError(input, 'Campo obrigatório');
                isValid = false;
            }
        });
        
        // Validar confirmação de senha
        if (userData.password !== userData.confirmPassword) {
            this.showFieldError(document.getElementById('register-confirm-password'), 'Senhas não coincidem');
            isValid = false;
        }
        
        // Validar termos
        if (!userData.terms) {
            this.showFieldError(document.getElementById('accept-terms'), 'Você deve aceitar os termos');
            isValid = false;
        }
        
        return isValid;
    }

    // Simulações de API
    async simulateLogin(email, password) {
        // Simular delay de rede
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Verificar credenciais fictícias
        const users = this.getStoredUsers();
        const user = users.find(u => u.email === email);
        
        if (!user || user.password !== password) {
            throw new Error('Email ou senha incorretos');
        }
        
        return user;
    }

    async simulateRegister(userData) {
        // Simular delay de rede
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verificar se email já existe
        const users = this.getStoredUsers();
        if (users.find(u => u.email === userData.email)) {
            throw new Error('Email já cadastrado');
        }
        
        // Salvar usuário
        users.push(userData);
        localStorage.setItem('users', JSON.stringify(users));
        
        return userData;
    }

    async simulateForgotPassword(email) {
        // Simular delay de rede
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verificar se email existe
        const users = this.getStoredUsers();
        if (!users.find(u => u.email === email)) {
            throw new Error('Email não encontrado');
        }
        
        return true;
    }

    // Gerenciamento de usuário
    setCurrentUser(user) {
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Disparar evento
        window.dispatchEvent(new CustomEvent('userLogin', { detail: user }));
    }

    getCurrentUser() {
        return this.currentUser;
    }

    loadCurrentUser() {
        const stored = localStorage.getItem('currentUser');
        return stored ? JSON.parse(stored) : null;
    }

    getStoredUsers() {
        const stored = localStorage.getItem('users');
        return stored ? JSON.parse(stored) : [];
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        window.dispatchEvent(new CustomEvent('userLogout'));
    }

    // Verificar estado de autenticação
    checkAuthState() {
        if (this.currentUser) {
            // Usuário já logado, verificar se deve redirecionar
            const urlParams = new URLSearchParams(window.location.search);
            const redirect = urlParams.get('redirect') || '../index.html';
            
            if (confirm('Você já está logado. Deseja ir para a página inicial?')) {
                window.location.href = redirect;
            }
        }
    }

    // Estados de carregamento
    setLoading(loading, buttonId) {
        this.isLoading = loading;
        const button = document.getElementById(buttonId);
        const buttonText = button.querySelector('.button-text');
        const buttonLoader = button.querySelector('.button-loader');
        
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
            buttonText.style.display = 'none';
            buttonLoader.style.display = 'block';
        } else {
            button.classList.remove('loading');
            button.disabled = false;
            buttonText.style.display = 'block';
            buttonLoader.style.display = 'none';
        }
    }

    // Sistema de mensagens
    showMessage(message, type = 'info') {
        const container = document.getElementById('auth-messages');
        if (!container) return;

        const messageEl = document.createElement('div');
        messageEl.className = `auth-message ${type}`;
        messageEl.innerHTML = `
            <span class="message-icon">${this.getMessageIcon(type)}</span>
            <span class="message-text">${message}</span>
            <button class="close-btn" onclick="this.parentElement.remove()">×</button>
        `;

        container.appendChild(messageEl);

        // Remover automaticamente após 5 segundos
        setTimeout(() => {
            if (messageEl.parentElement) {
                messageEl.remove();
            }
        }, 5000);
    }

    getMessageIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        };
        return icons[type] || icons.info;
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// API pública
window.AuthAPI = {
    getCurrentUser: () => window.authManager?.getCurrentUser(),
    logout: () => window.authManager?.logout(),
    isLoggedIn: () => !!window.authManager?.getCurrentUser()
};