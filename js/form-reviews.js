/* filepath: c:\Users\janic\OneDrive\Área de Trabalho\Projetos\loja_dev\js\review-form.js */
// Formulário Avançado de Reviews

class ReviewFormManager {
    constructor() {
        this.currentProductId = null;
        this.selectedRating = 0;
        this.uploadedImages = [];
        this.maxImages = 5;
        this.maxImageSize = 5 * 1024 * 1024; // 5MB
        this.allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        
        this.ratingDescriptions = {
            1: 'Muito ruim - Não recomendo',
            2: 'Ruim - Abaixo do esperado',
            3: 'Regular - Atende o básico',
            4: 'Bom - Recomendo',
            5: 'Excelente - Superou expectativas'
        };

        this.init();
    }

    init() {
        this.createModal();
        this.setupEventListeners();
    }

    // Criar modal do formulário
    createModal() {
        const modal = document.createElement('div');
        modal.id = 'review-modal';
        modal.className = 'review-modal';
        
        modal.innerHTML = `
            <div class="review-modal-content">
                <div class="review-modal-header">
                    <h2 class="review-modal-title">Avaliar Produto</h2>
                    <button class="review-modal-close" onclick="reviewFormManager.closeModal()">&times;</button>
                </div>

                <div id="product-info" class="product-info" style="display: none;">
                    <img id="product-image" class="product-image" src="" alt="Produto">
                    <div class="product-details">
                        <h4 id="product-name">Nome do Produto</h4>
                        <p id="product-price">R$ 0,00</p>
                    </div>
                </div>

                <form id="review-form" class="review-form">
                    <!-- Rating -->
                    <div class="form-group">
                        <label class="form-label required">Sua avaliação</label>
                        <div class="rating-input">
                            <div class="rating-stars-input" id="rating-stars">
                                <div class="star-input" data-rating="1"></div>
                                <div class="star-input" data-rating="2"></div>
                                <div class="star-input" data-rating="3"></div>
                                <div class="star-input" data-rating="4"></div>
                                <div class="star-input" data-rating="5"></div>
                            </div>
                            <span class="rating-text" id="rating-text">Clique nas estrelas</span>
                        </div>
                        <div class="rating-descriptions">
                            <div class="rating-description" id="rating-description"></div>
                        </div>
                        <div class="error-message" id="rating-error" style="display: none;"></div>
                    </div>

                    <!-- Título -->
                    <div class="form-group">
                        <label for="review-title" class="form-label required">Título da avaliação</label>
                        <input 
                            type="text" 
                            id="review-title" 
                            class="form-input" 
                            placeholder="Resuma sua experiência em poucas palavras"
                            maxlength="100"
                            required
                        >
                        <div class="char-counter" id="title-counter">0/100</div>
                        <div class="error-message" id="title-error" style="display: none;"></div>
                    </div>

                    <!-- Comentário -->
                    <div class="form-group">
                        <label for="review-comment" class="form-label required">Sua experiência</label>
                        <textarea 
                            id="review-comment" 
                            class="form-input form-textarea" 
                            placeholder="Conte sobre sua experiência com o produto. Seja específico sobre qualidade, funcionalidade, entrega, etc."
                            maxlength="1000"
                            required
                        ></textarea>
                        <div class="char-counter" id="comment-counter">0/1000</div>
                        <div class="error-message" id="comment-error" style="display: none;"></div>
                    </div>

                    <!-- Upload de imagens -->
                    <div class="form-group">
                        <label class="form-label">Fotos (opcional)</label>
                        <div class="image-upload-section" id="image-upload">
                            <div class="upload-icon">📷</div>
                            <div class="upload-text">
                                <strong>Clique para escolher</strong> ou arraste fotos aqui<br>
                                <small>Máximo ${this.maxImages} fotos • JPG, PNG, WEBP • Até 5MB cada</small>
                            </div>
                            <button type="button" class="upload-button" onclick="reviewFormManager.triggerFileInput()">
                                Escolher Fotos
                            </button>
                        </div>
                        <input 
                            type="file" 
                            id="image-input" 
                            class="file-input" 
                            multiple 
                            accept="image/*"
                        >
                        <div class="image-previews" id="image-previews"></div>
                        <div class="error-message" id="images-error" style="display: none;"></div>
                    </div>

                    <!-- Termos -->
                    <div class="form-group">
                        <div class="terms-section">
                            <div class="terms-checkbox">
                                <input type="checkbox" id="terms-accept" required>
                                <label for="terms-accept" class="terms-text">
                                    Concordo com os <a href="/pages/termos.html" target="_blank">termos de uso</a> 
                                    e confirmo que esta avaliação é baseada na minha experiência real com o produto.
                                </label>
                            </div>
                        </div>
                        <div class="error-message" id="terms-error" style="display: none;"></div>
                    </div>

                    <!-- Botões -->
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" onclick="reviewFormManager.closeModal()">
                            Cancelar
                        </button>
                        <button type="submit" class="btn-submit" id="submit-btn">
                            Publicar Avaliação
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
    }

    // Configurar event listeners
    setupEventListeners() {
        // Rating stars
        document.querySelectorAll('.star-input').forEach(star => {
            star.addEventListener('click', (e) => {
                this.setRating(parseInt(e.target.dataset.rating));
            });

            star.addEventListener('mouseenter', (e) => {
                this.previewRating(parseInt(e.target.dataset.rating));
            });
        });

        // Reset preview quando sair das estrelas
        document.getElementById('rating-stars').addEventListener('mouseleave', () => {
            this.resetRatingPreview();
        });

        // Formulário
        document.getElementById('review-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitReview();
        });

        // Contadores de caracteres
        document.getElementById('review-title').addEventListener('input', (e) => {
            this.updateCharCounter('title-counter', e.target.value, 100);
            this.clearError('title-error');
        });

        document.getElementById('review-comment').addEventListener('input', (e) => {
            this.updateCharCounter('comment-counter', e.target.value, 1000);
            this.clearError('comment-error');
        });

        // Upload de imagens
        const imageInput = document.getElementById('image-input');
        const uploadSection = document.getElementById('image-upload');

        imageInput.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files);
        });

        // Drag and drop
        uploadSection.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadSection.classList.add('dragover');
        });

        uploadSection.addEventListener('dragleave', () => {
            uploadSection.classList.remove('dragover');
        });

        uploadSection.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadSection.classList.remove('dragover');
            this.handleFileSelect(e.dataTransfer.files);
        });

        // Fechar modal ao clicar fora
        document.getElementById('review-modal').addEventListener('click', (e) => {
            if (e.target.id === 'review-modal') {
                this.closeModal();
            }
        });

        // Escape key para fechar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('review-modal').classList.contains('show')) {
                this.closeModal();
            }
        });
    }

    // Abrir modal para produto específico
    openModal(productId, productData = null) {
        this.currentProductId = productId;
        this.resetForm();

        // Carregar dados do produto se fornecidos
        if (productData) {
            this.loadProductInfo(productData);
        }

        document.getElementById('review-modal').classList.add('show');
        document.body.style.overflow = 'hidden';

        // Focar no primeiro campo
        setTimeout(() => {
            document.querySelector('.star-input').focus();
        }, 300);
    }

    // Fechar modal
    closeModal() {
        document.getElementById('review-modal').classList.remove('show');
        document.body.style.overflow = '';
        this.resetForm();
    }

    // Carregar informações do produto
    loadProductInfo(productData) {
        const productInfo = document.getElementById('product-info');
        const productImage = document.getElementById('product-image');
        const productName = document.getElementById('product-name');
        const productPrice = document.getElementById('product-price');

        if (productData.image) {
            productImage.src = productData.image;
            productImage.alt = productData.name;
        }

        productName.textContent = productData.name || 'Produto';
        productPrice.textContent = productData.price || 'R$ 0,00';
        
        productInfo.style.display = 'flex';
    }

    // Configurar rating
    setRating(rating) {
        this.selectedRating = rating;
        this.updateRatingDisplay(rating);
        this.updateRatingText(rating);
        this.clearError('rating-error');
    }

    // Preview do rating
    previewRating(rating) {
        if (this.selectedRating === 0) {
            this.updateRatingDisplay(rating);
            this.updateRatingText(rating);
        }
    }

    // Reset preview do rating
    resetRatingPreview() {
        if (this.selectedRating > 0) {
            this.updateRatingDisplay(this.selectedRating);
            this.updateRatingText(this.selectedRating);
        } else {
            this.updateRatingDisplay(0);
            document.getElementById('rating-text').textContent = 'Clique nas estrelas';
            document.getElementById('rating-description').textContent = '';
        }
    }

    // Atualizar display das estrelas
    updateRatingDisplay(rating) {
        document.querySelectorAll('.star-input').forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    // Atualizar texto do rating
    updateRatingText(rating) {
        const ratingText = document.getElementById('rating-text');
        const ratingDescription = document.getElementById('rating-description');
        
        if (rating > 0) {
            ratingText.textContent = `${rating} ${rating === 1 ? 'estrela' : 'estrelas'}`;
            ratingDescription.textContent = this.ratingDescriptions[rating];
        } else {
            ratingText.textContent = 'Clique nas estrelas';
            ratingDescription.textContent = '';
        }
    }

    // Atualizar contador de caracteres
    updateCharCounter(counterId, text, maxLength) {
        const counter = document.getElementById(counterId);
        const current = text.length;
        
        counter.textContent = `${current}/${maxLength}`;
        
        // Mudança de cor baseada no limite
        counter.className = 'char-counter';
        if (current > maxLength * 0.9) {
            counter.classList.add('warning');
        }
        if (current >= maxLength) {
            counter.classList.add('error');
        }
    }

    // Trigger input de arquivo
    triggerFileInput() {
        document.getElementById('image-input').click();
    }

    // Manipular seleção de arquivos
    handleFileSelect(files) {
        const fileArray = Array.from(files);
        
        // Verificar limite de arquivos
        if (this.uploadedImages.length + fileArray.length > this.maxImages) {
            this.showError('images-error', `Máximo ${this.maxImages} imagens permitidas`);
            return;
        }

        // Processar cada arquivo
        fileArray.forEach(file => {
            if (this.validateFile(file)) {
                this.processImage(file);
            }
        });
    }

    // Validar arquivo
    validateFile(file) {
        // Verificar tipo
        if (!this.allowedTypes.includes(file.type)) {
            this.showError('images-error', 'Formato não suportado. Use JPG, PNG ou WEBP');
            return false;
        }

        // Verificar tamanho
        if (file.size > this.maxImageSize) {
            this.showError('images-error', 'Arquivo muito grande. Máximo 5MB por imagem');
            return false;
        }

        return true;
    }

    // Processar imagem
    processImage(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const imageData = {
                id: Date.now() + Math.random(),
                file: file,
                src: e.target.result,
                name: file.name
            };

            this.uploadedImages.push(imageData);
            this.updateImagePreviews();
            this.clearError('images-error');
        };

        reader.readAsDataURL(file);
    }

    // Atualizar previews das imagens
    updateImagePreviews() {
        const container = document.getElementById('image-previews');
        
        container.innerHTML = this.uploadedImages.map(image => `
            <div class="image-preview">
                <img src="${image.src}" alt="${image.name}" class="preview-image">
                <button type="button" class="remove-image" onclick="reviewFormManager.removeImage('${image.id}')">
                    ×
                </button>
            </div>
        `).join('');
    }

    // Remover imagem
    removeImage(imageId) {
        this.uploadedImages = this.uploadedImages.filter(img => img.id != imageId);
        this.updateImagePreviews();
    }

    // Validar formulário
    validateForm() {
        let isValid = true;

        // Rating
        if (this.selectedRating === 0) {
            this.showError('rating-error', 'Por favor, selecione uma avaliação');
            isValid = false;
        }

        // Título
        const title = document.getElementById('review-title').value.trim();
        if (!title) {
            this.showError('title-error', 'Título é obrigatório');
            isValid = false;
        } else if (title.length < 10) {
            this.showError('title-error', 'Título deve ter pelo menos 10 caracteres');
            isValid = false;
        }

        // Comentário
        const comment = document.getElementById('review-comment').value.trim();
        if (!comment) {
            this.showError('comment-error', 'Comentário é obrigatório');
            isValid = false;
        } else if (comment.length < 20) {
            this.showError('comment-error', 'Comentário deve ter pelo menos 20 caracteres');
            isValid = false;
        }

        // Termos
        const termsAccepted = document.getElementById('terms-accept').checked;
        if (!termsAccepted) {
            this.showError('terms-error', 'Você deve aceitar os termos para continuar');
            isValid = false;
        }

        return isValid;
    }

    // Submeter review
    async submitReview() {
        if (!this.validateForm()) {
            return;
        }

        const submitBtn = document.getElementById('submit-btn');
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        try {
            // Simular delay de envio
            await new Promise(resolve => setTimeout(resolve, 2000));

            const reviewData = {
                id: 'rev_' + Date.now(),
                productId: this.currentProductId,
                userId: window.reviewsSystem?.currentUser?.id || 'user_demo',
                userName: window.reviewsSystem?.currentUser?.nome || 'Usuário Demo',
                userAvatar: (window.reviewsSystem?.currentUser?.nome || 'U').charAt(0).toUpperCase(),
                rating: this.selectedRating,
                title: document.getElementById('review-title').value.trim(),
                content: document.getElementById('review-comment').value.trim(),
                date: new Date().toISOString(),
                helpful: 0,
                notHelpful: 0,
                verified: true,
                images: this.uploadedImages.map(img => img.src) // Em produção, seria URLs após upload
            };

            // Adicionar ao sistema de reviews
            if (window.reviewsSystem) {
                window.reviewsSystem.addReview(reviewData);
                window.reviewsSystem.renderReviewsSection(this.currentProductId);
            }

            this.closeModal();
            this.showSuccessMessage('Sua avaliação foi publicada com sucesso!');

        } catch (error) {
            console.error('Erro ao enviar review:', error);
            this.showError('submit-error', 'Erro ao enviar avaliação. Tente novamente.');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }

    // Reset do formulário
    resetForm() {
        this.selectedRating = 0;
        this.uploadedImages = [];
        
        document.getElementById('review-form').reset();
        document.getElementById('product-info').style.display = 'none';
        
        this.updateRatingDisplay(0);
        document.getElementById('rating-text').textContent = 'Clique nas estrelas';
        document.getElementById('rating-description').textContent = '';
        
        this.updateCharCounter('title-counter', '', 100);
        this.updateCharCounter('comment-counter', '', 1000);
        this.updateImagePreviews();
        
        this.clearAllErrors();
    }

    // Mostrar erro
    showError(errorId, message) {
        const errorElement = document.getElementById(errorId);
        const inputElement = document.querySelector(`[id="${errorId.replace('-error', '')}"]`);
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'flex';
        }
        
        if (inputElement) {
            inputElement.classList.add('error');
        }
    }

    // Limpar erro específico
    clearError(errorId) {
        const errorElement = document.getElementById(errorId);
        const inputElement = document.querySelector(`[id="${errorId.replace('-error', '')}"]`);
        
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        
        if (inputElement) {
            inputElement.classList.remove('error');
        }
    }

    // Limpar todos os erros
    clearAllErrors() {
        document.querySelectorAll('.error-message').forEach(error => {
            error.style.display = 'none';
        });
        
        document.querySelectorAll('.form-input').forEach(input => {
            input.classList.remove('error');
        });
    }

    // Mostrar mensagem de sucesso
    showSuccessMessage(message) {
        if (window.MainAPI && window.MainAPI.showNotification) {
            window.MainAPI.showNotification(message, 'success');
        } else if (window.reviewsSystem) {
            window.reviewsSystem.showMessage(message, 'success');
        } else {
            alert(message);
        }
    }
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.reviewFormManager = new ReviewFormManager();
});

// API global
window.ReviewForm = {
    open: (productId, productData) => window.reviewFormManager?.openModal(productId, productData),
    close: () => window.reviewFormManager?.closeModal()
};