import { auth } from '../firebase.js';
import { signOut, onAuthStateChanged } from 'firebase/auth';

class CapstyleNavbar extends HTMLElement {
    constructor() {
        super();
        this.user = null;
    }

    static get observedAttributes() {
        return ['count'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'count' && this.shadowRoot) {
            const countEl = this.shadowRoot.querySelector('.cart-count');
            if (countEl) countEl.textContent = newValue;
        }
    }

    connectedCallback() {
        this.attachShadow({ mode: 'open' });
        this.render();

        onAuthStateChanged(auth, (user) => {
            this.user = user;
            this.render();
        });
    }

    render() {
        // Definir iconos SVG directamente para asegurar que se muestren siempre
        const icons = {
            'shopping-bag': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`,
            'shopping-cart': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>`,
            'user': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
            'log-out': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`
        };
        const getIcon = (name) => icons[name] || '';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    background-color: white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    position: sticky;
                    top: 0;
                    z-index: 100;
                }
                
                nav {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem 2rem;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                
                .logo {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: #3b82f6;
                    display: flex;
                    align-items: center;
                }
                
                .logo i {
                    margin-right: 0.5rem;
                }
                
                .nav-links {
                    display: flex;
                    gap: 1.5rem;
                }
                
                .nav-links a {
                    color: #4b5563;
                    font-weight: 500;
                    transition: color 0.2s;
                }
                
                .nav-links a:hover {
                    color: #3b82f6;
                }
                
                .cart-icon {
                    position: relative;
                }
                
                .cart-count {
                    position: absolute;
                    top: -0.5rem;
                    right: -0.5rem;
                    background-color: #ef4444;
                    color: white;
                    border-radius: 50%;
                    width: 1.2rem;
                    height: 1.2rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.7rem;
                }

                /* Estilos utilitarios para el Shadow DOM */
                .flex { display: flex; }
                .items-center { align-items: center; }
                .gap-4 { gap: 1rem; }
                .gap-2 { gap: 0.5rem; }

                #login-btn, #logout-btn {
                    color: #4b5563;
                    text-decoration: none;
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                }
                #login-btn:hover, #logout-btn:hover { color: #111827; }

                .user-email {
                    font-size: 0.875rem;
                    color: #4b5563;
                    text-decoration: none;
                    cursor: pointer;
                    max-width: 150px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .user-email:hover {
                    color: #111827;
                    text-decoration: underline;
                }
                
                @media (max-width: 768px) {
                    nav {
                        padding: 1rem;
                    }
                    
                    .nav-links {
                        display: none;
                    }

                    .user-email {
                        max-width: 100px;
                    }
                }
            </style>
            
            <nav>
                <a href="/" class="logo">
                    ${getIcon('shopping-bag')}
                    Trend-Caps
                </a>
                
                <div class="nav-links">
                    <a href="#products">Productos</a>
                    <a href="#categories">Categorías</a>
                    <a href="#offers">Ofertas</a>
                    <a href="#footer">Contacto</a>
                </div>
                <div class="flex items-center gap-4">
                    <a href="#" class="cart-icon" id="cart-btn">
                        ${getIcon('shopping-cart')}
                        <span class="cart-count">${this.getAttribute('count') || 0}</span>
                    </a>
                    <div id="user-section" class="flex items-center gap-2">
                        ${this.user ? `
                            <a href="/perfil" class="user-email">${this.user.displayName || this.user.email}</a>
                            <button id="logout-btn" style="background:none; border:none; padding:0;">
                                ${getIcon('log-out')}
                            </button>
                        ` : `
                            <a href="/login" id="login-btn">
                                ${getIcon('user')}
                                <span style="margin-left: 0.5rem; font-size: 0.9rem;">Iniciar sesión</span>
                            </a>
                        `}
                    </div>
                </div>
</nav>
        `;

        // Add logout functionality
        const logoutBtn = this.shadowRoot.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    await signOut(auth);
                    window.location.href = '/';
                } catch (error) {
                    console.error("Error signing out", error);
                }
            });
        }

        const cartBtn = this.shadowRoot.getElementById('cart-btn');
        if (cartBtn) {
            cartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.dispatchEvent(new CustomEvent('open-cart', { bubbles: true, composed: true }));
            });
        }
    }
}

customElements.define('capstyle-navbar', CapstyleNavbar);