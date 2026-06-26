import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ShieldCheck, Home, FileText, Bell } from 'lucide-react'
import { PersonaSwitcher } from './PersonaSwitcher'
import { Toaster } from '@/components/ui/Toaster'
import { customer } from '@/data/policies'
import { cn } from '@/lib/cn'

const nav = [
  { label: 'Home', to: '/portal', icon: Home, end: true },
  { label: 'My Policies', to: '/portal/policies', icon: FileText },
]

export function CustomerShell() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
          <button onClick={() => navigate('/portal')} className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-white">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="text-left leading-tight">
              <div className="text-sm font-bold tracking-tight text-navy-800">VENUSPRO Insurance</div>
              <div className="text-[11px] text-slate-400">Customer Portal</div>
            </div>
          </button>

          <nav className="hidden items-center gap-1 sm:flex">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition',
                    isActive ? 'bg-navy-50 text-navy-800' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
                  )
                }
              >
                <n.icon className="h-4 w-4" strokeWidth={1.75} />
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button className="hidden rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-600 sm:block" onClick={() => navigate('/portal/quote')}>
              Get a Quote
            </button>
            <button className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100">
              <Bell className="h-4 w-4" />
            </button>
            <PersonaSwitcher />
            <span className="grid h-8 w-8 place-items-center rounded-full bg-navy-700 text-[11px] font-bold text-white">
              {customer.initials}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-[11px] text-slate-400">
        VENUSPRO Insurance · Customer Self-Service Portal · Demo
      </footer>
      <Toaster />
    </div>
  )
}
