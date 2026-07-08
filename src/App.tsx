import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import Dashboard from '@/pages/Dashboard'
import FormList from '@/pages/FormList'
import FormBasicInfo from '@/pages/FormBasicInfo'
import SectionBuilder from '@/pages/SectionBuilder'
import FieldBuilder from '@/pages/FieldBuilder'
import ConditionalLogic from '@/pages/ConditionalLogic'
import FormulaBuilder from '@/pages/FormulaBuilder'
import ValidationEngine from '@/pages/ValidationEngine'
import RepeatingGrid from '@/pages/RepeatingGrid'
import LookupBuilder from '@/pages/LookupBuilder'
import RuleBuilder from '@/pages/RuleBuilder'
import WorkflowNav from '@/pages/WorkflowNav'
import RuntimePreview from '@/pages/RuntimePreview'
import ReviewSubmit from '@/pages/ReviewSubmit'
import Outputs from '@/pages/Outputs'
import Versioning from '@/pages/Versioning'
import AuditModule from '@/pages/AuditModule'
import ApiLayer from '@/pages/ApiLayer'
import SettingsPage from '@/pages/Settings'
import UsersRoles from '@/pages/UsersRoles'
import AiGenerate from '@/pages/AiGenerate'
import CustomerPortal from '@/pages/CustomerPortal'
import { CustomerShell } from '@/components/layout/CustomerShell'
import CustomerHome from '@/pages/customer/CustomerHome'
import MyPolicies from '@/pages/customer/MyPolicies'
import PolicyDetail from '@/pages/customer/PolicyDetail'
import QuotePicker from '@/pages/customer/QuotePicker'
import { BuyerShell } from '@/components/layout/BuyerShell'
import BuyerHome from '@/pages/buyer/BuyerHome'
import BuyerApply from '@/pages/buyer/BuyerApply'
import Carriers from '@/pages/admin/Carriers'
import Products from '@/pages/admin/Products'
import GuardrailsPage from '@/pages/Guardrails'
import TemplateLibrary from '@/pages/documents/TemplateLibrary'
import DocumentBuilder from '@/pages/documents/DocumentBuilder'
import ClauseLibrary from '@/pages/documents/ClauseLibrary'
import DocumentPackages from '@/pages/documents/DocumentPackages'
import Applications from '@/pages/admin/Applications'

function AdminLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Standalone applicant flow (new quote / endorsement / claim / cancel / renew) */}
      <Route path="/apply" element={<CustomerPortal />} />

      {/* Customer self-service portal */}
      <Route element={<CustomerShell />}>
        <Route path="/portal" element={<CustomerHome />} />
        <Route path="/portal/quote" element={<QuotePicker />} />
        <Route path="/portal/policies" element={<MyPolicies />} />
        <Route path="/portal/policies/:id" element={<PolicyDetail />} />
      </Route>

      {/* Buyer Marketplace Portal */}
      <Route element={<BuyerShell />}>
        <Route path="/buyer" element={<BuyerHome />} />
        <Route path="/buyer/apply/:productId" element={<BuyerApply />} />
      </Route>

      {/* Admin / designer app */}
      <Route element={<AdminLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/forms" element={<FormList />} />
        <Route path="/carriers" element={<Carriers />} />
        <Route path="/products" element={<Products />} />
        <Route path="/guardrails" element={<GuardrailsPage />} />
        <Route path="/forms/new" element={<FormBasicInfo />} />
        <Route path="/ai" element={<AiGenerate />} />
        <Route path="/builder/sections" element={<SectionBuilder />} />
        <Route path="/builder/fields" element={<FieldBuilder />} />
        <Route path="/builder/logic" element={<ConditionalLogic />} />
        <Route path="/builder/formula" element={<FormulaBuilder />} />
        <Route path="/builder/validation" element={<ValidationEngine />} />
        <Route path="/builder/grid" element={<RepeatingGrid />} />
        <Route path="/builder/lookup" element={<LookupBuilder />} />
        <Route path="/builder/rules" element={<RuleBuilder />} />
        <Route path="/builder/workflow" element={<WorkflowNav />} />
        <Route path="/preview" element={<RuntimePreview />} />
        <Route path="/review" element={<ReviewSubmit />} />
        <Route path="/outputs" element={<Outputs />} />
        <Route path="/documents" element={<TemplateLibrary />} />
        <Route path="/documents/templates" element={<TemplateLibrary />} />
        <Route path="/documents/builder/:id" element={<DocumentBuilder />} />
        <Route path="/documents/clauses" element={<ClauseLibrary />} />
        <Route path="/documents/packages" element={<DocumentPackages />} />
        <Route path="/versions" element={<Versioning />} />
        <Route path="/audit" element={<AuditModule />} />
        <Route path="/api" element={<ApiLayer />} />
        <Route path="/users" element={<UsersRoles />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
