import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Flame, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Zap, 
  Package, 
  ShoppingCart, 
  X, 
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function StorefrontView({
  products = [],
  recommendations = [],
  recommendationsLoading = false,
  recommendationsFallback = false,
  recommendationLatency = 0,
  cbState = 'CLOSED',
  onTriggerChaos,
  onRefreshRecommendations
}) {
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(null); // 'checking_inventory', 'payment', 'success'
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Electronics', 'Audio', 'Displays', 'Peripherals', 'Lighting'];

  const filteredProducts = products.filter(p => {
    const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckout = () => {
    setCheckoutStep('processing');
    setTimeout(() => {
      setCheckoutStep('success');
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      setCart([]);
    }, 1200);
  };

  const totalCartPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="storefront-container animate-fade-in">
      {/* Black Friday Sale Hero Banner */}
      <div className="hero-banner">
        <div className="hero-badge">
          <Flame size={16} className="text-orange-400" />
          <span>BLACK FRIDAY CLOUD RESILIENCE SALE</span>
        </div>
        <h1 className="hero-title">
          Extreme Load. <span className="text-gradient">Zero Downtime.</span>
        </h1>
        <p className="hero-description">
          Experience Spring Cloud Gateway & Resilience4j in action. When peak traffic floods the recommendation engine, 
          the Circuit Breaker seamlessly trips to cached Top Sellers while the rest of the store stays blazing fast.
        </p>

        {/* Resilience Status Banner */}
        <div className="resilience-callout-card">
          <div className="callout-left">
            <div className={`status-indicator-circle ${cbState.toLowerCase()}`}>
              <Zap size={20} />
            </div>
            <div>
              <div className="callout-header">
                <strong>Gateway Resilience State:</strong> {cbState}
              </div>
              <div className="callout-sub">
                {cbState === 'OPEN' 
                  ? '⚡ Recommendation Circuit is OPEN: Gateway is serving instant cached fallback (<10ms) without waiting for timeouts.'
                  : cbState === 'HALF_OPEN'
                  ? '🟡 Trial Mode: Gateway is probing Recommendation Service with canary requests to detect recovery.'
                  : '🟢 Normal Mode: Gateway is streaming live personalized recommendations from recommendation-service.'}
              </div>
            </div>
          </div>
          <div className="callout-actions">
            <button 
              className="btn btn-sm btn-danger"
              onClick={() => onTriggerChaos('recommendation', 'delay')}
              title="Simulate 3000ms Black Friday spike to trip circuit breaker"
            >
              <Flame size={14} />
              Simulate Surge Spike
            </button>
            <button 
              className="btn btn-sm btn-secondary"
              onClick={onRefreshRecommendations}
            >
              <Sparkles size={14} />
              Reload Recommendations
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Recommendation Shelf */}
      <section className="recommendation-shelf-section">
        <div className="section-header">
          <div className="section-title-group">
            <Sparkles className="section-icon text-indigo-400" size={20} />
            <h2>
              {recommendationsFallback ? 'Top Sellers & Trending Deals' : 'Personalized Recommendations'}
            </h2>
          </div>
          
          <div className="recommendation-telemetry-badge">
            <span className={`badge ${recommendationsFallback ? 'badge-fallback' : 'badge-closed'}`}>
              {recommendationsFallback ? (
                <>
                  <ShieldCheck size={13} />
                  <span>RESILIENCE FALLBACK ACTIVE</span>
                </>
              ) : (
                <>
                  <Cpu size={13} />
                  <span>LIVE AI ENGINE</span>
                </>
              )}
            </span>
            <span className="latency-pill">
              <Clock size={12} />
              <span>{recommendationLatency} ms</span>
            </span>
          </div>
        </div>

        {recommendationsFallback && (
          <div className="fallback-explanation-bar">
            <AlertTriangle size={16} className="text-amber-400" />
            <span>
              <strong>Problem Statement Demonstration:</strong> Recommendation Engine is experiencing high latency. 
              The Gateway returned fallback "Top Sellers" immediately, preventing thread exhaustion on the Checkout & Catalog services.
            </span>
          </div>
        )}

        <div className="recommendations-grid">
          {recommendations.map((rec) => (
            <div key={rec.id} className="recommendation-card glass-card">
              <div className="rec-badge-tag">
                {rec.reason || (recommendationsFallback ? '🔥 Best Seller' : '🤖 AI Recommended')}
              </div>
              <div className="rec-info">
                <h4 className="rec-title">{rec.productName || `Product #${rec.productId}`}</h4>
                <div className="rec-meta">
                  <span className="category-tag">{rec.category || 'Featured'}</span>
                  {rec.score && (
                    <span className="score-tag">
                      Match: {Math.round(rec.score * 100)}%
                    </span>
                  )}
                </div>
              </div>
              <button 
                className="btn btn-sm btn-primary"
                onClick={() => {
                  const matchProd = products.find(p => p.id === rec.productId || p.name === rec.productName);
                  if (matchProd) addToCart(matchProd);
                  else addToCart({ id: rec.productId || rec.id, name: rec.productName, price: 199.99, quantity: 1 });
                }}
              >
                <ShoppingCart size={14} />
                Add Deal
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Main Catalog Section */}
      <section className="catalog-section">
        <div className="catalog-toolbar">
          <div className="catalog-filter-tabs">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`filter-tab ${filterCategory === cat ? 'active' : ''}`}
                onClick={() => setFilterCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="catalog-actions">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button 
              className="cart-trigger-btn"
              onClick={() => setShowCart(true)}
            >
              <ShoppingCart size={18} />
              <span>Cart ({cart.reduce((a, b) => a + b.quantity, 0)})</span>
            </button>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="products-grid">
          {filteredProducts.map((prod) => (
            <div key={prod.id} className="product-card glass-card">
              <div className="product-image-container">
                {prod.image ? (
                  <img src={prod.image} alt={prod.name} className="product-image" />
                ) : (
                  <div className="product-placeholder">
                    <Package size={40} className="text-slate-600" />
                  </div>
                )}
                <span className="sku-badge">{prod.sku || `SKU-${prod.id}`}</span>
              </div>

              <div className="product-details">
                <div className="product-category">{prod.category || 'Store Item'}</div>
                <h3 className="product-name">{prod.name}</h3>
                <p className="product-desc">{prod.description}</p>
                
                <div className="product-footer">
                  <div className="price-tag">
                    ${prod.price?.toFixed(2) || '99.99'}
                  </div>
                  <div className="stock-info">
                    <span className="stock-dot in-stock"></span>
                    <span>{prod.quantity || 24} In Stock</span>
                  </div>
                </div>

                <button 
                  className="btn btn-primary add-cart-btn"
                  onClick={() => addToCart(prod)}
                >
                  <ShoppingCart size={16} />
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cart Drawer Modal */}
      {showCart && (
        <div className="cart-backdrop" onClick={() => setShowCart(false)}>
          <div className="cart-drawer glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="cart-header">
              <div className="flex items-center gap-2">
                <ShoppingBag className="text-indigo-400" size={20} />
                <h3>Your Resilient Cart</h3>
              </div>
              <button className="close-btn" onClick={() => setShowCart(false)}>
                <X size={20} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="empty-cart-state">
                <Package size={48} className="text-slate-600" />
                <p>Your cart is empty.</p>
                <button className="btn btn-secondary btn-sm mt-2" onClick={() => setShowCart(false)}>
                  Browse Products
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items-list">
                  {cart.map((item) => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-info">
                        <h4>{item.name}</h4>
                        <div className="cart-item-meta">
                          <span>${item.price?.toFixed(2)} × {item.quantity}</span>
                          <span className="font-semibold text-white">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <button 
                        className="remove-item-btn"
                        onClick={() => removeFromCart(item.id)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div className="cart-summary">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>${totalCartPrice.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Black Friday Resilience Discount</span>
                    <span className="text-green-400">-$0.00</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total</span>
                    <span>${totalCartPrice.toFixed(2)}</span>
                  </div>

                  {checkoutStep === 'processing' ? (
                    <div className="checkout-processing">
                      <Zap className="animate-spin text-indigo-400" size={20} />
                      <span>Verifying Inventory & Processing Payment via Gateway...</span>
                    </div>
                  ) : checkoutStep === 'success' ? (
                    <div className="checkout-success">
                      <CheckCircle className="text-emerald-400" size={24} />
                      <div>
                        <strong>Order Placed Successfully!</strong>
                        <p className="text-xs text-slate-300">Cascading failure avoided. Checkout was unaffected by recommendation latency.</p>
                      </div>
                    </div>
                  ) : (
                    <button 
                      className="btn btn-success btn-lg w-full"
                      onClick={handleCheckout}
                    >
                      Instant Resilient Checkout (${totalCartPrice.toFixed(2)})
                      <ArrowRight size={18} />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        .storefront-container {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .hero-banner {
          background: linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 32px;
          position: relative;
          overflow: hidden;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: rgba(249, 115, 22, 0.15);
          border: 1px solid rgba(249, 115, 22, 0.4);
          border-radius: var(--radius-full);
          color: #fdba74;
          font-weight: 700;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          margin-bottom: 16px;
        }
        .hero-title {
          font-size: 2.25rem;
          line-height: 1.2;
          margin-bottom: 12px;
        }
        .text-gradient {
          background: var(--color-accent-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-description {
          color: var(--text-secondary);
          max-width: 800px;
          font-size: 0.95rem;
          line-height: 1.6;
          margin-bottom: 24px;
        }
        .resilience-callout-card {
          background: rgba(17, 24, 39, 0.85);
          border: 1px solid var(--border-medium);
          border-radius: var(--radius-md);
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .callout-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .status-indicator-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        .status-indicator-circle.closed {
          background: rgba(16, 185, 129, 0.2);
          color: var(--color-closed);
          border: 1px solid var(--color-closed);
        }
        .status-indicator-circle.open {
          background: rgba(239, 68, 68, 0.2);
          color: var(--color-open);
          border: 1px solid var(--color-open);
          animation: pulse-glow 1s infinite alternate;
        }
        .status-indicator-circle.half_open {
          background: rgba(245, 158, 11, 0.2);
          color: var(--color-half-open);
          border: 1px solid var(--color-half-open);
        }
        .callout-header {
          font-size: 0.9rem;
          color: var(--text-primary);
        }
        .callout-sub {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-top: 2px;
        }
        .callout-actions {
          display: flex;
          gap: 10px;
        }

        /* Recommendations Shelf */
        .recommendation-shelf-section {
          background: rgba(17, 24, 39, 0.6);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 24px;
        }
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 16px;
        }
        .section-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .section-title-group h2 {
          font-size: 1.25rem;
        }
        .recommendation-telemetry-badge {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .latency-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px 10px;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-family: var(--font-mono);
          color: var(--text-secondary);
          border: 1px solid var(--border-subtle);
        }
        .fallback-explanation-bar {
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: var(--radius-md);
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          font-size: 0.825rem;
          color: #fde68a;
        }
        .recommendations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .recommendation-card {
          padding: 18px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 14px;
          border-left: 3px solid var(--color-primary);
        }
        .rec-badge-tag {
          font-size: 0.725rem;
          color: #a5b4fc;
          font-weight: 600;
          font-family: var(--font-mono);
        }
        .rec-title {
          font-size: 0.95rem;
          margin-bottom: 6px;
        }
        .rec-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .category-tag {
          font-size: 0.7rem;
          background: rgba(255, 255, 255, 0.06);
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
        }
        .score-tag {
          font-size: 0.7rem;
          color: #6ee7b7;
          font-family: var(--font-mono);
        }

        /* Catalog Section */
        .catalog-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .catalog-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .catalog-filter-tabs {
          display: flex;
          gap: 6px;
          overflow-x: auto;
        }
        .filter-tab {
          padding: 6px 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          color: var(--text-secondary);
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .filter-tab:hover {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
        }
        .filter-tab.active {
          background: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }
        .catalog-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .search-input {
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          padding: 8px 14px;
          border-radius: var(--radius-md);
          color: white;
          font-size: 0.85rem;
          outline: none;
          width: 220px;
        }
        .search-input:focus {
          border-color: var(--color-primary);
        }
        .cart-trigger-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.4);
          border-radius: var(--radius-md);
          color: #c7d2fe;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
        }
        .cart-trigger-btn:hover {
          background: rgba(99, 102, 241, 0.25);
        }

        /* Products Grid */
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        .product-card {
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .product-image-container {
          height: 180px;
          position: relative;
          background: #0f172a;
          overflow: hidden;
        }
        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        .product-card:hover .product-image {
          transform: scale(1.05);
        }
        .product-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sku-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          font-family: var(--font-mono);
          font-size: 0.65rem;
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
        }
        .product-details {
          padding: 20px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .product-category {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-accent);
          font-weight: 600;
          margin-bottom: 4px;
        }
        .product-name {
          font-size: 1.1rem;
          margin-bottom: 8px;
        }
        .product-desc {
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 16px;
          flex: 1;
        }
        .product-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .price-tag {
          font-size: 1.25rem;
          font-weight: 800;
          color: #ffffff;
          font-family: var(--font-mono);
        }
        .stock-info {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .stock-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .stock-dot.in-stock {
          background-color: var(--color-closed);
        }
        .add-cart-btn {
          width: 100%;
        }

        /* Cart Modal Drawer */
        .cart-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          justify-content: flex-end;
        }
        .cart-drawer {
          width: 100%;
          max-width: 440px;
          height: 100%;
          border-radius: 0;
          border-left: 1px solid var(--border-medium);
          background: #111827;
          display: flex;
          flex-direction: column;
          padding: 24px;
        }
        .cart-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-subtle);
        }
        .empty-cart-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: var(--text-muted);
        }
        .cart-items-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }
        .cart-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-subtle);
          padding: 12px 14px;
          border-radius: var(--radius-md);
        }
        .cart-item-info h4 {
          font-size: 0.85rem;
          margin-bottom: 4px;
        }
        .cart-item-meta {
          display: flex;
          gap: 12px;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        .remove-item-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 1.25rem;
          cursor: pointer;
        }
        .remove-item-btn:hover {
          color: var(--color-open);
        }
        .cart-summary {
          border-top: 1px solid var(--border-subtle);
          padding-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        .summary-row.total {
          font-size: 1.1rem;
          font-weight: 700;
          color: white;
          border-top: 1px solid var(--border-subtle);
          padding-top: 10px;
        }
        .checkout-processing {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.8rem;
          color: #a5b4fc;
          padding: 12px;
          background: rgba(99, 102, 241, 0.1);
          border-radius: var(--radius-md);
        }
        .checkout-success {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          color: #a7f3d0;
        }
      `}</style>
    </div>
  );
}
