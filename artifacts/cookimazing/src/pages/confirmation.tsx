import { Link, useRoute } from 'wouter';
import { useGetOrder, getGetOrderQueryKey } from '@workspace/api-client-react';
import { ArrowRight, Check, LoaderCircle } from 'lucide-react';
import { formatPrice } from '@/hooks/use-cart';

export default function ConfirmationPage() {
  const [, params] = useRoute<{ reference: string }>('/confirmation/:reference');
  const reference = params?.reference ? decodeURIComponent(params.reference) : '';
  const query = useGetOrder(reference, { query: { enabled: !!reference, queryKey: getGetOrderQueryKey(reference) } });

  return (
    <div className="page-wrap">
      <section className="page-heading" style={{ paddingBottom: 0 }}>
        <span className="section-kicker">A note from the kitchen</span>
      </section>
      {query.isLoading && <div className="loading-card" aria-label="Loading saved order"><LoaderCircle size={19} className="animate-spin" /> Loading your saved order…</div>}
      {query.isError && <div className="error-card" role="alert" data-testid="error-order-load">We couldn’t load this saved order. Check the reference in your link and try again.</div>}
      {!query.isLoading && !query.isError && query.data && (
        <section className="confirm-card" data-testid="card-order-confirmation">
          <div className="confirm-seal"><Check size={29} strokeWidth={2.6} /></div>
          <span className="section-kicker">Order saved</span>
          <h1>Thanks, {query.data.customer.name.split(' ')[0]}.</h1>
          <p>Your order is saved for BISC Cairo. Bring your appetite and pay at school when you collect.</p>
          <div className="reference-chip" data-testid="text-order-reference">REF · {query.data.reference}</div>
          <div className="notice" style={{ textAlign: 'left' }} data-testid="status-payment">
            <strong>Payment due at school.</strong> If you chose to pay at school, you can pay when you collect your order on your selected day.

If you paid through InstaPay, our staff will review your payment as soon as possible. Once your payment has been verified, your order will be prepared for collection on the day you selected.
          </div>
          <div className="receipt">
            <div className="receipt-heading">
              <h2>Your receipt</h2>
               <span className="receipt-day" data-testid="text-receipt-order-weekday">
                 {query.data.requestedWeekday ? `Requested for ${query.data.requestedWeekday}` : 'Weekday not recorded on this older order'}
               </span>
            </div>
            {query.data.items.map((item, index) => (
              <div className="receipt-row" key={`${item.productId}-${index}`} data-testid={`receipt-item-${item.productId}-${index}`}>
                <span>
                  {item.quantity} × {item.name}
                  {item.cookieSelections?.length ? (
                    item.cookieSelections.map((selection, selectionIndex) => (
                      <small key={`${selection.cookieId}-${selectionIndex}`}>
                        Cookie {selectionIndex + 1}: {selection.cookieName}{selection.toppings.length > 0 ? ` · ${selection.toppings.map((topping) => topping.name).join(', ')}` : ''}
                      </small>
                    ))
                  ) : (
                    <small>{item.toppings.length > 0 ? item.toppings.map((topping) => topping.name).join(', ') : item.productType === 'cookie' ? 'Classic cookie' : 'Shake'}</small>
                  )}
                </span>
                <strong>{formatPrice(item.lineTotal)}</strong>
              </div>
            ))}
            <div className="receipt-row receipt-total"><span>Total · due at school</span><span data-testid="text-receipt-total">{formatPrice(query.data.total)}</span></div>
            {query.data.specialNote && (
              <div className="notice" style={{ marginTop: 18 }} data-testid="text-receipt-special-note">
                <strong>Special note</strong>
                <p style={{ margin: '5px 0 0' }}>{query.data.specialNote}</p>
              </div>
            )}
            <div className="receipt-meta">
              <div><small>Student</small><strong data-testid="text-receipt-customer">{query.data.customer.name}</strong></div>
              <div><small>Class · year group</small><strong>{query.data.customer.className} · {query.data.customer.yearGroup}</strong></div>
              <div><small>Payment status</small><strong data-testid="text-payment-status">{query.data.paymentStatus === 'due_at_school' ? 'Due at school' : 'Not processed'}</strong></div>
              <div><small>Saved</small><strong>{new Date(query.data.createdAt).toLocaleString()}</strong></div>
            </div>
          </div>
          <Link href="/" className="primary-button" style={{ width: 'auto', marginTop: 26 }} data-testid="link-order-more">Back to the menu <ArrowRight size={16} /></Link>
        </section>
      )}
      {!reference && <div className="error-card" role="alert">There’s no order reference in this link.</div>}
    </div>
  );
}