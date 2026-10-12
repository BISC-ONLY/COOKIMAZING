import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingBag, Cookie } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';

export function StoreShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { itemCount } = useCart();
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link href="/" className="brand" data-testid="link-home-brand" aria-label="COOKIMAZING home">
          <span className="brand-mark"><Cookie size={18} strokeWidth={2.6} /></span>
          <span>COOKIMAZING</span>
        </Link>
        <nav className="nav-links" aria-label="Main navigation">
          <Link href="/" aria-label="The menu" className={`nav-link ${location === '/' ? 'active' : ''}`} data-testid="link-menu">
            <span className="nav-label">The menu</span>
          </Link>
          <Link href="/cart" aria-label={`Your bag${itemCount > 0 ? `, ${itemCount} items` : ''}`} className={`nav-link ${location === '/cart' ? 'active' : ''}`} data-testid="link-cart">
            <ShoppingBag size={16} />
            <span className="nav-label">Your bag</span>
            {itemCount > 0 && <span className="cart-count" data-testid="text-cart-count">{itemCount}</span>}
          </Link>
        </nav>
      </header>
      <main>{children}</main>
      <section className="staff-section" id="staff" aria-labelledby="staff-heading">
        <div className="page-wrap">
          <div className="staff-heading">
            <div>
              <span className="section-kicker">Meet the team</span>
              <h2 id="staff-heading">Staff</h2>
            </div>
            <p>The people behind COOKIMAZING.</p>
          </div>
          <div className="staff-grid">
            <div className="staff-card"><span className="staff-role">Website by</span><strong>Mohamed Choucri</strong></div>
            <div className="staff-card"><span className="staff-role">Owner</span><strong>Adem Erku</strong></div>
            <div className="staff-card"><span className="staff-role">Manager</span><strong>Lillian Mohamed</strong></div>
            <div className="staff-card"><span className="staff-role">SECOND OWNER</span><strong>Fares Issa</strong></div>
            <div className="staff-card"><span className="staff-role">Advertiser</span><strong>Yehia Khalil</strong></div>
          </div>
        </div>
      </section>
      <section className="staff-section idea-makers-section" id="idea-makers" aria-labelledby="idea-makers-heading">
        <div className="page-wrap">
          <div className="staff-heading">
            <div>
              <span className="section-kicker">Fresh ideas for the menu</span>
              <h2 id="idea-makers-heading">IDEA MAKER</h2>
            </div>
            <p>Creating the next sweet favorite.</p>
          </div>
          <div className="staff-grid">
            <div className="staff-card"><strong>Hatem Wahdan</strong></div>
            <div className="staff-card"><strong>CO OWNER: Nour Tawfik</strong></div>
            <div className="staff-card"><strong>Francis Sheheta</strong></div>
          </div>
        </div>
      </section>
      <footer className="footer">
        <div className="page-wrap footer-inner">
          <span>COOKIMAZING · baked for BISC Cairo</span>
          <span>Pick up at school · pay at school</span>
        </div>
      </footer>
    </div>
  );
}