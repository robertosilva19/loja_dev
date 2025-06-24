class SearchPageManager {
    constructor() {
        this.query = this.getQueryFromURL();
        this.allProducts = this.getAllProducts();
        this.filteredProducts = [...this.allProducts];
        this.displayedProducts = [];
        
        // Configurações
        this.itemsPerPage = 12;
        this.currentPage = 1;
        this.currentView = 'grid'; // 'grid' ou 'list'
        this.currentSort = 'relevance';
        
        // Filtros ativos
        this.activeFilters = {
            categories: [],
            priceMin: 0,
            priceMax: 500,
            rating: [],
            availability: []
        };
        
        // Estado
        this.isLoading = false;
        this.savedSearches = JSON.parse(localStorage.getItem('savedSearches')) || [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateBreadcrumb();
        this.updateSearchTitle();
        this.performSearch();
        this.updateCartCount();
        this.loadSavedSearchState();
    }

    getQueryFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('q') || '';
    }

    updateBreadcrumb() {
        const breadcrumbQuery = document.getElementById('breadcrumb-query');
        if (breadcrumbQuery) {
            breadcrumbQuery.textContent = this.query ? `Busca: "${this.query}"` : 'Busca';
        }
    }

    updateSearchTitle() {
        const searchTitle = document.getElementById('search-title');
        const searchSubtitle = document.getElementById('search-subtitle');
        
        if (searchTitle) {
            searchTitle.textContent = this.query ? 
                `Resultados para "${this.query}"` : 
                'Todos os produtos';
        }
    }

    setupEventListeners() {
        // Filtros de categoria
        document.querySelectorAll('input[name="category"]').forEach(input => {
            input.addEventListener('change', () => {
                this.handleCategoryFilter(input.value, input.checked);
            });
        });

        // Filtros de preço
        this.setupPriceFilters();

        // Filtros de avaliação
        document.querySelectorAll('input[name="rating"]').forEach(input => {
            input.addEventListener('change', () => {
                this.handleRatingFilter(input.value, input.checked);
            });
        });

        // Filtros de disponibilidade
        document.querySelectorAll('input[name="availability"]').forEach(input => {
            input.addEventListener('change', () => {
                this.handleAvailabilityFilter(input.value, input.checked);
            });
        });

        // Ordenação
        const sortSelect = document.getElementById('sort-results');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.handleSort(e.target.value);
            });
        }

        // Toggle de visualização
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.switchView(view);
            });
        });

        // Botões de ação
        this.setupActionButtons();

        // Toggle de filtros
        this.setupFilterToggles();

        // Filtros mobile
        this.setupMobileFilters();

        // Paginação
        this.setupPagination();

        // Salvar busca
        const saveSearchBtn = document.getElementById('save-search');
        if (saveSearchBtn) {
            saveSearchBtn.addEventListener('click', () => {
                this.toggleSaveSearch();
            });
        }

        // Limpar filtros
        const clearFiltersBtn = document.getElementById('clear-all-filters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }

        // Atalhos de teclado
        this.setupKeyboardShortcuts();
    }

    setupPriceFilters() {
        const minPriceInput = document.getElementById('min-price');
        const maxPriceInput = document.getElementById('max-price');
        const minSlider = document.getElementById('price-slider-min');
        const maxSlider = document.getElementById('price-slider-max');

        // Inputs de texto
        [minPriceInput, maxPriceInput].forEach(input => {
            if (input) {
                input.addEventListener('input', this.debounce(() => {
                    this.updatePriceFromInputs();
                }, 500));
            }
        });

        // Sliders
        [minSlider, maxSlider].forEach(slider => {
            if (slider) {
                slider.addEventListener('input', () => {
                    this.updatePriceFromSliders();
                });
            }
        });

        // Presets de preço
        document.querySelectorAll('.price-preset').forEach(preset => {
            preset.addEventListener('click', () => {
                const min = parseInt(preset.dataset.min);
                const max = parseInt(preset.dataset.max);
                this.setPriceRange(min, max);
                this.updatePriceInputs(min, max);
                this.updateActivePreset(preset);
            });
        });
    }

    updatePriceFromInputs() {
        const minPrice = parseInt(document.getElementById('min-price').value) || 0;
        const maxPrice = parseInt(document.getElementById('max-price').value) || 500;
        
        this.setPriceRange(minPrice, maxPrice);
        this.updateSliders(minPrice, maxPrice);
    }

    updatePriceFromSliders() {
        const minSlider = document.getElementById('price-slider-min');
        const maxSlider = document.getElementById('price-slider-max');
        
        let minVal = parseInt(minSlider.value);
        let maxVal = parseInt(maxSlider.value);

        // Garantir que min não seja maior que max
        if (minVal > maxVal) {
            [minVal, maxVal] = [maxVal, minVal];
            minSlider.value = minVal;
            maxSlider.value = maxVal;
        }

        this.setPriceRange(minVal, maxVal);
        this.updatePriceInputs(minVal, maxVal);
    }

    setPriceRange(min, max) {
        this.activeFilters.priceMin = min;
        this.activeFilters.priceMax = max;
        this.applyFilters();
    }

    updatePriceInputs(min, max) {
        const minInput = document.getElementById('min-price');
        const maxInput = document.getElementById('max-price');
        
        if (minInput) minInput.value = min;
        if (maxInput) maxInput.value = max;
    }

    updateSliders(min, max) {
        const minSlider = document.getElementById('price-slider-min');
        const maxSlider = document.getElementById('price-slider-max');
        
        if (minSlider) minSlider.value = min;
        if (maxSlider) maxSlider.value = max;
    }

    updateActivePreset(activePreset) {
        document.querySelectorAll('.price-preset').forEach(preset => {
            preset.classList.remove('active');
        });
        activePreset.classList.add('active');
    }

    handleCategoryFilter(category, checked) {
        if (checked) {
            if (!this.activeFilters.categories.includes(category)) {
                this.activeFilters.categories.push(category);
            }
        } else {
            this.activeFilters.categories = this.activeFilters.categories.filter(c => c !== category);
        }
        this.applyFilters();
    }

    handleRatingFilter(rating, checked) {
        const ratingNum = parseInt(rating);
        if (checked) {
            if (!this.activeFilters.rating.includes(ratingNum)) {
                this.activeFilters.rating.push(ratingNum);
            }
        } else {
            this.activeFilters.rating = this.activeFilters.rating.filter(r => r !== ratingNum);
        }
        this.applyFilters();
    }

    handleAvailabilityFilter(availability, checked) {
        if (checked) {
            if (!this.activeFilters.availability.includes(availability)) {
                this.activeFilters.availability.push(availability);
            }
        } else {
            this.activeFilters.availability = this.activeFilters.availability.filter(a => a !== availability);
        }
        this.applyFilters();
    }

    applyFilters() {
        this.showLoading();
        
        setTimeout(() => {
            let filtered = [...this.allProducts];

            // Filtrar por termo de busca
            if (this.query) {
                filtered = filtered.filter(product => 
                    product.name.toLowerCase().includes(this.query.toLowerCase()) ||
                    product.category.toLowerCase().includes(this.query.toLowerCase()) ||
                    (product.tags && product.tags.some(tag => 
                        tag.toLowerCase().includes(this.query.toLowerCase())
                    ))
                );
            }

            // Filtrar por categorias
            if (this.activeFilters.categories.length > 0) {
                filtered = filtered.filter(product => 
                    this.activeFilters.categories.includes(product.category.toLowerCase())
                );
            }

            // Filtrar por preço
            filtered = filtered.filter(product => 
                product.price >= this.activeFilters.priceMin && 
                product.price <= this.activeFilters.priceMax
            );

            // Filtrar por avaliação
            if (this.activeFilters.rating.length > 0) {
                filtered = filtered.filter(product => 
                    this.activeFilters.rating.includes(Math.floor(product.rating || 4))
                );
            }

            // Filtrar por disponibilidade
            if (this.activeFilters.availability.length > 0) {
                filtered = filtered.filter(product => {
                    return this.activeFilters.availability.some(filter => {
                        switch (filter) {
                            case 'in-stock':
                                return product.inStock !== false;
                            case 'on-sale':
                                return product.onSale === true;
                            case 'new':
                                return product.isNew === true;
                            default:
                                return true;
                        }
                    });
                });
            }

            this.filteredProducts = filtered;
            this.currentPage = 1;
            this.sortProducts(this.currentSort);
            this.updateActiveFiltersDisplay();
            this.hideLoading();
        }, 300);
    }

    sortProducts(sortType) {
        this.currentSort = sortType;
        
        switch (sortType) {
            case 'price-asc':
                this.filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                this.filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'name-asc':
                this.filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                this.filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'rating':
                this.filteredProducts.sort((a, b) => (b.rating || 4) - (a.rating || 4));
                break;
            case 'newest':
                this.filteredProducts.sort((a, b) => new Date(b.createdAt || '2024-01-01') - new Date(a.createdAt || '2024-01-01'));
                break;
            case 'relevance':
            default:
                // Ordenação por relevância (baseada na busca)
                if (this.query) {
                    this.filteredProducts.sort((a, b) => {
                        const aScore = this.calculateRelevanceScore(a, this.query);
                        const bScore = this.calculateRelevanceScore(b, this.query);
                        return bScore - aScore;
                    });
                }
                break;
        }

        this.updateProductsDisplay();
        this.updatePagination();
    }

    calculateRelevanceScore(product, query) {
        const queryLower = query.toLowerCase();
        let score = 0;

        // Nome exato
        if (product.name.toLowerCase() === queryLower) score += 100;
        
        // Nome contém a busca
        if (product.name.toLowerCase().includes(queryLower)) score += 50;
        
        // Categoria exata
        if (product.category.toLowerCase() === queryLower) score += 30;
        
        // Categoria contém
        if (product.category.toLowerCase().includes(queryLower)) score += 15;
        
        // Tags
        if (product.tags) {
            product.tags.forEach(tag => {
                if (tag.toLowerCase() === queryLower) score += 20;
                if (tag.toLowerCase().includes(queryLower)) score += 10;
            });
        }

        return score;
    }

    handleSort(sortType) {
        this.sortProducts(sortType);
    }

    switchView(view) {
        this.currentView = view;
        
        // Atualizar botões
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // Atualizar grid
        const productsGrid = document.getElementById('products-grid');
        if (productsGrid) {
            productsGrid.classList.toggle('list-view', view === 'list');
        }

        // Renderizar produtos novamente
        this.updateProductsDisplay();
        
        // Salvar preferência
        localStorage.setItem('searchViewPreference', view);
    }

    updateProductsDisplay() {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        this.displayedProducts = this.filteredProducts.slice(start, end);

        this.renderProducts();
        this.updateResultsInfo();
        this.checkNoResults();
    }

    renderProducts() {
        const productsGrid = document.getElementById('products-grid');
        if (!productsGrid) return;

        if (this.displayedProducts.length === 0) {
            productsGrid.innerHTML = '';
            return;
        }

        const isListView = this.currentView === 'list';
        
        productsGrid.innerHTML = this.displayedProducts.map(product => `
            <div class="search-product-card ${isListView ? 'list-view' : 'grid-view'}" data-product-id="${product.id}">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                    ${product.onSale ? '<div class="product-badge sale">Promoção</div>' : ''}
                    ${product.isNew ? '<div class="product-badge new">Novo</div>' : ''}
                </div>
                <div class="product-info">
                    ${isListView ? `
                        <div class="product-details">
                            <h3 class="product-name">${product.name}</h3>
                            <div class="product-rating">
                                <span class="stars">${'⭐'.repeat(Math.floor(product.rating || 4))}</span>
                                <span class="rating-count">(${product.reviewCount || 0})</span>
                            </div>
                        </div>
                        <div class="product-price">R$ ${product.price.toFixed(2).replace('.', ',')}</div>
                    ` : `
                        <h3 class="product-name">${product.name}</h3>
                        <div class="product-rating">
                            <span class="stars">${'⭐'.repeat(Math.floor(product.rating || 4))}</span>
                            <span class="rating-count">(${product.reviewCount || 0})</span>
                        </div>
                        <div class="product-price">R$ ${product.price.toFixed(2).replace('.', ',')}</div>
                    `}
                    <div class="product-actions">
                        <button class="btn-action btn-favorite ${this.isFavorite(product.id) ? 'active' : ''}" 
                                data-product-id="${product.id}"
                                title="Adicionar aos favoritos">
                            <img src="../assets/icons/heart.svg" alt="Favorito">
                        </button>
                        <button class="btn-action btn-cart" 
                                data-product-id="${product.id}"
                                title="Adicionar ao carrinho">
                            <img src="../assets/icons/shopping-cart.svg" alt="Carrinho">
                        </button>
                        <button class="btn-action btn-view" 
                                data-product-id="${product.id}"
                                title="Ver produto">
                            <img src="../assets/icons/eye.svg" alt="Ver">
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Configurar eventos dos produtos
        this.setupProductEvents();

        // Aplicar animação escalonada
        this.animateProducts();
    }

    setupProductEvents() {
        // Botões de favorito
        document.querySelectorAll('.btn-favorite').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = parseInt(btn.dataset.productId);
                this.toggleFavorite(productId, btn);
            });
        });

        // Botões de carrinho
        document.querySelectorAll('.btn-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = parseInt(btn.dataset.productId);
                this.addToCart(productId);
            });
        });

        // Botões de visualizar
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = parseInt(btn.dataset.productId);
                this.viewProduct(productId);
            });
        });

        // Click no card
        document.querySelectorAll('.search-product-card').forEach(card => {
            card.addEventListener('click', () => {
                const productId = parseInt(card.dataset.productId);
                this.viewProduct(productId);
            });
        });
    }

    animateProducts() {
        const cards = document.querySelectorAll('.search-product-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
        });
    }

    isFavorite(productId) {
        const favorites = JSON.parse(localStorage.getItem('favoritos')) || [];
        return favorites.some(fav => fav.id === productId);
    }

    toggleFavorite(productId, btn) {
        if (window.favoritesSystem) {
            window.favoritesSystem.toggleFavorite(productId);
            btn.classList.toggle('active');
        }
    }

    addToCart(productId) {
        // Integrar com sistema de carrinho quando implementado
        this.showMessage('Produto adicionado ao carrinho!', 'success');
        this.updateCartCount();
    }

    viewProduct(productId) {
        sessionStorage.setItem('selectedProductId', productId);
        window.location.href = './produto.html';
    }

    updateCartCount() {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            cartCount.textContent = cart.length;
        }
    }

    updateResultsInfo() {
        const resultsCount = document.getElementById('results-count');
        const resultsRange = document.getElementById('results-range');
        
        if (resultsCount) {
            resultsCount.textContent = this.filteredProducts.length;
        }
        
        if (resultsRange) {
            const start = (this.currentPage - 1) * this.itemsPerPage + 1;
            const end = Math.min(start + this.itemsPerPage - 1, this.filteredProducts.length);
            const total = this.filteredProducts.length;
            
            resultsRange.textContent = total > 0 ? 
                `${start}-${end} de ${total} resultados` : 
                'Nenhum resultado encontrado';
        }
    }

    updateActiveFiltersDisplay() {
        const activeFiltersContainer = document.getElementById('active-filters');
        const filterTagsContainer = document.getElementById('filter-tags');
        
        if (!activeFiltersContainer || !filterTagsContainer) return;

        let hasActiveFilters = false;
        let filterHTML = '';

        // Categorias
        this.activeFilters.categories.forEach(category => {
            hasActiveFilters = true;
            filterHTML += `
                <div class="filter-tag">
                    <span>${this.formatCategoryName(category)}</span>
                    <button onclick="searchPage.removeFilter('category', '${category}')" title="Remover filtro">×</button>
                </div>
            `;
        });

        // Preço
        if (this.activeFilters.priceMin > 0 || this.activeFilters.priceMax < 500) {
            hasActiveFilters = true;
            filterHTML += `
                <div class="filter-tag">
                    <span>R$ ${this.activeFilters.priceMin} - R$ ${this.activeFilters.priceMax}</span>
                    <button onclick="searchPage.removeFilter('price')" title="Remover filtro">×</button>
                </div>
            `;
        }

        // Avaliação
        this.activeFilters.rating.forEach(rating => {
            hasActiveFilters = true;
            filterHTML += `
                <div class="filter-tag">
                    <span>${rating}+ estrelas</span>
                    <button onclick="searchPage.removeFilter('rating', ${rating})" title="Remover filtro">×</button>
                </div>
            `;
        });

        // Disponibilidade
        this.activeFilters.availability.forEach(availability => {
            hasActiveFilters = true;
            filterHTML += `
                <div class="filter-tag">
                    <span>${this.formatAvailabilityName(availability)}</span>
                    <button onclick="searchPage.removeFilter('availability', '${availability}')" title="Remover filtro">×</button>
                </div>
            `;
        });

        filterTagsContainer.innerHTML = filterHTML;
        activeFiltersContainer.style.display = hasActiveFilters ? 'block' : 'none';
    }

    removeFilter(type, value) {
        switch (type) {
            case 'category':
                this.activeFilters.categories = this.activeFilters.categories.filter(c => c !== value);
                document.querySelector(`input[name="category"][value="${value}"]`).checked = false;
                break;
            case 'rating':
                this.activeFilters.rating = this.activeFilters.rating.filter(r => r !== parseInt(value));
                document.querySelector(`input[name="rating"][value="${value}"]`).checked = false;
                break;
            case 'availability':
                this.activeFilters.availability = this.activeFilters.availability.filter(a => a !== value);
                document.querySelector(`input[name="availability"][value="${value}"]`).checked = false;
                break;
            case 'price':
                this.activeFilters.priceMin = 0;
                this.activeFilters.priceMax = 500;
                this.updatePriceInputs(0, 500);
                this.updateSliders(0, 500);
                document.querySelectorAll('.price-preset').forEach(preset => {
                    preset.classList.remove('active');
                });
                break;
        }
        this.applyFilters();
    }

    clearAllFilters() {
        // Resetar filtros
        this.activeFilters = {
            categories: [],
            priceMin: 0,
            priceMax: 500,
            rating: [],
            availability: []
        };

        // Desmarcar checkboxes
        document.querySelectorAll('input[type="checkbox"]').forEach(input => {
            input.checked = false;
        });

        // Resetar preços
        this.updatePriceInputs(0, 500);
        this.updateSliders(0, 500);
        document.querySelectorAll('.price-preset').forEach(preset => {
            preset.classList.remove('active');
        });

        // Aplicar filtros
        this.applyFilters();
    }

    formatCategoryName(category) {
        const names = {
            'roupas': 'Roupas',
            'canecas': 'Canecas',
            'acessorios': 'Acessórios',
            'livros': 'Livros',
            'adesivos': 'Adesivos'
        };
        return names[category] || category;
    }

    formatAvailabilityName(availability) {
        const names = {
            'in-stock': 'Em estoque',
            'on-sale': 'Em promoção',
            'new': 'Novidades'
        };
        return names[availability] || availability;
    }

    checkNoResults() {
        const noResults = document.getElementById('no-results');
        const productsGrid = document.getElementById('products-grid');
        
        if (this.filteredProducts.length === 0) {
            noResults.style.display = 'block';
            productsGrid.style.display = 'none';
        } else {
            noResults.style.display = 'none';
            productsGrid.style.display = 'grid';
        }
    }

    showLoading() {
        this.isLoading = true;
        const loadingElement = document.getElementById('search-loading');
        const productsGrid = document.getElementById('products-grid');
        
        if (loadingElement && productsGrid) {
            loadingElement.style.display = 'block';
            productsGrid.style.display = 'none';
        }
    }

    hideLoading() {
        this.isLoading = false;
        const loadingElement = document.getElementById('search-loading');
        
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        this.updateProductsDisplay();
    }

    setupActionButtons() {
        // Já implementado em setupProductEvents
    }

    setupFilterToggles() {
        document.querySelectorAll('.filter-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const target = toggle.dataset.target;
                const content = document.getElementById(target);
                
                if (content) {
                    const isCollapsed = content.classList.contains('collapsed');
                    content.classList.toggle('collapsed');
                    toggle.classList.toggle('collapsed', !isCollapsed);
                }
            });
        });
    }

    setupMobileFilters() {
        // Criar botão de toggle para mobile se não existir
        const mobileToggle = document.querySelector('.mobile-filters-toggle');
        if (!mobileToggle) {
            const toggleHTML = `
                <button class="mobile-filters-toggle">
                    <img src="../assets/icons/filter.svg" alt="Filtros">
                    Filtros
                </button>
            `;
            
            const searchResults = document.querySelector('.search-results');
            if (searchResults) {
                searchResults.insertAdjacentHTML('afterbegin', toggleHTML);
                
                document.querySelector('.mobile-filters-toggle').addEventListener('click', () => {
                    const filters = document.querySelector('.search-filters');
                    filters.classList.toggle('mobile-hidden');
                });
            }
        }
    }

    setupPagination() {
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.goToPage(this.currentPage - 1);
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
                if (this.currentPage < totalPages) {
                    this.goToPage(this.currentPage + 1);
                }
            });
        }
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const numbersContainer = document.getElementById('pagination-numbers');
        
        // Atualizar botões prev/next
        if (prevBtn) {
            prevBtn.disabled = this.currentPage === 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentPage === totalPages || totalPages === 0;
        }
        
        // Gerar números da paginação
        if (numbersContainer) {
            numbersContainer.innerHTML = this.generatePaginationNumbers(totalPages);
            
            // Eventos dos números
            numbersContainer.querySelectorAll('.pagination-number').forEach(btn => {
                btn.addEventListener('click', () => {
                    const page = parseInt(btn.textContent);
                    this.goToPage(page);
                });
            });
        }
    }

    generatePaginationNumbers(totalPages) {
        if (totalPages <= 1) return '';
        
        let html = '';
        const current = this.currentPage;
        const delta = 2; // Quantos números mostrar de cada lado
        
        // Primeira página
        if (current > delta + 1) {
            html += `<button class="pagination-number">1</button>`;
            if (current > delta + 2) {
                html += `<span class="pagination-dots">...</span>`;
            }
        }
        
        // Páginas ao redor da atual
        for (let i = Math.max(1, current - delta); i <= Math.min(totalPages, current + delta); i++) {
            html += `<button class="pagination-number ${i === current ? 'active' : ''}">${i}</button>`;
        }
        
        // Última página
        if (current < totalPages - delta) {
            if (current < totalPages - delta - 1) {
                html += `<span class="pagination-dots">...</span>`;
            }
            html += `<button class="pagination-number">${totalPages}</button>`;
        }
        
        return html;
    }

    goToPage(page) {
        this.currentPage = page;
        this.updateProductsDisplay();
        this.updatePagination();
        
        // Scroll para o topo dos resultados
        document.querySelector('.search-results').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    performSearch() {
        this.applyFilters();
    }

    toggleSaveSearch() {
        const saveBtn = document.getElementById('save-search');
        if (!saveBtn || !this.query) return;
        
        const searchData = {
            query: this.query,
            filters: { ...this.activeFilters },
            date: new Date().toISOString()
        };
        
        const existingIndex = this.savedSearches.findIndex(s => s.query === this.query);
        
        if (existingIndex >= 0) {
            // Remover busca salva
            this.savedSearches.splice(existingIndex, 1);
            saveBtn.classList.remove('saved');
            saveBtn.innerHTML = `
                <img src="../assets/icons/bookmark.svg" alt="Salvar busca">
                Salvar busca
            `;
            this.showMessage('Busca removida dos salvos', 'info');
        } else {
            // Adicionar busca salva
            this.savedSearches.unshift(searchData);
            this.savedSearches = this.savedSearches.slice(0, 10); // Limitar a 10
            saveBtn.classList.add('saved');
            saveBtn.innerHTML = `
                <img src="../assets/icons/bookmark-filled.svg" alt="Busca salva">
                Busca salva
            `;
            this.showMessage('Busca salva com sucesso!', 'success');
        }
        
        localStorage.setItem('savedSearches', JSON.stringify(this.savedSearches));
    }

    loadSavedSearchState() {
        const saveBtn = document.getElementById('save-search');
        if (!saveBtn || !this.query) return;
        
        const isSaved = this.savedSearches.some(s => s.query === this.query);
        if (isSaved) {
            saveBtn.classList.add('saved');
            saveBtn.innerHTML = `
                <img src="../assets/icons/bookmark-filled.svg" alt="Busca salva">
                Busca salva
            `;
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (this.isLoading) return;
            
            // Esc - Limpar filtros
            if (e.key === 'Escape') {
                this.clearAllFilters();
            }
            
            // G - Grid view
            if (e.key === 'g' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.switchView('grid');
            }
            
            // L - List view
            if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.switchView('list');
            }
            
            // Setas para navegação
            if (e.key === 'ArrowLeft' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                if (this.currentPage > 1) {
                    this.goToPage(this.currentPage - 1);
                }
            }
            
            if (e.key === 'ArrowRight' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                const totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
                if (this.currentPage < totalPages) {
                    this.goToPage(this.currentPage + 1);
                }
            }
        });
    }

    // Utility functions
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    showMessage(message, type = 'info') {
        // Reutilizar sistema de notificações existente
        if (window.favoritesSystem) {
            window.favoritesSystem.showMessage(message, type);
        }
    }

    getAllProducts() {
        // Simular banco de dados expandido de produtos
        return [
            {
                id: 1,
                name: 'Camiseta React Developer',
                category: 'roupas',
                price: 79.90,
                image: '../assets/produtos/camiseta-react.jpg',
                tags: ['react', 'javascript', 'frontend', 'dev'],
                rating: 4.8,
                reviewCount: 24,
                inStock: true,
                onSale: false,
                isNew: false,
                createdAt: '2024-01-15'
            },
            {
                id: 2,
                name: 'Caneca JavaScript Coffee',
                category: 'canecas',
                price: 29.90,
                image: '../assets/produtos/caneca-js.jpg',
                tags: ['javascript', 'café', 'programador'],
                rating: 4.5,
                reviewCount: 18,
                inStock: true,
                onSale: true,
                isNew: false,
                createdAt: '2024-01-10'
            },
            {
                id: 3,
                name: 'Mousepad Geek Code',
                category: 'acessorios',
                price: 45.90,
                image: '../assets/produtos/mousepad-code.jpg',
                tags: ['mousepad', 'código', 'setup'],
                rating: 4.2,
                reviewCount: 12,
                inStock: true,
                onSale: false,
                isNew: true,
                createdAt: '2024-01-20'
            },
            {
                id: 4,
                name: 'Livro Clean Code',
                category: 'livros',
                price: 89.90,
                image: '../assets/produtos/livro-clean-code.jpg',
                tags: ['livro', 'clean code', 'programação'],
                rating: 4.9,
                reviewCount: 31,
                inStock: true,
                onSale: false,
                isNew: false,
                createdAt: '2024-01-05'
            },
            {
                id: 5,
                name: 'Adesivos Git Commits',
                category: 'adesivos',
                price: 15.90,
                image: '../assets/produtos/adesivos-git.jpg',
                tags: ['git', 'adesivos', 'versionamento'],
                rating: 4.3,
                reviewCount: 8,
                inStock: true,
                onSale: true,
                isNew: true,
                createdAt: '2024-01-25'
            },
            // Produtos adicionais para demonstrar funcionalidades
            {
                id: 6,
                name: 'Camiseta Python Programming',
                category: 'roupas',
                price: 69.90,
                image: '../assets/produtos/camiseta-python.jpg',
                tags: ['python', 'programming', 'backend'],
                rating: 4.6,
                reviewCount: 15,
                inStock: true,
                onSale: false,
                isNew: true,
                createdAt: '2024-01-22'
            },
            {
                id: 7,
                name: 'Caneca Vue.js Developer',
                category: 'canecas',
                price: 32.90,
                image: '../assets/produtos/caneca-vue.jpg',
                tags: ['vue', 'javascript', 'frontend'],
                rating: 4.4,
                reviewCount: 9,
                inStock: false,
                onSale: false,
                isNew: false,
                createdAt: '2024-01-08'
            },
            {
                id: 8,
                name: 'Teclado Mecânico RGB',
                category: 'acessorios',
                price: 299.90,
                image: '../assets/produtos/teclado-rgb.jpg',
                tags: ['teclado', 'mecânico', 'rgb', 'gaming'],
                rating: 4.7,
                reviewCount: 42,
                inStock: true,
                onSale: true,
                isNew: false,
                createdAt: '2024-01-12'
            },
            {
                id: 9,
                name: 'Livro JavaScript Patterns',
                category: 'livros',
                price: 67.90,
                image: '../assets/produtos/livro-js-patterns.jpg',
                tags: ['javascript', 'patterns', 'design patterns'],
                rating: 4.5,
                reviewCount: 23,
                inStock: true,
                onSale: false,
                isNew: false,
                createdAt: '2024-01-03'
            },
            {
                id: 10,
                name: 'Pack Adesivos CSS',
                category: 'adesivos',
                price: 18.90,
                image: '../assets/produtos/adesivos-css.jpg',
                tags: ['css', 'styling', 'frontend'],
                rating: 4.1,
                reviewCount: 6,
                inStock: true,
                onSale: false,
                isNew: true,
                createdAt: '2024-01-28'
            }
        ];
    }
}

// Inicializar página de busca
let searchPage;
document.addEventListener('DOMContentLoaded', () => {
    searchPage = new SearchPageManager();
});

// Escutar mudanças nos favoritos de outras páginas
window.addEventListener('storage', (e) => {
    if (e.key === 'favoritos' && searchPage) {
        searchPage.updateProductsDisplay();
    }
});