import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { StoreShell } from '@/components/store-shell';
import { CartProvider } from '@/hooks/use-cart';
import HomePage from '@/pages/home';
import CartPage from '@/pages/cart';
import CheckoutPage from '@/pages/checkout';
import ConfirmationPage from '@/pages/confirmation';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
  Link,
} from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ArrowLeft } from 'lucide-react';

const queryClient = new QueryClient();

function StoreNotFound() {
  return (
    <div className="page-wrap">
      <section
        className="panel empty-state"
        style={{ margin: '80px auto', maxWidth: 620 }}
      >
        <span
          className="section-kicker"
          style={{ justifyContent: 'center' }}
        >
          A little detour
        </span>
        <h2>That page isnâ€™t on the menu.</h2>
        <p>Try the menu, or head back to your bag.</p>
        <Link
          href="/"
          className="primary-button"
          style={{ width: 'auto' }}
          data-testid="link-not-found-home"
        >
          <ArrowLeft size={15} /> Back to the menu
        </Link>
      </section>
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <StoreShell>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/cart" component={CartPage} />
          <Route path="/checkout" component={CheckoutPage} />
          <Route
            path="/confirmation/:reference"
            component={ConfirmationPage}
          />
          <Route component={StoreNotFound} />
        </Switch>
      </StoreShell>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({
  children,
}: {
  children: ReactNode;
}) {
  const [location] = useLocation();

  return (
    <ErrorBoundary resetKey={location}>
      {children}
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CartProvider>
          <WouterRouter hook={useHashLocation}>
            <Router />
          </WouterRouter>
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;


