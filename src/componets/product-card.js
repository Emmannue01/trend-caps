class ProductCard extends HTMLElement {
    connectedCallback() {
        const productId = this.getAttribute('product-id');
        const name = this.getAttribute('name');
        const category = this.getAttribute('category');
        const description = this.getAttribute('description');
        const price = this.getAttribute('price');
        const salePrice = this.getAttribute('sale-price');
        const image = this.getAttribute('image');
        
        const stockString = this.getAttribute('stock');
        let stock;
        try {
            stock = JSON.parse(stockString);
        } catch (e) {
            stock = parseInt(stockString, 10) || 0;
        }

        const isSizable = typeof stock === 'object' && stock !== null;

        const totalStock = isSizable
            ? Object.values(stock).reduce((sum, count) => sum + (Number(count) || 0), 0)
            : stock;

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

                .price-container {
                    display: flex;
                    align-items: baseline;
                    gap: 0.5rem;
                }

                .product-sale-price {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #dc2626; /* red-600 */
                }

                .product-original-price {
                    font-size: 0.875rem;
                    color: #6b7280; /* gray-500 */
                    text-decoration: line-through;
                }
                
                .product-stock {
                    font-size: 0.75rem;
                    color: ${totalStock > 10 ? '#16a34a' : totalStock > 0 ? '#d97706' : '#dc2626'};
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
                            ${salePrice && parseFloat(salePrice) < parseFloat(price)
                                ? `<div class="price-container">
                                       <span class="product-sale-price">$${parseFloat(salePrice).toFixed(2)}</span>
                                       <span class="product-original-price">$${parseFloat(price).toFixed(2)}</span>
                                   </div>`
                                : `<span class="product-price">$${parseFloat(price).toFixed(2)}</span>`
                            }
                            <div class="product-stock">${totalStock > 10 ? 'En stock' : totalStock > 0 ? 'Últimas unidades' : 'Agotado'}</div>
                        </div>
                        <button class="add-to-cart" ${totalStock <= 0 ? 'disabled' : ''}>
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
        
        const productCardDiv = this.shadowRoot.querySelector('.product-card');
        if (productCardDiv) {
            productCardDiv.addEventListener('click', (e) => {
                // No activar la vista rápida si se hizo clic en el botón de añadir al carrito
                if (e.target.closest('.add-to-cart')) {
                    return;
                }
                const event = new CustomEvent('quick-view', {
                    bubbles: true,
                    composed: true,
                    detail: { productId, name, stock, image, price, salePrice, category, description }
                });
                this.dispatchEvent(event);
            });
        }

        // Add event listener to the button
        const addToCartBtn = this.shadowRoot.querySelector('.add-to-cart');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => {
                if (isSizable) {
                    const event = new CustomEvent('select-size', {
                        bubbles: true,
                        composed: true,
                        detail: { productId, name, stock, image, price, salePrice, category, description }
                    });
                    this.dispatchEvent(event);
                } else {
                    this.addToCart(productId);
                }
            });
        }
    }
    
    getCategoryName(category) {
        const categories = {
            'gorras': 'Gorras',
            'camisetas': 'Camisetas',
      
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