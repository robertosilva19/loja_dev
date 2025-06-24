/* filepath: c:\Users\janic\OneDrive\Área de Trabalho\Projetos\loja_dev\js\dark-mode.js */
// Sistema de Dark Mode Completo

class DarkModeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme() || this.getSystemTheme();
        this.toggleButtons = [];
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.createToggleButtons();
        this.setupEventListeners();
        this.handleSystemThemeChange();
        this.preventFlash();
    }

    // Obter tema armazenado
    getStoredTheme() {
        return localStorage.getItem('theme');
    }

    // Obter tema do sistema
    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // Aplicar tema
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.style.colorScheme = theme;
        
        // Atualizar meta theme-color para mobile
        this.updateMetaThemeColor(theme);
        
        // Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme, previousTheme: this.currentTheme }
        }));
        
        this.currentTheme = theme;
        localStorage.setItem('theme', theme);
        
        // Atualizar botões
        this.updateToggleButtons();
    }

    // Alternar tema
    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        
        // Adicionar animação de transição
        this.addTransitionAnimation();
        
        // Analytics (se implementado)
        this.trackThemeChange(newTheme);
    }

    // Criar botões de toggle
    createToggleButtons() {
        // Toggle para o header (minimalista)
        this.createHeaderToggle();
        
        // Toggle para configurações (completo)
        this.createSettingsToggle();
    }

    createHeaderToggle() {
        const header = document.querySelector('.cabecalho__nav_list');
        if (!header) return;

        const toggleContainer = document.createElement('li');
        toggleContainer.className = 'cabecalho__nav_list_item';
        
        const toggle = document.createElement('button');
        toggle.className = 'header-theme-toggle';
        toggle.setAttribute('aria-label', 'Alternar tema');
        toggle.setAttribute('title', 'Alternar entre tema claro e escuro');
        
        toggle.addEventListener('click', () => {
            toggle.classList.add('animating');
            this.toggleTheme();
            setTimeout(() => toggle.classList.remove('animating'), 600);
        });

        toggleContainer.appendChild(toggle);
        
        // Inserir antes do carrinho
        const carrinhoItem = header.querySelector('.cabecalho__nav_list_link-carrinho')?.parentElement;
        if (carrinhoItem) {
            header.insertBefore(toggleContainer, carrinhoItem);
        } else {
            header.appendChild(toggleContainer);
        }

        this.toggleButtons.push(toggle);
    }

    createSettingsToggle() {
        // Toggle mais detalhado para páginas de configurações
        const settingsContainer = document.getElementById('theme-settings');
        if (!settingsContainer) return;

        const toggle = document.createElement('div');
        toggle.className = 'theme-toggle';
        toggle.innerHTML = `
            <span class="theme-toggle-icon sun">☀️</span>
            <div class="theme-toggle-switch"></div>
            <span class="theme-toggle-icon moon">🌙</span>
        `;

        toggle.addEventListener('click', () => this.toggleTheme());
        settingsContainer.appendChild(toggle);
        
        this.toggleButtons.push(toggle);
    }

    // Atualizar botões
    updateToggleButtons() {
        this.toggleButtons.forEach(button => {
            if (button.classList.contains('header-theme-toggle')) {
                // Atualizar emoji do botão do header
                button.textContent = this.currentTheme === 'dark' ? '🌙' : '☀️';
            }
        });
    }

    // Setup de event listeners
    setupEventListeners() {
        // Atalho de teclado (Ctrl/Cmd + Shift + D)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.toggleTheme();
                this.showThemeNotification();
            }
        });

        // Escutar mudanças de tema do sistema
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!this.getStoredTheme()) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });

        // Escutar eventos de storage para sincronizar entre abas
        window.addEventListener('storage', (e) => {
            if (e.key === 'theme' && e.newValue !== this.currentTheme) {
                this.applyTheme(e.newValue);
            }
        });
    }

    // Monitorar mudanças do tema do sistema
    handleSystemThemeChange() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            // Só aplicar se o usuário não tiver preferência definida
            if (!this.getStoredTheme()) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    // Atualizar meta theme-color
    updateMetaThemeColor(theme) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }

        const colors = {
            light: '#ffffff',
            dark: '#1a1a1a'
        };

        metaThemeColor.content = colors[theme];
    }

    // Adicionar animação de transição
    addTransitionAnimation() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: ${this.currentTheme === 'dark' ? '#000' : '#fff'};
            opacity: 0;
            pointer-events: none;
            z-index: 9999;
            transition: opacity 0.3s ease;
        `;

        document.body.appendChild(overlay);

        // Animar
        requestAnimationFrame(() => {
            overlay.style.opacity = '0.1';
            setTimeout(() => {
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 300);
            }, 150);
        });
    }

    // Prevenir flash durante carregamento
    preventFlash() {
        const style = document.createElement('style');
        style.textContent = `
            html:not([data-theme]) {
                visibility: hidden;
            }
            html[data-theme] {
                visibility: visible;
            }
        `;
        document.head.appendChild(style);

        // Remover depois que a página carregar
        window.addEventListener('load', () => {
            setTimeout(() => style.remove(), 100);
        });
    }

    // Mostrar notificação de mudança de tema
    showThemeNotification() {
        const notification = document.createElement('div');
        notification.className = 'theme-notification';
        notification.innerHTML = `
            <div class="theme-notification-content">
                <span class="theme-notification-icon">
                    ${this.currentTheme === 'dark' ? '🌙' : '☀️'}
                </span>
                <span class="theme-notification-text">
                    Tema ${this.currentTheme === 'dark' ? 'escuro' : 'claro'} ativado
                </span>
            </div>
        `;

        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: var(--bg-primary);
            color: var(--text-primary);
            padding: 1rem 1.5rem;
            border-radius: 25px;
            box-shadow: 0 8px 25px var(--shadow-heavy);
            border: 1px solid var(--border-color);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 600;
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Animar entrada
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(-50%) translateY(0)';
        });

        // Remover após 2 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(-50%) translateY(100px)';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    // Analytics de tema (opcional)
    trackThemeChange(newTheme) {
        // Implementar tracking se necessário
        if (window.gtag) {
            gtag('event', 'theme_change', {
                theme: newTheme,
                timestamp: new Date().toISOString()
            });
        }

        // Local analytics
        const themeChanges = JSON.parse(localStorage.getItem('theme_analytics')) || [];
        themeChanges.push({
            theme: newTheme,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        });

        // Manter apenas os últimos 10 registros
        if (themeChanges.length > 10) {
            themeChanges.splice(0, themeChanges.length - 10);
        }

        localStorage.setItem('theme_analytics', JSON.stringify(themeChanges));
    }

    // API pública
    getCurrentTheme() {
        return this.currentTheme;
    }

    setTheme(theme) {
        if (['light', 'dark'].includes(theme)) {
            this.applyTheme(theme);
        }
    }

    resetToSystemTheme() {
        localStorage.removeItem('theme');
        this.applyTheme(this.getSystemTheme());
    }

    // Configurações avançadas
    getThemePreferences() {
        return {
            current: this.currentTheme,
            stored: this.getStoredTheme(),
            system: this.getSystemTheme(),
            autoSwitch: !this.getStoredTheme(),
            lastChanged: localStorage.getItem('theme_last_changed'),
            changeCount: JSON.parse(localStorage.getItem('theme_analytics'))?.length || 0
        };
    }

    enableAutoSwitch() {
        localStorage.removeItem('theme');
        this.applyTheme(this.getSystemTheme());
    }

    disableAutoSwitch() {
        localStorage.setItem('theme', this.currentTheme);
    }
}

// Inicializar Dark Mode
let darkMode;

// Carregar tema imediatamente (antes do DOM)
(function() {
    const storedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const theme = storedTheme || systemTheme;
    
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
})();

// Inicializar após DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    darkMode = new DarkModeManager();
});

// API global
window.DarkModeAPI = {
    toggle: () => darkMode?.toggleTheme(),
    setTheme: (theme) => darkMode?.setTheme(theme),
    getCurrentTheme: () => darkMode?.getCurrentTheme(),
    resetToSystem: () => darkMode?.resetToSystemTheme(),
    getPreferences: () => darkMode?.getThemePreferences(),
    enableAutoSwitch: () => darkMode?.enableAutoSwitch(),
    disableAutoSwitch: () => darkMode?.disableAutoSwitch()
};

// Atalho global para desenvolvedores
window.toggleTheme = () => darkMode?.toggleTheme();