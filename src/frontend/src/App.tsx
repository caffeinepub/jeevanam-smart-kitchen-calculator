import { createRouter, createRoute, createRootRoute, RouterProvider, Outlet, redirect } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import Dashboard from './pages/Dashboard';
import RecipeMaster from './pages/RecipeMaster';
import ProductionCalculator from './pages/ProductionCalculator';
import CostControl from './pages/CostControl';
import RawMaterialMaster from './pages/RawMaterialMaster';
import Login from './pages/Login';
import Layout from './components/Layout';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
});

function ProtectedLayout() {
  const { identity, isInitializing } = useInternetIdentity();
  
  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    window.location.href = '/login';
    return null;
  }

  return <Layout><Outlet /></Layout>;
}

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'layout',
  component: ProtectedLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/',
  component: Dashboard,
});

const recipeMasterRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/recipe-master',
  component: RecipeMaster,
});

const rawMaterialMasterRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/raw-material-master',
  component: RawMaterialMaster,
});

const productionCalculatorRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/production-calculator',
  component: ProductionCalculator,
});

const costControlRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/cost-control',
  component: CostControl,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  layoutRoute.addChildren([
    dashboardRoute,
    recipeMasterRoute,
    rawMaterialMasterRoute,
    productionCalculatorRoute,
    costControlRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  );
}
