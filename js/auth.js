class AuthSystem {
    constructor() {
        this.currentForm = 'login';
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFormSwitching();
        this.setupPasswordToggles();
        this.setupInputMasks();
        this.setupPasswordStrength();
        this.updateCartCount();
        this.checkAuthState();
    }

    setupEventListeners() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            this.handleLogin(e);
        });

        // Register form
        document.getElementById('register-form').addEventListener('submit', (e) => {
            this.handleRegister(e);
        });

        // Forgot password form
        document.getElementById('forgot-password-form').addEventListener('submit', (e) => {
            this.handleForgotPassword(e);
        });

        // Social login buttons
        document.querySelectorAll('.google-login, .google-register').forEach(btn => {
            btn.addEventListener('click', () => this.handleSocialLogin('google'));
        });

        document.querySelectorAll('.facebook-login, .facebook-register').forEach(btn => {
            btn.addEventListener('click', () => this.handleSocialLogin('facebook'));
        });

        // Real-time validation
        this.setupRealTimeValidation();
    }

    setupFormSwitching() {
        // Show register
        document.getElementById('show-register').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchForm('register');
        });

        // Show login
        document.getElementById('show-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchForm('login');
        });

        // Show forgot password
        document.getElementById('forgot-password-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchForm('forgot-password');
        });

        // Back to login
        document.getElementById('back-to-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchForm('login');
        });
    }

    switchForm(formType) {
        const currentCard = document.getElementById(`${this.currentForm}-card`);
        const targetCard = document.getElementById(`${formType}-card`);

        // Fade out current form
        currentCard.classList.add('fade-out');
        
        setTimeout(() => {
            currentCard.style.display = 'none';
            currentCard.classList.remove('fade-out');
            
            // Show target form
            targetCard.style.display = 'block';
            targetCard.classList.add('fade-in');
            
            setTimeout(() => {
                targetCard.classList.remove('fade-in');
            }, 300);
            
            this.currentForm = formType;
            this.clearErrors();
        }, 150);
    }

    setupPasswordToggles() {
        document.querySelectorAll('.toggle-password').forEach(toggle => {
            toggle.addEventListener('click', () => {
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
            });
        });
    }

    setupInputMasks() {
        // Máscara de telefone
        const telefoneInput = document.getElementById('register-telefone');
        if (telefoneInput) {
            telefoneInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                value = value.replace(/(\d{2})(\d)/, '($1) $2');
                value = value.replace(/(\d{5})(\d)/, '$1-$2');
                e.target.value = value;
            });
        }

        // Máscara de CPF
        const cpfInput = document.getElementById('register-cpf');
        if (cpfInput) {
            cpfInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                e.target.value = value;
            });
        }
    }

    setupPasswordStrength() {
        const passwordInput = document.getElementById('register-password');
        const strengthBar = document.querySelector('.strength-fill');
        const strengthText = document.querySelector('.strength-text');

        if (passwordInput && strengthBar && strengthText) {
            passwordInput.addEventListener('input', (e) => {
                const password = e.target.value;
                const strength = this.calculatePasswordStrength(password);
                
                // Reset classes
                strengthBar.className = 'strength-fill';
                
                if (password.length === 0) {
                    strengthText.textContent = 'Digite uma senha';
                    return;
                }

                if (strength.score <= 2) {
                    strengthBar.classList.add('weak');
                    strengthText.textContent = 'Senha fraca';
                } else if (strength.score <= 4) {
                    strengthBar.classList.add('fair');
                    strengthText.textContent = 'Senha regular';
                } else if (strength.score <= 6) {
                    strengthBar.classList.add('good');
                    strengthText.textContent = 'Senha boa';
                } else {
                    strengthBar.classList.add('strong');
                    strengthText.textContent = 'Senha forte';
                }
            });
        }
    }

    calculatePasswordStrength(password) {
        let score = 0;
        const feedback = [];

        // Length
        if (password.length >= 8) score += 2;
        else if (password.length >= 6) score += 1;
        else feedback.push('Use pelo menos 6 caracteres');

        // Lowercase
        if (/[a-z]/.test(password)) score += 1;
        else feedback.push('Adicione letras minúsculas');

        // Uppercase
        if (/[A-Z]/.test(password)) score += 1;
        else feedback.push('Adicione letras maiúsculas');

        // Numbers
        if (/\d/.test(password)) score += 1;
        else feedback.push('Adicione números');

        // Special characters
        if (/[^A-Za-z0-9]/.test(password)) score += 2;
        else feedback.push('Adicione símbolos (!@#$%^&*)');

        return { score, feedback };
    }

    setupRealTimeValidation() {
        // Email validation
        document.querySelectorAll('input[type="email"]').forEach(input => {
            input.addEventListener('blur', () => {
                this.validateEmail(input);
            });
        });

        // Password confirmation
        const confirmPassword = document.getElementById('register-confirm-password');
        const password = document.getElementById('register-password');
        
        if (confirmPassword && password) {
            confirmPassword.addEventListener('input', () => {
                this.validatePasswordMatch(password, confirmPassword);
            });
        }

        // CPF validation
        const cpfInput = document.getElementById('register-cpf');
        if (cpfInput) {
            cpfInput.addEventListener('blur', () => {
                this.validateCPF(cpfInput);
            });
        }
    }

    validateEmail(input) {
        const email = input.value.trim();
        const errorElement = document.getElementById(`${input.id}-error`);
        
        if (!email) {
            this.showFieldError(input, errorElement, 'Email é obrigatório');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showFieldError(input, errorElement, 'Email inválido');
            return false;
        }

        // Check if email exists (for register)
        if (input.id === 'register-email' && this.users.find(u => u.email === email)) {
            this.showFieldError(input, errorElement, 'Email já cadastrado');
            return false;
        }

        this.showFieldSuccess(input, errorElement);
        return true;
    }

    validatePasswordMatch(passwordInput, confirmInput) {
        const errorElement = document.getElementById(`${confirmInput.id}-error`);
        
        if (passwordInput.value !== confirmInput.value) {
            this.showFieldError(confirmInput, errorElement, 'Senhas não coincidem');
            return false;
        }

        this.showFieldSuccess(confirmInput, errorElement);
        return true;
    }

    validateCPF(input) {
        const cpf = input.value.replace(/\D/g, '');
        const errorElement = document.getElementById(`${input.id}-error`);
        
        if (!this.isValidCPF(cpf)) {
            this.showFieldError(input, errorElement, 'CPF inválido');
            return false;
        }

        this.showFieldSuccess(input, errorElement);
        return true;
    }

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

    showFieldError(input, errorElement, message) {
        input.classList.remove('success');
        input.classList.add('error');
        if (errorElement) errorElement.textContent = message;
    }

    showFieldSuccess(input, errorElement) {
        input.classList.remove('error');
        input.classList.add('success');
        if (errorElement) errorElement.textContent = '';
    }

    clearErrors() {
        document.querySelectorAll('.form-error').forEach(error => {
            error.textContent = '';
        });
        document.querySelectorAll('input').forEach(input => {
            input.classList.remove('error', 'success');
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const button = document.getElementById('login-button');
        const buttonText = button.querySelector('.button-text');
        const buttonLoader = button.querySelector('.button-loader');
        
        // Show loading
        this.setButtonLoading(button, buttonText, buttonLoader, true);
        
        const formData = new FormData(e.target);
        const email = formData.get('email').trim();
        const password = formData.get('password');
        const remember = formData.get('remember');

        try {
            // Simulate API delay
            await this.delay(1000);

            // Find user
            const user = this.users.find(u => u.email === email);
            
            if (!user) {
                throw new Error('Email não cadastrado');
            }

            if (user.password !== password) {
                throw new Error('Senha incorreta');
            }

            // Success login
            this.currentUser = {
                id: user.id,
                nome: user.nome,
                sobrenome: user.sobrenome,
                email: user.email,
                telefone: user.telefone,
                loginTime: new Date().toISOString()
            };

            // Save to localStorage
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            if (remember) {
                localStorage.setItem('rememberUser', 'true');
            }

            this.showMessage('Login realizado com sucesso!', 'success');
            
            // Redirect after delay
            setTimeout(() => {
                const returnUrl = sessionStorage.getItem('returnUrl') || '../index.html';
                sessionStorage.removeItem('returnUrl');
                window.location.href = returnUrl;
            }, 1500);

        } catch (error) {
            this.showMessage(error.message, 'error');
        } finally {
            this.setButtonLoading(button, buttonText, buttonLoader, false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const button = document.getElementById('register-button');
        const buttonText = button.querySelector('.button-text');
        const buttonLoader = button.querySelector('.button-loader');
        
        // Validate form
        if (!this.validateRegisterForm(e.target)) {
            return;
        }

        // Show loading
        this.setButtonLoading(button, buttonText, buttonLoader, true);
        
        const formData = new FormData(e.target);

        try {
            // Simulate API delay
            await this.delay(1500);

            // Create new user
            const newUser = {
                id: Date.now(),
                nome: formData.get('nome').trim(),
                sobrenome: formData.get('sobrenome').trim(),
                email: formData.get('email').trim(),
                telefone: formData.get('telefone'),
                cpf: formData.get('cpf'),
                password: formData.get('password'),
                newsletter: formData.get('newsletter') === 'on',
                createdAt: new Date().toISOString()
            };

            // Save user
            this.users.push(newUser);
            localStorage.setItem('users', JSON.stringify(this.users));

            this.showMessage('Conta criada com sucesso! Faça login para continuar.', 'success');
            
            // Switch to login form
            setTimeout(() => {
                this.switchForm('login');
                // Fill email field
                document.getElementById('login-email').value = newUser.email;
            }, 2000);

        } catch (error) {
            this.showMessage(error.message, 'error');
        } finally {
            this.setButtonLoading(button, buttonText, buttonLoader, false);
        }
    }

    validateRegisterForm(form) {
        let isValid = true;
        const formData = new FormData(form);

        // Validate required fields
        const requiredFields = ['nome', 'sobrenome', 'email', 'telefone', 'cpf', 'password', 'confirmPassword'];
        
        requiredFields.forEach(field => {
            const input = form.querySelector(`[name="${field}"]`);
            const value = formData.get(field);
            
            if (!value || value.trim() === '') {
                const errorElement = document.getElementById(`${input.id}-error`);
                this.showFieldError(input, errorElement, 'Campo obrigatório');
                isValid = false;
            }
        });

        // Validate email
        const emailInput = form.querySelector('[name="email"]');
        if (!this.validateEmail(emailInput)) {
            isValid = false;
        }

        // Validate password strength
        const password = formData.get('password');
        if (password && password.length < 6) {
            const errorElement = document.getElementById('register-password-error');
            this.showFieldError(form.querySelector('[name="password"]'), errorElement, 'Senha deve ter pelo menos 6 caracteres');
            isValid = false;
        }

        // Validate password match
        const passwordInput = form.querySelector('[name="password"]');
        const confirmInput = form.querySelector('[name="confirmPassword"]');
        if (!this.validatePasswordMatch(passwordInput, confirmInput)) {
            isValid = false;
        }

        // Validate CPF
        const cpfInput = form.querySelector('[name="cpf"]');
        if (!this.validateCPF(cpfInput)) {
            isValid = false;
        }

        // Validate terms
        const termsInput = form.querySelector('[name="terms"]');
        if (!termsInput.checked) {
            const errorElement = document.getElementById('register-terms-error');
            errorElement.textContent = 'Você deve aceitar os termos de uso';
            isValid = false;
        }

        return isValid;
    }

    async handleForgotPassword(e) {
        e.preventDefault();
        
        const button = document.getElementById('forgot-button');
        const buttonText = button.querySelector('.button-text');
        const buttonLoader = button.querySelector('.button-loader');
        
        this.setButtonLoading(button, buttonText, buttonLoader, true);
        
        const formData = new FormData(e.target);
        const email = formData.get('email').trim();

        try {
            // Simulate API delay
            await this.delay(2000);

            // Check if email exists
            const user = this.users.find(u => u.email === email);
            
            if (!user) {
                throw new Error('Email não encontrado');
            }

            this.showMessage('Link de recuperação enviado para seu email!', 'success');
            
            // Switch back to login
            setTimeout(() => {
                this.switchForm('login');
            }, 2000);

        } catch (error) {
            this.showMessage(error.message, 'error');
        } finally {
            this.setButtonLoading(button, buttonText, buttonLoader, false);
        }
    }

    handleSocialLogin(provider) {
        this.showMessage(`Login com ${provider} será implementado em breve!`, 'info');
    }

    setButtonLoading(button, textElement, loaderElement, isLoading) {
        if (isLoading) {
            button.disabled = true;
            textElement.style.opacity = '0';
            loaderElement.style.display = 'block';
        } else {
            button.disabled = false;
            textElement.style.opacity = '1';
            loaderElement.style.display = 'none';
        }
    }

    showMessage(message, type = 'info') {
        const container = document.getElementById('auth-messages');
        const messageElement = document.createElement('div');
        messageElement.className = `auth-message ${type}`;
        messageElement.textContent = message;
        
        container.appendChild(messageElement);
        
        // Remove after 5 seconds
        setTimeout(() => {
            messageElement.remove();
        }, 5000);
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

    checkAuthState() {
        // If already logged in, redirect to profile or return URL
        if (this.currentUser) {
            const returnUrl = sessionStorage.getItem('returnUrl') || '../pages/perfil.html';
            sessionStorage.removeItem('returnUrl');
            window.location.href = returnUrl;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize auth system
document.addEventListener('DOMContentLoaded', () => {
    new AuthSystem();
});

// Utility functions for other pages
window.AuthUtils = {
    getCurrentUser() {
        return JSON.parse(localStorage.getItem('currentUser'));
    },
    
    isLoggedIn() {
        return !!this.getCurrentUser();
    },
    
    logout() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('rememberUser');
        window.location.href = '../pages/login.html';
    },
    
    requireAuth() {
        if (!this.isLoggedIn()) {
            sessionStorage.setItem('returnUrl', window.location.href);
            window.location.href = '../pages/login.html';
            return false;
        }
        return true;
    }
};