class CartModal extends HTMLElement {
    constructor() {
        super();
        this._items = [];
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['open'];
    }

    set items(value) {
        this._items = value;
        this.render();
    }

    get items() {
        return this._items;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'open') {
            this.render();
        }
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const isOpen = this.hasAttribute('open');
        if (!isOpen) {
            this.shadowRoot.innerHTML = '';
            return;
        }

        const total = this._items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Iconos SVG
        const icons = {
            'x': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
            'trash': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
            'minus': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
            'plus': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`
        };

        this.shadowRoot.innerHTML = `
            <style>
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: flex-end;
                    z-index: 1000;
                    animation: fadeIn 0.3s ease;
                }

                .modal-content {
                    background-color: white;
                    width: 100%;
                    max-width: 400px;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    box-shadow: -2px 0 5px rgba(0,0,0,0.1);
                    animation: slideIn 0.3s ease;
                }

                .modal-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid #e5e7eb;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .modal-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #111827;
                    margin: 0;
                }

                .close-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #6b7280;
                    padding: 0.5rem;
                    border-radius: 0.375rem;
                    transition: all 0.2s;
                }

                .close-btn:hover {
                    background-color: #f3f4f6;
                    color: #111827;
                }

                .cart-items {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1.5rem;
                }

                .cart-item {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                    padding-bottom: 1.5rem;
                    border-bottom: 1px solid #f3f4f6;
                }

                .item-image {
                    width: 80px;
                    height: 80px;
                    object-fit: cover;
                    border-radius: 0.5rem;
                    background-color: #f3f4f6;
                }

                .item-details {
                    flex: 1;
                }

                .item-name {
                    font-weight: 500;
                    color: #111827;
                    margin: 0 0 0.25rem 0;
                }

                .item-price {
                    color: #4b5563;
                    font-size: 0.875rem;
                }

                .item-controls {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-top: 0.5rem;
                }

                .quantity-controls {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    border: 1px solid #e5e7eb;
                    border-radius: 0.375rem;
                    padding: 0.125rem;
                }

                .qty-btn {
                    background: none;
                    border: none;
                    padding: 0.25rem 0.5rem;
                    cursor: pointer;
                    color: #4b5563;
                    display: flex;
                    align-items: center;
                }

                .qty-btn:hover {
                    color: #111827;
                }

                .qty-value {
                    font-size: 0.875rem;
                    font-weight: 500;
                    min-width: 1.5rem;
                    text-align: center;
                }

                .remove-btn {
                    background: none;
                    border: none;
                    color: #ef4444;
                    cursor: pointer;
                    padding: 0.25rem;
                    display: flex;
                    align-items: center;
                    transition: color 0.2s;
                }

                .remove-btn:hover {
                    color: #dc2626;
                }

                .modal-footer {
                    padding: 1.5rem;
                    border-top: 1px solid #e5e7eb;
                    background-color: #f9fafb;
                }

                .total-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 1rem;
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: #111827;
                }

                .checkout-btn {
                    width: 100%;
                    background-color: #2563eb;
                    color: white;
                    border: none;
                    padding: 0.75rem;
                    border-radius: 0.5rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }

                .checkout-btn:hover {
                    background-color: #1d4ed8;
                }

                .checkout-btn:disabled {
                    background-color: #9ca3af;
                    cursor: not-allowed;
                }

                .empty-cart {
                    text-align: center;
                    color: #6b7280;
                    margin-top: 2rem;
                }

                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            </style>

            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">Tu Carrito</h2>
                        <button class="close-btn">${icons.x}</button>
                    </div>

                    <div class="cart-items">
                        ${this._items.length === 0 ? `
                            <div class="empty-cart">
                                <p>Tu carrito está vacío</p>
                            </div>
                        ` : this._items.map(item => `
                            <div class="cart-item">
                                <img src="${item.image}" alt="${item.name}" class="item-image">
                                <div class="item-details">
                                    <h3 class="item-name">${item.name}</h3>
                                    <div class="item-price">$${item.price}</div>
                                    <div class="item-controls">
                                        <div class="quantity-controls">
                                            <button class="qty-btn minus" data-id="${item.id}">${icons.minus}</button>
                                            <span class="qty-value">${item.quantity}</span>
                                            <button class="qty-btn plus" data-id="${item.id}">${icons.plus}</button>
                                        </div>
                                        <button class="remove-btn" data-id="${item.id}">
                                            ${icons.trash}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div class="modal-footer">
                        <div class="total-row">
                            <span>Total</span>
                            <span>$${total.toFixed(2)}</span>
                        </div>
                        <button class="checkout-btn" ${this._items.length === 0 ? 'disabled' : ''}>
                            Proceder al Pago
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Event Listeners
        this.shadowRoot.querySelector('.close-btn').addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('close-cart'));
        });

        this.shadowRoot.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.dispatchEvent(new CustomEvent('close-cart'));
            }
        });

        this.shadowRoot.querySelectorAll('.plus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.dispatchEvent(new CustomEvent('update-quantity', { 
                    detail: { id, change: 1 } 
                }));
            });
        });

        this.shadowRoot.querySelectorAll('.minus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.dispatchEvent(new CustomEvent('update-quantity', { 
                    detail: { id, change: -1 } 
                }));
            });
        });

        this.shadowRoot.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.dispatchEvent(new CustomEvent('remove-item', { 
                    detail: { id } 
                }));
            });
        });
    }
}

customElements.define('cart-modal', CartModal);