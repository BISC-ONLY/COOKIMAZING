import { Link } from 'wouter';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { formatPrice, useCart } from '@/hooks/use-cart';

export default function CartPage() {
  const { items, total, setQuantity, removeItem } = useCart();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="page-wrap">
      <section className="page-heading">
        <span className="section-kicker">Your sweet selection</span>
        <h1>Your bag.</h1>
        <p>A quick look at what you’ve picked. You’ll pay at school when it’s ready for you.</p>
      </section>
      {items.length === 0 ? (
        <section className="panel empty-state" data-testid="empty-cart">
          <div className="empty-icon"><ShoppingBag size={25} /></div>
          <h2>Your bag is waiting for a treat..</h2>
          <p>Choose a cookie or shake from the menu and come back here to check out.</p>
          <Link href="/" className="primary-button" style={{ width: 'auto' }} data-testid="link-empty-cart-menu">Explore the menu <ArrowRight size={16} /></Link>
        </section>
      ) : (
        <div className="content-layout">
          <section className="panel" aria-label="Cart items">
            <h2 className="panel-title">In your bag <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: 13, fontFamily: 'var(--app-font-sans)' }}>({count})</span></h2>
            {items.map((item) => {
              const missingTrioChoices = Boolean(item.cookieSelectionCount && item.cookieSelections?.length !== item.cookieSelectionCount);
              return (
              <article className="cart-row" key={item.lineId} data-testid={`row-cart-item-${item.lineId}`}>
                <div className="cart-thumb">
                  {item.image ? <img src={item.image} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} data-testid={`img-cart-item-${item.lineId}`} /> : <span aria-hidden="true">{item.productType === 'cookie' ? 'C' : 'S'}</span>}
                </div>
                <div>
                  <h3 className="cart-item-name" data-testid={`text-cart-name-${item.lineId}`}>{item.name}</h3>
                  {item.cookieSelections?.length ? (
                    <div className="cart-topping">
                      {item.cookieSelections.map((selection, index) => (
                        <div key={`${selection.cookieId}-${index}`}>
                          Cookie {index + 1}: {selection.cookieName}
                          {selection.toppings.length > 0 && ` · ${selection.toppings.map((topping) => topping.name).join(', ')}`}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="cart-topping">{item.toppings.length > 0 ? `With ${item.toppings.map((topping) => topping.name).join(', ')}` : item.description}</div>
                  )}
                  {missingTrioChoices && <p className="field-error" role="alert">Remove and add this trio again from the menu to choose its three cookies.</p>}
                  <div className="quantity-control" aria-label={`Quantity for ${item.name}`}>
                    <button onClick={() => setQuantity(item.lineId, item.quantity - 1)} aria-label={`Decrease ${item.name} quantity`} data-testid={`button-decrease-${item.lineId}`}><Minus size={13} /></button>
                    <span data-testid={`text-quantity-${item.lineId}`}>{item.quantity}</span>
                    <button onClick={() => setQuantity(item.lineId, item.quantity + 1)} aria-label={`Increase ${item.name} quantity`} disabled={item.quantity >= 30} data-testid={`button-increase-${item.lineId}`}><Plus size={13} /></button>
                  </div>
                  <br />
                  <button className="remove-button" onClick={() => removeItem(item.lineId)} data-testid={`button-remove-${item.lineId}`}><Trash2 size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: '-2px' }} />Remove</button>
                </div>
                <div className="line-total" data-testid={`text-line-total-${item.lineId}`}>{formatPrice(item.unitPrice * item.quantity)}</div>
              </article>
              );
            })}
            <Link href="/" className="nav-link" style={{ display: 'inline-flex', marginTop: 18, paddingLeft: 0 }} data-testid="link-continue-shopping">Continue browsing <ArrowRight size={14} /></Link>
          </section>
          <aside className="panel summary-panel">
            <h2 className="panel-title">Order overview</h2>
            <div className="summary-line"><span>{count} {count === 1 ? 'treat' : 'treats'}</span><span>{formatPrice(total)}</span></div>
            <div className="summary-line"><span>Payment</span><span>At school</span></div>
            <div className="summary-line summary-total"><span>Total</span><span data-testid="text-cart-total">{formatPrice(total)}</span></div>
            <p className="notice" style={{ marginTop: 14 }}>No payment is taken online. Pay at school when you collect.</p>
            {items.some((item) => item.cookieSelectionCount && item.cookieSelections?.length !== item.cookieSelectionCount)
              ? <button type="button" className="primary-button" disabled>Choose cookies for the trio first</button>
              : <Link href="/checkout" className="primary-button" data-testid="button-proceed-checkout">Continue to checkout <ArrowRight size={16} /></Link>}
          </aside>
        </div>
      )}
    </div>
  );
}