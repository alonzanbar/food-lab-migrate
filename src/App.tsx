import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import Login from "./pages/Login";
import AdminLayout from "./pages/admin/AdminLayout";
import FormsList from "./pages/admin/FormsList";
import UploadForm from "./pages/admin/UploadForm";
import FormReview from "./pages/admin/FormReview";
import ReportsList from "./pages/admin/ReportsList";
import CreateReport from "./pages/admin/CreateReport";
import ReportResults from "./pages/admin/ReportResults";
import InviteUsers from "./pages/admin/InviteUsers";
import WorkerLayout from "./pages/worker/WorkerLayout";
import WorkerForms from "./pages/worker/WorkerForms";
import FillForm from "./pages/worker/FillForm";
import SubmissionSuccess from "./pages/worker/SubmissionSuccess";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/onboarding/Onboarding";
import AcceptInvite from "./pages/onboarding/AcceptInvite";
import SuperuserLayout from "./pages/superuser/SuperuserLayout";
import TenantList from "./pages/superuser/TenantList";
import TenantDetail from "./pages/superuser/TenantDetail";
import CreateTenant from "./pages/superuser/CreateTenant";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, role, tenantId, isSuperuser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse-slow text-muted-foreground text-lg font-display">FactoryFlow</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (!tenantId) {
    return (
      <Routes>
        <Route path="/onboarding" element={isSuperuser ? <Navigate to="/superuser/tenants" replace /> : <Onboarding />} />
        <Route path="/onboarding/accept" element={<AcceptInvite />} />
        <Route path="/superuser" element={isSuperuser ? <SuperuserLayout /> : <Navigate to="/onboarding" replace />}>
          <Route index element={<Navigate to="/superuser/tenants" replace />} />
          <Route path="tenants" element={<TenantList />} />
          <Route path="tenants/create" element={<CreateTenant />} />
          <Route path="tenants/:id" element={<TenantDetail />} />
        </Route>
        <Route path="*" element={<Navigate to={isSuperuser ? "/superuser/tenants" : "/onboarding"} replace />} />
      </Routes>
    );
  }

  // Redirect based on role (superuser with tenant uses admin/worker from that tenant)
  const defaultPath = role === "admin" ? "/admin/forms" : "/worker";

  return (
    <Routes>
      <Route path="/" element={<Navigate to={defaultPath} replace />} />
      <Route path="/login" element={<Navigate to={defaultPath} replace />} />

      {/* Admin routes */}
      <Route path="/admin" element={role === "admin" ? <AdminLayout /> : <Navigate to="/worker" replace />}>
        <Route index element={<Navigate to="/admin/forms" replace />} />
        <Route path="forms" element={<FormsList />} />
        <Route path="forms/upload" element={<UploadForm />} />
        <Route path="forms/:id" element={<FormReview />} />
        <Route path="reports" element={<ReportsList />} />
        <Route path="reports/create" element={<CreateReport />} />
        <Route path="reports/:id" element={<ReportResults />} />
        <Route path="invites" element={<InviteUsers />} />
      </Route>

      {/* Worker routes */}
      <Route path="/worker" element={<WorkerLayout />}>
        <Route index element={<WorkerForms />} />
        <Route path="forms/:id" element={<FillForm />} />
        <Route path="success" element={<SubmissionSuccess />} />
      </Route>

      <Route path="/onboarding" element={<Navigate to={defaultPath} replace />} />
      <Route path="/onboarding/accept" element={<Navigate to={defaultPath} replace />} />

      <Route path="/superuser" element={isSuperuser ? <SuperuserLayout /> : <Navigate to={defaultPath} replace />}>
        <Route index element={<Navigate to="/superuser/tenants" replace />} />
        <Route path="tenants" element={<TenantList />} />
        <Route path="tenants/create" element={<CreateTenant />} />
        <Route path="tenants/:id" element={<TenantDetail />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
