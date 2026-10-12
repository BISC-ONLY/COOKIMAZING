import { useState } from 'react';
import { ArrowDown, ArrowRight, Plus, X } from 'lucide-react';
import { useGetStoreCatalog } from '@workspace/api-client-react';
import type { Product, Topping } from '@workspace/api-client-react';
import { getGetStoreCatalogQueryKey } from '@workspace/api-client-react';
import { formatPrice, useCart, type CartCookieSelection, type CartProductType } from '@/hooks/use-cart';

function ProductArt({ image, name, type, className = '' }: { image: string; name: string; type: CartProductType; className?: string }) {
  const [failed, setFailed] = useState(!image);
  return (
    <div className={`product-photo ${failed ? 'fallback' : ''} ${className}`}>
      {!failed && image
        ? <img src={image} alt={name} onError={() => setFailed(true)} data-testid={`img-product-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} />
        : <div className={type === 'cookie' ? 'cookie-illustration' : 'shake-illustration'} aria-label={`${type} illustration`} />}
    </div>
  );
}

function ProductCard({ product, type, onCustomize }: { product: Product; type: CartProductType; onCustomize: (product: Product, type: CartProductType) => void }) {
  return (
    <article className="product-card" data-testid={`card-product-${product.id}`}>
      <ProductArt image={product.image} name={product.name} type={type} />
      <div className="product-info">
        <div className="product-topline">
          <h3 className="product-name" data-testid={`text-product-name-${product.id}`}>{product.name}</h3>
          <span className="product-price" data-testid={`text-product-price-${product.id}`}>{formatPrice(product.price)}</span>
        </div>
        <p className="product-desc">{product.description}</p>
        <button className="product-action" onClick={() => onCustomize(product, type)} data-testid={`button-customize-${product.id}`}>
          <Plus size={15} /> {product.toppingsAllowed ? 'Customize & add' : 'Add to bag'}
        </button>
      </div>
    </article>
  );
}

function CustomizeDialog({ product, type, toppings, onClose, onAdd }: {
  product: Product;
  type: CartProductType;
  toppings: Topping[];
  onClose: () => void;
  onAdd: (product: Product, type: CartProductType, toppings: Topping[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const selection = toppings.filter((topping) => selected.includes(topping.id));
  const total = product.price + selection.reduce((sum, topping) => sum + topping.price, 0);
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="customize-modal" role="dialog" aria-modal="true" aria-labelledby="customize-title" data-testid="dialog-customize">
        <div className="modal-head">
          <div><span className="section-kicker">Make it yours</span><h2 id="customize-title">{product.name}</h2><p>{product.description}</p></div>
          <button className="icon-button" onClick={onClose} aria-label="Close customization" data-testid="button-close-customize"><X size={17} /></button>
        </div>
        <div className="topping-list">
          {toppings.length > 0 ? toppings.map((topping) => (
            <label className="topping-option" key={topping.id} data-testid={`option-topping-${topping.id}`}>
              <input type="checkbox" checked={selected.includes(topping.id)} onChange={() => toggle(topping.id)} data-testid={`checkbox-topping-${topping.id}`} />
              <span>{topping.name}</span>
              <span>{topping.price > 0 ? `+ ${formatPrice(topping.price)}` : 'Included'}</span>
            </label>
          )) : <p className="field-hint">This one is lovely just as it is.</p>}
        </div>
        <div className="modal-footer">
          <strong>{formatPrice(total)}</strong>
          <button className="primary-button" onClick={() => { onAdd(product, type, selection); onClose(); }} data-testid="button-add-customized">
            Add to bag <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}

type CookieSlot = { cookieId: string; toppingIds: string[] };

function TripleCookieDialog({ product, cookies, toppings, onClose, onAdd }: {
  product: Product;
  cookies: Product[];
  toppings: Topping[];
  onClose: () => void;
  onAdd: (selections: CartCookieSelection[]) => void;
}) {
  const cookieCount = product.cookieSelectionCount ?? 3;
  const [slots, setSlots] = useState<CookieSlot[]>(() =>
    Array.from({ length: cookieCount }, () => ({ cookieId: '', toppingIds: [] })),
  );
  const toppingTotal = slots.reduce((sum, slot) => (
    sum + toppings
      .filter((topping) => slot.toppingIds.includes(topping.id))
      .reduce((slotTotal, topping) => slotTotal + topping.price, 0)
  ), 0);
  const allCookiesChosen = slots.length === cookieCount
    && slots.every((slot) => cookies.some((cookie) => cookie.id === slot.cookieId));

  const addSelectionToBag = () => {
    const selections = slots.flatMap((slot) => {
      const cookie = cookies.find((option) => option.id === slot.cookieId);
      if (!cookie) return [];
      return [{
        cookieId: cookie.id,
        cookieName: cookie.name,
        toppings: toppings.filter((topping) => slot.toppingIds.includes(topping.id)),
      }];
    });
    if (selections.length === cookieCount) onAdd(selections);
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="customize-modal" role="dialog" aria-modal="true" aria-labelledby="triple-cookie-title" data-testid="dialog-triple-cookies">
        <div className="modal-head">
          <div>
            <span className="section-kicker">Build your trio</span>
            <h2 id="triple-cookie-title">{product.name}</h2>
            <p>Pick three regular cookies. You can repeat a flavor, and choose toppings for each one.</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close cookie selection" data-testid="button-close-triple-cookies"><X size={17} /></button>
        </div>
        <div className="topping-list" style={{ maxHeight: 'min(52dvh, 450px)', overflowY: 'auto' }}>
          {slots.map((slot, slotIndex) => {
            const selectedCookie = cookies.find((cookie) => cookie.id === slot.cookieId);
            return (
              <fieldset className="panel" key={slotIndex} style={{ padding: 15 }}>
                <legend><strong>Cookie {slotIndex + 1}</strong></legend>
                <label className="field">
                  <span>Choose a cookie</span>
                  <select
                    value={slot.cookieId}
                    onChange={(event) => setSlots((current) => current.map((currentSlot, index) => (
                      index === slotIndex ? { cookieId: event.target.value, toppingIds: [] } : currentSlot
                    )))}
                    data-testid={`select-triple-cookie-${slotIndex + 1}`}
                  >
                    <option value="">Select a cookie</option>
                    {cookies.map((cookie) => <option key={cookie.id} value={cookie.id}>{cookie.name}</option>)}
                  </select>
                </label>
                {selectedCookie && (
                  <div className="topping-list" style={{ marginBottom: 0 }}>
                    <p className="field-hint" style={{ margin: '12px 0 8px' }}>Toppings for {selectedCookie.name} (optional)</p>
                    {toppings.map((topping) => (
                      <label className="topping-option" key={topping.id}>
                        <input
                          type="checkbox"
                          checked={slot.toppingIds.includes(topping.id)}
                          onChange={() => setSlots((current) => current.map((currentSlot, index) => (
                            index !== slotIndex
                              ? currentSlot
                              : {
                                ...currentSlot,
                                toppingIds: currentSlot.toppingIds.includes(topping.id)
                                  ? currentSlot.toppingIds.filter((id) => id !== topping.id)
                                  : [...currentSlot.toppingIds, topping.id],
                              }
                          )))}
                          data-testid={`checkbox-triple-cookie-${slotIndex + 1}-${topping.id}`}
                        />
                        <span>{topping.name}</span>
                        <span>+ {formatPrice(topping.price)}</span>
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>
            );
          })}
        </div>
        <div className="modal-footer">
          <strong>{formatPrice(product.price + toppingTotal)}</strong>
          <button className="primary-button" onClick={addSelectionToBag} disabled={!allCookiesChosen} data-testid="button-add-triple-cookies">
            Add trio to bag <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}

function ProductSkeleton() {
  return <div className="product-grid" aria-label="Loading menu"><div className="panel skeleton" style={{ height: 330 }} /><div className="panel skeleton" style={{ height: 330 }} /><div className="panel skeleton" style={{ height: 330 }} /></div>;
}

export default function HomePage() {
  const catalogQuery = useGetStoreCatalog({ query: { queryKey: getGetStoreCatalogQueryKey() } });
  const { data: catalog, isLoading, isError, refetch } = catalogQuery;
  const [category, setCategory] = useState<'cookies' | 'shakes'>('cookies');
  const [customizing, setCustomizing] = useState<{ product: Product; type: CartProductType } | null>(null);
  const { addItem } = useCart();
  const productList = category === 'cookies' ? catalog?.cookies : catalog?.shakes;
  const toppings = category === 'cookies' ? catalog?.cookieToppings : catalog?.drinkToppings;
  const heroImage = catalog?.cookies?.[0]?.image;

  return (
    <>
      <div className="page-wrap">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">A little joy between classes</span>
            <h1><span>COOKIMAZING 🍪</span><br />BISC Cairo Only.</h1>
            <p>Freshly baked cookies, dreamy shakes, and your own favorite little extras. Made for school days that need a sweet moment.</p>
          </div>
          <div className="hero-art" aria-hidden="true">
            {heroImage
              ? <img className="hero-cookie" src={heroImage} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
              : <div className="hero-cookie hero-cookie-fallback">C♡</div>}
            <div className="hero-sticker">Baked<br />for your<br />school day</div>
          </div>
        </section>
      </div>
      <div className="ticker" aria-hidden="true"><div className="ticker-track">{Array.from({ length: 4 }, (_, index) => <span key={index}>SOFT CENTRES <span className="ticker-dot">·</span> BIG LITTLE TREATS <span className="ticker-dot">·</span> BISC CAIRO ONLY <span className="ticker-dot">·</span></span>)}</div></div>
      <section className="page-wrap menu-section" id="menu">
        <div className="section-head">
          <div><span className="section-kicker">The good stuff</span><h2>Pick what makes you happy.</h2></div>
          <p className="section-note">Choose a classic, then make it yours with a few extra delicious details.</p>
        </div>
        <div className="category-tabs" role="tablist" aria-label="Menu categories">
          <button className={`category-tab ${category === 'cookies' ? 'active' : ''}`} role="tab" aria-selected={category === 'cookies'} onClick={() => setCategory('cookies')} data-testid="tab-cookies">Cookies</button>
          <button className={`category-tab ${category === 'shakes' ? 'active' : ''}`} role="tab" aria-selected={category === 'shakes'} onClick={() => setCategory('shakes')} data-testid="tab-shakes">Shakes</button>
        </div>
        {isLoading && <ProductSkeleton />}
        {isError && <div className="error-card" role="alert"><p>We couldn’t bring up the menu right now.</p><button className="secondary-button" onClick={() => void refetch()} data-testid="button-retry-catalog">Try again</button></div>}
        {!isLoading && !isError && productList?.length === 0 && <div className="empty-state panel"><h2>Fresh batch coming soon.</h2><p>There are no {category} on the menu just yet. Check back for something good.</p></div>}
        {!isLoading && !isError && productList && productList.length > 0 && (
          <div className="product-grid">
            {productList.map((product) => <ProductCard key={product.id} product={product} type={category === 'cookies' ? 'cookie' : 'shake'} onCustomize={(selectedProduct, type) => {
              if (selectedProduct.cookieSelectionCount || selectedProduct.toppingsAllowed) setCustomizing({ product: selectedProduct, type });
              else addItem(selectedProduct, type, []);
            }} />)}
          </div>
        )}
        {!isLoading && !isError && !catalog && <div className="error-card">The menu is unavailable right now. Please try again shortly.</div>}
      </section>
      <div className="page-wrap">
        <section className="promise-band">
          <div><h3>Made for the school-day sweet spot.</h3><p>Place your order online, pick a day, then pay at school when you collect. No online payment is taken.</p></div>
          <span className="promise-tag">BISC Cairo · only</span>
        </section>
      </div>
      {customizing?.product.cookieSelectionCount ? (
        <TripleCookieDialog
          key={customizing.product.id}
          product={customizing.product}
          cookies={catalog?.cookies.filter((cookie) => cookie.toppingsAllowed && !cookie.cookieSelectionCount) ?? []}
          toppings={catalog?.cookieToppings ?? []}
          onClose={() => setCustomizing(null)}
          onAdd={(selections) => {
            addItem(customizing.product, 'cookie', [], selections);
            setCustomizing(null);
          }}
        />
      ) : customizing ? (
        <CustomizeDialog product={customizing.product} type={customizing.type} toppings={customizing.type === 'cookie' ? catalog?.cookieToppings ?? [] : catalog?.drinkToppings ?? []} onClose={() => setCustomizing(null)} onAdd={addItem} />
      ) : null}
    </>
  );
}