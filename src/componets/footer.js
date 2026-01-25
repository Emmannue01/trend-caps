class CapstyleFooter extends HTMLElement {
    connectedCallback() {
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    background-color: #1e293b;
                    color: #f8fafc;
                    padding: 3rem 1rem;
                }
                
                .footer-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: grid;
                    grid-template-columns: repeat(1, 1fr);
                    gap: 2rem;
                }
                
                .footer-logo {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: white;
                    display: flex;
                    align-items: center;
                    margin-bottom: 1rem;
                }
                
                .footer-logo i {
                    margin-right: 0.5rem;
                }
                
                .footer-description {
                    color: #94a3b8;
                    margin-bottom: 1.5rem;
                    max-width: 300px;
                }
                
                .social-links {
                    display: flex;
                    gap: 1rem;
                }
                
                .social-links a {
                    color: #94a3b8;
                    transition: color 0.2s;
                }
                
                .social-links a:hover {
                    color: white;
                }
                
                .footer-links {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 2rem;
                }
                
                .links-group h3 {
                    font-size: 1.125rem;
                    font-weight: 600;
                    margin-bottom: 1rem;
                    color: white;
                }
                
                .links-group ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                
                .links-group li {
                    margin-bottom: 0.5rem;
                }
                
                .links-group a {
                    color: #94a3b8;
                    text-decoration: none;
                    transition: color 0.2s;
                }
                
                .links-group a:hover {
                    color: white;
                }
                
                .footer-bottom {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding-top: 2rem;
                    margin-top: 2rem;
                    border-top: 1px solid #334155;
                    text-align: center;
                    color: #94a3b8;
                    font-size: 0.875rem;
                }
                
                @media (min-width: 768px) {
                    .footer-container {
                        grid-template-columns: repeat(3, 1fr);
                    }
                    
                    .footer-links {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }
            </style>
            
            <div class="footer-container">
                <div class="footer-about">
                    <div class="footer-logo">
                        <i data-feather="shopping-bag"></i>
                        Trend-Caps
                    </div>
                    <p class="footer-description">
                        Tu destino para encontrar las mejores gorras y ropa de moda. Calidad y estilo en un solo lugar.
                    </p>
                    <div class="social-links">
                        <a href="#"><i data-feather="facebook"></i></a>
                        <a href="#"><i data-feather="twitter"></i></a>
                        <a href="#"><i data-feather="instagram"></i></a>
                        <a href="#"><i data-feather="youtube"></i></a>
                    </div>
                </div>
                
                <div class="footer-links">
                    <div class="links-group">
                        <h3>Comprar</h3>
                        <ul>
                            <li><a href="#">Productos</a></li>
                            <li><a href="#">Ofertas</a></li>
                            <li><a href="#">Nuevos Lanzamientos</a></li>
                            <li><a href="#">Colecciones</a></li>
                        </ul>
                    </div>
                    
                    <div class="links-group">
                        <h3>Ayuda</h3>
                        <ul>
                            <li><a href="#">Preguntas Frecuentes</a></li>
                            <li><a href="#">Envíos y Devoluciones</a></li>
                            <li><a href="#">Guía de Tallas</a></li>
                            <li><a href="#">Contacto</a></li>
                        </ul>
                    </div>
                    
                    
                </div>
            </div>
            
            <div class="footer-bottom">
                &copy; ${new Date().getFullYear()} Trend-Caps. Todos los derechos reservados.
            </div>
        `;
        
        // Initialize feather icons
        if (window.feather) {
            window.feather.replace({ class: 'feather', 'stroke-width': 2 });
        }
    }
}

customElements.define('capstyle-footer', CapstyleFooter);