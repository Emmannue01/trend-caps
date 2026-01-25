class ProductCard extends HTMLElement {
    connectedCallback() {
        const productId = this.getAttribute('product-id');
        const name = this.getAttribute('name');
        const category = this.getAttribute('category');
        const description = this.getAttribute('description');
        const price = this.getAttribute('price');
        const stock = parseInt(this.getAttribute('stock'));
        const image = this.getAttribute('image');
        
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    background-color: white;
                    border-radius: 0.5rem;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                
                :host(:hover) {
                    transform: translateY(-4px);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                }
                
                .product-image {
                    width: 100%;
                    height: 200px;
                    object-fit: cover;
                }
                
                .product-content {
                    padding: 1.25rem;
                }
                
                .product-category {
                    display: inline-block;
                    background-color: #e0f2fe;
                    color: #0369a1;
                    padding: 0.25rem 0.5rem;
                    border-radius: 0.25rem;
                    font-size: 0.75rem;
                    font-weight: 500;
                    margin-bottom: 0.5rem;
                }
                
                .product-name {
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 0.5rem;
                }
                
                .product-description {
                    color: #6b7280;
                    font-size: 0.875rem;
                    margin-bottom: 1rem;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                
                .product-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .product-price {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #1f2937;
                }
                
                .product-stock {
                    font-size: 0.75rem;
                    color: ${stock > 10 ? '#16a34a' : stock > 0 ? '#d97706' : '#dc2626'};
                }
                
                .add-to-cart {
                    background-color: #3b82f6;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 0.25rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                
                .add-to-cart:hover {
                    background-color: #2563eb;
                }
                
                .add-to-cart:disabled {
                    background-color: #9ca3af;
                    cursor: not-allowed;
                }
            </style>
            
            <div class="product-card">
                <img src="${image}" alt="${name}" class="product-image">
                <div class="product-content">
                    <span class="product-category">${this.getCategoryName(category)}</span>
                    <h3 class="product-name">${name}</h3>
                    <p class="product-description">${description}</p>
                    <div class="product-footer">
                        <div>
                            <span class="product-price">$${price}</span>
                            <div class="product-stock">${stock > 10 ? 'En stock' : stock > 0 ? 'Últimas unidades' : 'Agotado'}</div>
                        </div>
                        <button class="add-to-cart" ${stock <= 0 ? 'disabled' : ''}>
                            <i data-feather="shopping-cart" width="16" height="16"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Initialize feather icons
        if (window.feather) {
            window.feather.replace({ class: 'feather', 'stroke-width': 2 });
        }
        
        // Add event listener to the button
        const addToCartBtn = this.shadowRoot.querySelector('.add-to-cart');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => {
                this.addToCart(productId);
            });
        }
    }
    
    getCategoryName(category) {
        const categories = {
            'gorras': 'Gorras',
            'camisetas': 'Camisetas',
            'sudaderas': 'Sudaderas',
            'accesorios': 'Accesorios'
        };
        return categories[category] || category;
    }
    
    addToCart(productId) {
        const event = new CustomEvent('add-to-cart', {
            bubbles: true,
            composed: true,
            detail: { productId }
        });
        this.dispatchEvent(event);
    }
}

customElements.define('product-card', ProductCard);