import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { useGetStoreCatalog, useCreateOrder } from '@workspace/api-client-react';
import { getGetStoreCatalogQueryKey } from '@workspace/api-client-react';
import type { OrderInput, Weekday } from '@workspace/api-client-react';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, ArrowRight, CalendarDays, CreditCard, LoaderCircle, WalletCards } from 'lucide-react';
import { formatPrice, useCart } from '@/hooks/use-cart';

const orderSchema = z.object({
  name: z.string().trim().min(1, 'Please enter your name.').max(100),
  className: z.string().trim().min(1, 'Please enter your class.').max(30),
  yearGroup: z.string().trim().min(1, 'Please enter your year group.').max(30),
  specialNote: z.string().trim().max(500, 'Keep your note under 500 characters.').optional(),
  requestedWeekday: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], {
    invalid_type_error: 'Choose a weekday.',
  }),
});
type CheckoutValues = z.infer<typeof orderSchema>;

const weekdayQuestion = 'What day of the week would you like your order?';

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const [, setLocation] = useLocation();
  const catalogQuery = useGetStoreCatalog({ query: { queryKey: getGetStoreCatalogQueryKey() } });
  const catalog = catalogQuery.data;
  const createOrder = useCreateOrder();
  const [submitError, setSubmitError] = useState('');
  const [payAtSchoolSelected, setPayAtSchoolSelected] = useState(false);
  const form = useForm<CheckoutValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { name: '', className: '', yearGroup: '', specialNote: '', requestedWeekday: undefined },
    mode: 'onTouched',
  });
  const selectedWeekday = form.watch('requestedWeekday');
  const days = catalog?.orderDays.days ?? [];
  const unavailable = new Set(catalog?.orderDays.unavailableDays ?? []);
  const hasUnconfiguredTrio = items.some(
    (item) => item.cookieSelectionCount && item.cookieSelections?.length !== item.cookieSelectionCount,
  );
  const unavailableDaysLabel = catalog?.orderDays.unavailableDays.length
    ? new Intl.ListFormat('en', { type: 'disjunction' }).format(catalog.orderDays.unavailableDays)
    : null;

  const onSubmit = (values: CheckoutValues) => {
    if (items.length === 0 || !payAtSchoolSelected) return;
    if (hasUnconfiguredTrio) {
      setSubmitError('Please choose the three cookies for your trio before placing the order.');
      return;
    }
    setSubmitError('');
    const data: OrderInput = {
      customer: { name: values.name.trim(), className: values.className.trim(), yearGroup: values.yearGroup.trim() },
      requestedWeekday: values.requestedWeekday,
      specialNote: values.specialNote?.trim() || undefined,
      paymentMethod: 'pay_at_school',
      items: items.map((item) => ({
        productId: item.productId,
        productType: item.productType,
        quantity: item.quantity,
        toppings: item.toppings.map(({ id, name }) => ({ id, name })),
        ...(item.cookieSelections ? {
          cookieSelections: item.cookieSelections.map((selection) => ({
            cookieId: selection.cookieId,
            toppings: selection.toppings.map(({ id, name }) => ({ id, name })),
          })),
        } : {}),
      })),
    };
    createOrder.mutate({ data }, {
      onSuccess: (order) => {
        clearCart();
        setLocation(`/confirmation/${encodeURIComponent(order.reference)}`);
      },
      onError: () => setSubmitError('Your order didn’t go through. Nothing has been submitted. Please try again.'),
    });
  };

  if (items.length === 0 && !createOrder.isSuccess) {
    return (
      <div className="page-wrap">
        <section className="page-heading"><span className="section-kicker">Almost there</span><h1>Checkout.</h1></section>
        <div className="panel empty-state" data-testid="empty-checkout">
          <h2>There’s nothing in your bag yet.</h2><p>Choose a treat first, then we’ll have all the details we need.</p>
          <Link href="/" className="primary-button" style={{ width: 'auto' }} data-testid="link-checkout-menu">Go to the menu <ArrowRight size={16} /></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <section className="page-heading">
        <span className="section-kicker"><CalendarDays size={14} /> One last little thing</span>
        <h1>Make it yours.</h1>
        <p>Choose how you’ll pay, then add the student details and order day.</p>
      </section>
      <div className="checkout-layout">
        <Form {...form}>
          <form className="panel checkout-form" onSubmit={form.handleSubmit(onSubmit)} noValidate data-testid="form-checkout">
            {submitError && <div className="error-banner" role="alert" data-testid="error-order-submit">{submitError}</div>}
            <section className="form-section">
              <div className="form-section-heading"><span className="step-number">01</span><h2>How will you pay?</h2></div>
              <label className="payment-option" data-testid="option-pay-at-school">
                <input className="payment-radio" type="radio" name="payment" checked={payAtSchoolSelected} onChange={() => { setPayAtSchoolSelected(true); setSubmitError(''); }} data-testid="radio-pay-at-school" />
                <span><strong>Pre-Order — Pay at School</strong><small>We’ll prepare your order. Pay when you receive it at school.</small></span>
              </label>
              <div className="locked-payments">
                <div className="locked-payment"><CreditCard size={16} /><span><b>Card</b>Not available yet</span><span className="not-configured">Not configured</span></div>
                <div className="locked-payment"><WalletCards size={16} /><span><b>InstaPay</b>Not available yet</span><span className="not-configured">Not configured</span></div>
              </div>
              <p className="notice" style={{ marginTop: 12 }}>Your order is not prepaid. Please pay at school when you collect.</p>
            </section>
            {payAtSchoolSelected ? (
              <>
                <section className="form-section">
                  <div className="form-section-heading"><span className="step-number">02</span><h2>Who’s ordering?</h2></div>
                  <div className="field-grid">
                    <div className="field full">
                      <label htmlFor="customer-name">Student name</label>
                      <input id="customer-name" autoComplete="name" placeholder="Your full name" {...form.register('name')} data-testid="input-customer-name" />
                      {form.formState.errors.name && <span className="field-error" data-testid="error-customer-name">{form.formState.errors.name.message}</span>}
                    </div>
                    <div className="field">
                      <label htmlFor="customer-class">Class</label>
                      <input id="customer-class" placeholder="e.g. 8B" {...form.register('className')} data-testid="input-customer-class" />
                      {form.formState.errors.className && <span className="field-error" data-testid="error-customer-class">{form.formState.errors.className.message}</span>}
                    </div>
                    <div className="field">
                      <label htmlFor="customer-year">Year group</label>
                      <input id="customer-year" placeholder="e.g. Year 8" {...form.register('yearGroup')} data-testid="input-customer-year-group" />
                      {form.formState.errors.yearGroup && <span className="field-error" data-testid="error-customer-year-group">{form.formState.errors.yearGroup.message}</span>}
                    </div>
                  </div>
                </section>
                <section className="form-section">
                  <div className="form-section-heading"><span className="step-number">03</span><h2>Choose a weekday</h2></div>
                  <p className="day-question">{weekdayQuestion} <span aria-hidden="true">*</span></p>
                  <p className="field-hint">
                    Choose an available weekday.
                    {unavailableDaysLabel && ` Orders are unavailable on ${unavailableDaysLabel}.`}
                  </p>
                  {catalogQuery.isLoading && <div className="skeleton" style={{ height: 98 }} aria-label="Loading weekday availability" />}
                  {catalogQuery.isError && <div className="error-banner" role="alert">Weekday availability could not load. <button type="button" onClick={() => void catalogQuery.refetch()} data-testid="button-retry-days">Try again</button></div>}
                  {catalog && (
                    <>
                      <div className="day-grid" role="radiogroup" aria-label={weekdayQuestion} data-testid="group-order-weekdays">
                        {days.map((day) => (
                          <button
                            type="button"
                            key={day}
                            role="radio"
                            aria-checked={selectedWeekday === day}
                            disabled={unavailable.has(day)}
                            className={`day-option ${selectedWeekday === day ? 'selected' : ''}`}
                            onClick={() => form.setValue('requestedWeekday', day as Weekday, { shouldDirty: true, shouldTouch: true, shouldValidate: true })}
                            data-testid={`button-order-weekday-${day.toLowerCase()}`}
                          >{day}</button>
                        ))}
                      </div>
                      <input type="hidden" {...form.register('requestedWeekday')} />
                      {form.formState.errors.requestedWeekday && <span className="field-error" data-testid="error-order-weekday">{form.formState.errors.requestedWeekday.message}</span>}
                    </>
                  )}
                  {catalog && days.filter((day) => !unavailable.has(day)).length === 0 && <p className="field-error">There are no weekdays available right now.</p>}
                  {selectedWeekday && <p className="field-hint" style={{ marginTop: 12, marginBottom: 0 }} data-testid="text-selected-order-weekday">Requested weekday: {selectedWeekday}</p>}
                </section>
                <section className="form-section">
                  <div className="form-section-heading"><span className="step-number">04</span><h2>Special note <span className="field-hint">(optional)</span></h2></div>
                  <div className="field full">
                    <label htmlFor="order-special-note">Add a note for your order</label>
                    <textarea
                      id="order-special-note"
                      rows={3}
                      maxLength={500}
                      placeholder="Anything we should know about your order?"
                      {...form.register('specialNote')}
                      data-testid="input-order-special-note"
                    />
                    <span className="field-hint">Optional · up to 500 characters</span>
                    {form.formState.errors.specialNote && <span className="field-error" data-testid="error-order-special-note">{form.formState.errors.specialNote.message}</span>}
                  </div>
                </section>
                {hasUnconfiguredTrio && <p className="field-error" role="alert">Go back to your bag, remove this trio, and add it again to choose the three cookies.</p>}
                <button type="submit" className="primary-button" disabled={createOrder.isPending || hasUnconfiguredTrio || catalogQuery.isLoading || catalogQuery.isError || days.filter((day) => !unavailable.has(day)).length === 0} data-testid="button-submit-order">
                  {createOrder.isPending ? <><LoaderCircle size={16} className="animate-spin" /> Saving your order…</> : <>Place pay-at-school order <ArrowRight size={16} /></>}
                </button>
              </>
            ) : (
              <p className="field-hint" role="status">Choose pay at school to enter your student details and order day.</p>
            )}
            <Link href="/cart" className="nav-link" style={{ justifyContent: 'center' }} data-testid="link-back-to-cart"><ArrowLeft size={14} /> Back to bag</Link>
          </form>
        </Form>
        <aside className="panel summary-panel">
          <h2 className="panel-title">Your order</h2>
          {items.map((item) => (
            <div className="summary-line" key={item.lineId} data-testid={`summary-item-${item.lineId}`}>
              <span>
                {item.quantity} × {item.name}
                {item.cookieSelections?.map((selection, index) => (
                  <small key={`${selection.cookieId}-${index}`} style={{ display: 'block', marginTop: 3 }}>
                    Cookie {index + 1}: {selection.cookieName}{selection.toppings.length > 0 ? ` · ${selection.toppings.map((topping) => topping.name).join(', ')}` : ''}
                  </small>
                ))}
                {!item.cookieSelections?.length && item.toppings.length > 0 && <small style={{ display: 'block', marginTop: 3 }}>{item.toppings.map((topping) => topping.name).join(', ')}</small>}
              </span>
              <span>{formatPrice(item.unitPrice * item.quantity)}</span>
            </div>
          ))}
          <div className="summary-line"><span>Payment</span><span>At school</span></div>
          <div className="summary-line summary-total"><span>Total due at school</span><span data-testid="text-checkout-total">{formatPrice(total)}</span></div>
          <p className="notice" style={{ marginTop: 14 }}>No online payment is processed. You’ll pay at school.</p>
        </aside>
      </div>
    </div>
  );
}