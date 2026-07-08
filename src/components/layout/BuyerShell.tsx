import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Bell,
  Briefcase,
  LayoutDashboard,
  Users,
  FileText,
  Files,
  Shield,
  FileSignature,
  RotateCw,
  AlertCircle,
  BarChart3,
  CheckSquare,
  Building2,
  Settings,
  Search
} from 'lucide-react'
import { PersonaSwitcher } from './PersonaSwitcher'
import { Toaster } from '@/components/ui/Toaster'
import { customer } from '@/data/policies'
import { cn } from '@/lib/cn'

const sidebarNav = [
  { label: 'Dashboard', to: '/buyer', icon: LayoutDashboard },
  { label: 'Customers', to: '/buyer/customers', icon: Users },
  { label: 'Quotes', to: '/buyer/quotes', icon: FileText },
  { label: 'Applications', to: '/buyer/applications', icon: Files },
  { label: 'Policies', to: '/buyer/policies', icon: Shield },
  { label: 'Endorsements', to: '/buyer/endorsements', icon: FileSignature },
  { label: 'Renewals', to: '/buyer/renewals', icon: RotateCw },
  { label: 'Claims', to: '/buyer/claims', icon: AlertCircle },
  { label: 'Reports', to: '/buyer/reports', icon: BarChart3 },
  { label: 'Tasks', to: '/buyer/tasks', icon: CheckSquare },
  { label: 'Documents', to: '/buyer/documents', icon: FileText },
  { label: 'Carriers', to: '/buyer/carriers', icon: Building2 },
  { label: 'Settings', to: '/buyer/settings', icon: Settings },
]

export function BuyerShell() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Left Sidebar */}
      <aside className="hidden w-[240px] shrink-0 flex-col border-r border-slate-200 bg-white lg:flex sticky top-0 h-screen overflow-y-auto nav-scroll">
        <div className="flex h-[60px] items-center gap-2.5 px-5 cursor-pointer border-b border-transparent hover:bg-slate-50 transition" onClick={() => navigate('/buyer')}>
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-navy-600 text-white shadow-sm">
            <Briefcase className="h-4 w-4" />
          </span>
          <div className="text-[16px] font-bold tracking-tight text-navy-900">VenusPro</div>
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {sidebarNav.map((n) => {
            const isActive = pathname === n.to
            return (
              <NavLink
                key={n.label}
                to={n.to}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition',
                  isActive 
                    ? 'bg-navy-50 text-navy-800 font-semibold' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                )}
              >
                <n.icon className={cn("h-4 w-4", isActive ? "text-navy-600" : "text-slate-400")} strokeWidth={1.75} />
                {n.label}
              </NavLink>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-20 flex h-[60px] items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="hidden sm:inline font-medium">Broker Workspace</span>
          </div>

          <div className="flex items-center gap-3">
            <button className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 transition">
              <Search className="h-4 w-4" />
            </button>
            <button className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 transition">
              <Bell className="h-4 w-4" />
            </button>
            <div className="h-5 w-px bg-slate-200 mx-1" />
            <PersonaSwitcher />
            <span className="grid h-8 w-8 place-items-center rounded-full bg-navy-600 text-[11px] font-bold text-white shadow-sm ring-2 ring-white ml-1">
              {customer.initials}
            </span>
          </div>
        </header>

        {/* Widescreen flexible container */}
        <main className="w-full max-w-[1550px] mx-auto flex-1 p-6">
          <Outlet />
        </main>
      </div>

      <Toaster />
    </div>
  )
}
