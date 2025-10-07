import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import SplashPage from "@/pages/splash";
import LoginPage from "@/pages/login";
import MenuPage from "@/pages/menu";
import SearchPage from "@/pages/search";
import PaymentPage from "@/pages/payment";

import InvoicePage from "@/pages/invoice";
import DashboardPage from "@/pages/dashboard";
import AdminPage from "@/pages/admin";
import StockManagementPage from "@/pages/stock-management";

function Router() {
  return (
    <Switch>
      <Route path="/" component={SplashPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/menu" component={MenuPage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/payment" component={PaymentPage} />

      <Route path="/invoice" component={InvoicePage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/stock-management" component={StockManagementPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
