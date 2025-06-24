class SearchSystem {
    constructor() {
        this.searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
        this.searchSuggestions = JSON.parse(localStorage.getItem('searchSuggestions')) || [];
        this.products = this.getAllProducts();
        this.isVoiceSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
        this.searchDebounceTimer = null;
        this.currentQuery = '';
        this.isListening = false;
        this.init();
    }

    init() {
        this.setupGlobalSearch();
        this.setupVoiceSearch();
        this.loadSearchSuggestions();
        this.setupKeyboardShortcuts();
    }

    setupGlobalSearch() {
        const searchInput = document.getElementById('search');
        const searchIcon = document.querySelector('.pesquisa-icon');
        
        if (!searchInput) return;

        // Criar container de autocomplete
        this.createAutocompleteContainer(searchInput);

        // Event listeners
        searchInput.addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value);
        });

        searchInput.addEventListener('focus', () => {
            this.showSearchSuggestions();
        });

        searchInput.addEventListener('keydown', (e) => {
            this.handleSearchKeydown(e);
        });

        // Click no ícone de pesquisa
        searchIcon.addEventListener('click', () => {
            this.performSearch(searchInput.value);
        });

        // Click fora para fechar autocomplete
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideAutocomplete();
            }
        });
    }

    createAutocompleteContainer(searchInput) {
        const container = document.createElement('div');
        container.className = 'search-container';
        container.innerHTML = `
            <div class="search-input-wrapper">
                ${searchInput.outerHTML}
                <div class="search-actions">
                    ${this.isVoiceSupported ? `
                        <button class="voice-search-btn" title="Busca por voz">
                            <img src="../assets/icons/microphone.svg" alt="Busca por voz" class="voice-icon">
                        </button>
                    ` : ''}
                    <button class="clear-search-btn" title="Limpar busca" style="display: none;">
                        <img src="../assets/icons/x.svg" alt="Limpar" class="clear-icon">
                    </button>
                </div>
            </div>
            <div class="search-autocomplete" style="display: none;">
                <div class="autocomplete-content">
                    <!-- Sugestões serão inseridas aqui -->
                </div>
            </div>
        `;

        // Substituir o input original
        searchInput.parentNode.replaceChild(container, searchInput);

        // Reconfigurar referências
        this.searchInput = container.querySelector('#search');
        this.autocompleteContainer = container.querySelector('.search-autocomplete');
        this.autocompleteContent = container.querySelector('.autocomplete-content');
        
        // Setup dos novos botões
        this.setupSearchActions(container);
    }

    setupSearchActions(container) {
        const voiceBtn = container.querySelector('.voice-search-btn');
        const clearBtn = container.querySelector('.clear-search-btn');

        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => {
                this.toggleVoiceSearch();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearSearch();
            });
        }

        // Mostrar/esconder botão de limpar
        this.searchInput.addEventListener('input', (e) => {
            clearBtn.style.display = e.target.value ? 'flex' : 'none';
        });
    }

    handleSearchInput(value) {
        this.currentQuery = value.trim();
        
        // Debounce para performance
        clearTimeout(this.searchDebounceTimer);
        this.searchDebounceTimer = setTimeout(() => {
            this.updateAutocomplete(this.currentQuery);
        }, 300);

        // Mostrar autocomplete se há valor
        if (this.currentQuery.length > 0) {
            this.showAutocomplete();
        } else {
            this.showSearchSuggestions();
        }
    }

    updateAutocomplete(query) {
        if (!query) {
            this.showSearchSuggestions();
            return;
        }

        const suggestions = this.generateSuggestions(query);
        this.renderAutocomplete(suggestions);
    }

    generateSuggestions(query) {
        const suggestions = {
            products: [],
            categories: [],
            history: [],
            corrections: []
        };

        const queryLower = query.toLowerCase();

        // Buscar produtos
        suggestions.products = this.products
            .filter(product => 
                product.name.toLowerCase().includes(queryLower) ||
                product.category.toLowerCase().includes(queryLower) ||
                (product.tags && product.tags.some(tag => tag.toLowerCase().includes(queryLower)))
            )
            .slice(0, 5);

        // Buscar categorias
        const categories = [...new Set(this.products.map(p => p.category))];
        suggestions.categories = categories
            .filter(cat => cat.toLowerCase().includes(queryLower))
            .slice(0, 3);

        // Histórico de busca
        suggestions.history = this.searchHistory
            .filter(item => item.query.toLowerCase().includes(queryLower))
            .slice(0, 3);

        // Sugestões de correção (implementação básica)
        if (suggestions.products.length === 0 && query.length > 3) {
            suggestions.corrections = this.generateCorrections(query);
        }

        return suggestions;
    }

    generateCorrections(query) {
        // Algoritmo simples de correção baseado em Levenshtein distance
        const corrections = [];
        const queryLower = query.toLowerCase();
        
        this.products.forEach(product => {
            const words = product.name.toLowerCase().split(' ');
            words.forEach(word => {
                if (this.levenshteinDistance(queryLower, word) <= 2 && word.length > 3) {
                    if (!corrections.includes(word)) {
                        corrections.push(word);
                    }
                }
            });
        });

        return corrections.slice(0, 2);
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    renderAutocomplete(suggestions) {
        let html = '';

        // Produtos
        if (suggestions.products.length > 0) {
            html += `
                <div class="suggestion-section">
                    <div class="suggestion-header">
                        <img src="../assets/icons/shopping-bag.svg" alt="Produtos">
                        <span>Produtos</span>
                    </div>
                    <div class="suggestion-items">
                        ${suggestions.products.map(product => `
                            <div class="suggestion-item product-suggestion" data-type="product" data-id="${product.id}">
                                <img src="${product.image}" alt="${product.name}" class="suggestion-image">
                                <div class="suggestion-info">
                                    <div class="suggestion-title">${this.highlightQuery(product.name, this.currentQuery)}</div>
                                    <div class="suggestion-price">R$ ${product.price.toFixed(2).replace('.', ',')}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Categorias
        if (suggestions.categories.length > 0) {
            html += `
                <div class="suggestion-section">
                    <div class="suggestion-header">
                        <img src="../assets/icons/tag.svg" alt="Categorias">
                        <span>Categorias</span>
                    </div>
                    <div class="suggestion-items">
                        ${suggestions.categories.map(category => `
                            <div class="suggestion-item category-suggestion" data-type="category" data-value="${category}">
                                <img src="../assets/icons/folder.svg" alt="Categoria" class="suggestion-icon">
                                <div class="suggestion-info">
                                    <div class="suggestion-title">${this.highlightQuery(category, this.currentQuery)}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Histórico
        if (suggestions.history.length > 0) {
            html += `
                <div class="suggestion-section">
                    <div class="suggestion-header">
                        <img src="../assets/icons/clock.svg" alt="Histórico">
                        <span>Buscas recentes</span>
                    </div>
                    <div class="suggestion-items">
                        ${suggestions.history.map(item => `
                            <div class="suggestion-item history-suggestion" data-type="history" data-value="${item.query}">
                                <img src="../assets/icons/search.svg" alt="Busca" class="suggestion-icon">
                                <div class="suggestion-info">
                                    <div class="suggestion-title">${this.highlightQuery(item.query, this.currentQuery)}</div>
                                    <div class="suggestion-meta">${new Date(item.date).toLocaleDateString('pt-BR')}</div>
                                </div>
                                <button class="remove-history-btn" data-query="${item.query}">
                                    <img src="../assets/icons/x.svg" alt="Remover">
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Correções
        if (suggestions.corrections.length > 0) {
            html += `
                <div class="suggestion-section">
                    <div class="suggestion-header">
                        <img src="../assets/icons/edit.svg" alt="Sugestões">
                        <span>Você quis dizer?</span>
                    </div>
                    <div class="suggestion-items">
                        ${suggestions.corrections.map(correction => `
                            <div class="suggestion-item correction-suggestion" data-type="correction" data-value="${correction}">
                                <img src="../assets/icons/edit.svg" alt="Correção" class="suggestion-icon">
                                <div class="suggestion-info">
                                    <div class="suggestion-title">${correction}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // "Ver todos os resultados"
        if (this.currentQuery) {
            html += `
                <div class="suggestion-section">
                    <div class="suggestion-item view-all-suggestion" data-type="search" data-value="${this.currentQuery}">
                        <img src="../assets/icons/search.svg" alt="Buscar" class="suggestion-icon">
                        <div class="suggestion-info">
                            <div class="suggestion-title">Buscar por "${this.currentQuery}"</div>
                            <div class="suggestion-meta">Ver todos os resultados</div>
                        </div>
                        <img src="../assets/icons/arrow-right.svg" alt="Ir" class="suggestion-arrow">
                    </div>
                </div>
            `;
        }

        this.autocompleteContent.innerHTML = html;
        this.setupAutocompleteEvents();
    }

    showSearchSuggestions() {
        // Mostrar sugestões populares e histórico quando não há busca
        const popularSearches = [
            'camisetas', 'canecas', 'adesivos', 'livros', 'mousepad',
            'javascript', 'react', 'python', 'git', 'css'
        ];

        let html = '';

        // Histórico recente
        if (this.searchHistory.length > 0) {
            html += `
                <div class="suggestion-section">
                    <div class="suggestion-header">
                        <img src="../assets/icons/clock.svg" alt="Histórico">
                        <span>Buscas recentes</span>
                        <button class="clear-history-btn">Limpar</button>
                    </div>
                    <div class="suggestion-items">
                        ${this.searchHistory.slice(0, 5).map(item => `
                            <div class="suggestion-item history-suggestion" data-type="history" data-value="${item.query}">
                                <img src="../assets/icons/search.svg" alt="Busca" class="suggestion-icon">
                                <div class="suggestion-info">
                                    <div class="suggestion-title">${item.query}</div>
                                    <div class="suggestion-meta">${new Date(item.date).toLocaleDateString('pt-BR')}</div>
                                </div>
                                <button class="remove-history-btn" data-query="${item.query}">
                                    <img src="../assets/icons/x.svg" alt="Remover">
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Buscas populares
        html += `
            <div class="suggestion-section">
                <div class="suggestion-header">
                    <img src="../assets/icons/trending-up.svg" alt="Popular">
                    <span>Buscas populares</span>
                </div>
                <div class="suggestion-items">
                    ${popularSearches.map(search => `
                        <div class="suggestion-item popular-suggestion" data-type="popular" data-value="${search}">
                            <img src="../assets/icons/trending-up.svg" alt="Popular" class="suggestion-icon">
                            <div class="suggestion-info">
                                <div class="suggestion-title">${search}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        this.autocompleteContent.innerHTML = html;
        this.setupAutocompleteEvents();
        this.showAutocomplete();
    }

    setupAutocompleteEvents() {
        // Click em sugestões
        this.autocompleteContent.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleSuggestionClick(item);
            });
        });

        // Remover do histórico
        this.autocompleteContent.querySelectorAll('.remove-history-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeFromHistory(btn.dataset.query);
            });
        });

        // Limpar histórico
        const clearHistoryBtn = this.autocompleteContent.querySelector('.clear-history-btn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                this.clearSearchHistory();
            });
        }
    }

    handleSuggestionClick(item) {
        const type = item.dataset.type;
        const value = item.dataset.value;
        const id = item.dataset.id;

        switch (type) {
            case 'product':
                this.goToProduct(parseInt(id));
                break;
            case 'category':
            case 'history':
            case 'popular':
            case 'correction':
            case 'search':
                this.performSearch(value);
                break;
        }
    }

    highlightQuery(text, query) {
        if (!query) return text;
        
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    showAutocomplete() {
        this.autocompleteContainer.style.display = 'block';
        this.autocompleteContainer.classList.add('show');
    }

    hideAutocomplete() {
        this.autocompleteContainer.classList.remove('show');
        setTimeout(() => {
            this.autocompleteContainer.style.display = 'none';
        }, 200);
    }

    handleSearchKeydown(e) {
        const suggestions = this.autocompleteContent.querySelectorAll('.suggestion-item');
        let currentIndex = -1;

        // Encontrar item atualmente selecionado
        suggestions.forEach((item, index) => {
            if (item.classList.contains('selected')) {
                currentIndex = index;
            }
        });

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                currentIndex = Math.min(currentIndex + 1, suggestions.length - 1);
                this.updateSuggestionSelection(suggestions, currentIndex);
                break;

            case 'ArrowUp':
                e.preventDefault();
                currentIndex = Math.max(currentIndex - 1, -1);
                this.updateSuggestionSelection(suggestions, currentIndex);
                break;

            case 'Enter':
                e.preventDefault();
                if (currentIndex >= 0) {
                    this.handleSuggestionClick(suggestions[currentIndex]);
                } else {
                    this.performSearch(this.searchInput.value);
                }
                break;

            case 'Escape':
                this.hideAutocomplete();
                this.searchInput.blur();
                break;
        }
    }

    updateSuggestionSelection(suggestions, selectedIndex) {
        suggestions.forEach((item, index) => {
            item.classList.toggle('selected', index === selectedIndex);
        });

        // Scroll para manter item visível
        if (selectedIndex >= 0) {
            suggestions[selectedIndex].scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            });
        }
    }

    performSearch(query) {
        if (!query.trim()) return;

        // Adicionar ao histórico
        this.addToHistory(query.trim());

        // Esconder autocomplete
        this.hideAutocomplete();

        // Redirecionar para página de busca
        this.goToSearchPage(query.trim());
    }

    addToHistory(query) {
        // Remover se já existe
        this.searchHistory = this.searchHistory.filter(item => item.query !== query);

        // Adicionar no início
        this.searchHistory.unshift({
            query,
            date: new Date().toISOString(),
            count: 1
        });

        // Limitar a 20 itens
        this.searchHistory = this.searchHistory.slice(0, 20);

        // Salvar
        localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
    }

    removeFromHistory(query) {
        this.searchHistory = this.searchHistory.filter(item => item.query !== query);
        localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
        
        // Atualizar interface se estiver visível
        if (this.autocompleteContainer.style.display === 'block') {
            this.showSearchSuggestions();
        }
    }

    clearSearchHistory() {
        this.searchHistory = [];
        localStorage.removeItem('searchHistory');
        this.showSearchSuggestions();
    }

    clearSearch() {
        this.searchInput.value = '';
        this.currentQuery = '';
        this.hideAutocomplete();
        this.searchInput.focus();
    }

    goToProduct(productId) {
        sessionStorage.setItem('selectedProductId', productId);
        window.location.href = './pages/product.html';
    }

    goToSearchPage(query) {
        const encodedQuery = encodeURIComponent(query);
        window.location.href = `./pages/busca.html?q=${encodedQuery}`;
    }

    // Busca por voz
    setupVoiceSearch() {
        if (!this.isVoiceSupported) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'pt-BR';

        this.recognition.addEventListener('start', () => {
            this.isListening = true;
            this.updateVoiceButton();
        });

        this.recognition.addEventListener('end', () => {
            this.isListening = false;
            this.updateVoiceButton();
        });

        this.recognition.addEventListener('result', (e) => {
            const transcript = e.results[0][0].transcript;
            this.searchInput.value = transcript;
            this.currentQuery = transcript;
            this.performSearch(transcript);
        });

        this.recognition.addEventListener('error', (e) => {
            console.error('Erro na busca por voz:', e.error);
            this.isListening = false;
            this.updateVoiceButton();
            this.showMessage('Erro na busca por voz. Tente novamente.', 'error');
        });
    }

    toggleVoiceSearch() {
        if (this.isListening) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    }

    updateVoiceButton() {
        const voiceBtn = document.querySelector('.voice-search-btn');
        const voiceIcon = voiceBtn?.querySelector('.voice-icon');
        
        if (voiceBtn && voiceIcon) {
            if (this.isListening) {
                voiceBtn.classList.add('listening');
                voiceIcon.src = '../assets/icons/microphone-active.svg';
                voiceBtn.title = 'Parando...';
            } else {
                voiceBtn.classList.remove('listening');
                voiceIcon.src = '../assets/icons/microphone.svg';
                voiceBtn.title = 'Busca por voz';
            }
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K para focar na busca
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.searchInput.focus();
                this.searchInput.select();
            }

            // Ctrl/Cmd + / para busca por voz
            if ((e.ctrlKey || e.metaKey) && e.key === '/' && this.isVoiceSupported) {
                e.preventDefault();
                this.toggleVoiceSearch();
            }
        });
    }

    getAllProducts() {
        // Simular banco de dados de produtos
        return [
            {
                id: 1,
                name: 'Camiseta React Developer',
                category: 'Roupas',
                price: 79.90,
                image: '../assets/produtos/camiseta-react.jpg',
                tags: ['react', 'javascript', 'frontend', 'dev']
            },
            {
                id: 2,
                name: 'Caneca JavaScript Coffee',
                category: 'Canecas',
                price: 29.90,
                image: '../assets/produtos/caneca-js.jpg',
                tags: ['javascript', 'café', 'programador']
            },
            {
                id: 3,
                name: 'Mousepad Geek Code',
                category: 'Acessórios',
                price: 45.90,
                image: '../assets/produtos/mousepad-code.jpg',
                tags: ['mousepad', 'código', 'setup']
            },
            {
                id: 4,
                name: 'Livro Clean Code',
                category: 'Livros',
                price: 89.90,
                image: '../assets/produtos/livro-clean-code.jpg',
                tags: ['livro', 'clean code', 'programação']
            },
            {
                id: 5,
                name: 'Adesivos Git Commits',
                category: 'Adesivos',
                price: 15.90,
                image: '../assets/produtos/adesivos-git.jpg',
                tags: ['git', 'adesivos', 'versionamento']
            }
            // Mais produtos...
        ];
    }

    showMessage(message, type = 'info') {
        // Reutilizar sistema de notificações existente
        if (window.favoritesSystem) {
            window.favoritesSystem.showMessage(message, type);
        }
    }
}

// Inicializar sistema de busca
document.addEventListener('DOMContentLoaded', () => {
    window.searchSystem = new SearchSystem();
});