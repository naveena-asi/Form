import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState, type ReactNode } from 'react'
import { useFormStore } from '@/store/useFormStore'
import {
  Sparkles,
  Search,
  Bell,
  ChevronRight,
  ChevronDown,
  User,
  Settings,
  Users,
  LogOut,
  ScrollText,
  PlayCircle,
} from 'lucide-react'
import { navGroups, trailFor, type NavItem } from './nav'
import { DesignerFlow } from './DesignerFlow'
import { PersonaSwitcher } from './PersonaSwitcher'
import { Dropdown } from '@/components/ui/Dropdown'
import { Toaster } from '@/components/ui/Toaster'
import { toast } from '@/store/useToast'
import { cn } from '@/lib/cn'

function Brand() {
  return (
    <NavLink
      to="/"
      className="flex items-center gap-2.5 px-5 py-4 transition-opacity hover:opacity-90"
    >
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 text-white shadow-sm">
        <Sparkles className="h-5 w-5" />
      </span>
      <div className="leading-tight">
        <div className="text-[15px] font-bold tracking-tight text-white">VENUSPRO</div>
        <div className="text-[10px] font-medium uppercase tracking-wider text-navy-300">
          Form Platform
        </div>
      </div>
    </NavLink>
  )
}

const NAV_COLLAPSE_KEY = 'venuspro:nav:collapsed'

/** True when the current route lives under this nav item. */
function isItemActive(item: NavItem, pathname: string): boolean {
  if (item.end) return pathname === item.to
  return pathname === item.to || pathname.startsWith(item.to + '/')
}

function Sidebar() {
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(NAV_COLLAPSE_KEY)
      return new Set<string>(raw ? JSON.parse(raw) : [])
    } catch {
      return new Set<string>()
    }
  })

  const persist = (next: Set<string>) => {
    try {
      localStorage.setItem(NAV_COLLAPSE_KEY, JSON.stringify([...next]))
    } catch {
      /* storage unavailable — keep in-memory only */
    }
  }

  const toggle = (title: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(title) ? next.delete(title) : next.add(title)
      persist(next)
      return next
    })

  // Navigating into a group always reveals it, even if it was collapsed.
  useEffect(() => {
    const active = navGroups.find((g) => g.items.some((it) => isItemActive(it, pathname)))
    if (!active) return
    setCollapsed((prev) => {
      if (!prev.has(active.title)) return prev
      const next = new Set(prev)
      next.delete(active.title)
      persist(next)
      return next
    })
  }, [pathname])

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-navy-800/60 bg-navy-900 lg:flex">
      <Brand />
      <div className="mx-3 mb-1 h-px bg-navy-800/70" />
      <nav className="nav-scroll flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {navGroups.map((group) => {
          const open = !collapsed.has(group.title)
          return (
            <div key={group.title} className="pb-1">
              <button
                type="button"
                onClick={() => toggle(group.title)}
                aria-expanded={open}
                className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-navy-400 transition-colors hover:text-navy-200"
              >
                <span>{group.title}</span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 transition-transform duration-200',
                    open ? '' : '-rotate-90',
                  )}
                />
              </button>
              <div
                className={cn(
                  'grid transition-all duration-200 ease-out',
                  open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                )}
              >
                <div className="overflow-hidden">
                  <div className="space-y-0.5 pt-0.5">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                          cn(
                            'group relative flex items-center gap-2.5 rounded-lg py-2 pl-3.5 pr-2.5 text-[13px] font-medium transition-colors',
                            isActive
                              ? 'bg-navy-700/70 text-white'
                              : 'text-navy-200 hover:bg-navy-800 hover:text-white',
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span
                              className={cn(
                                'absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-400 transition-opacity',
                                isActive ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            <item.icon
                              className={cn(
                                'h-4 w-4 shrink-0 transition-colors',
                                isActive
                                  ? 'text-brand-300'
                                  : 'text-navy-300 group-hover:text-white',
                              )}
                            />
                            <span className="truncate">{item.label}</span>
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </nav>
      <div className="border-t border-navy-800 px-4 py-3">
        <div className="flex items-center gap-2 text-[10px] font-medium text-navy-400">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
          <span>v0.1 · Metadata-Driven</span>
        </div>
      </div>
    </aside>
  )
}

function Topbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const trail = trailFor(pathname)

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(q.trim() ? `/forms?q=${encodeURIComponent(q.trim())}` : '/forms')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-5 py-3">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
          {trail.map((t, i) => (
            <span key={t} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-300" />}
              <span className={i === trail.length - 1 ? 'font-semibold text-navy-800' : 'text-slate-400'}>
                {t}
              </span>
            </span>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <form onSubmit={submitSearch} className="relative hidden md:block">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search forms…  ↵"
              className="h-8 w-56 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-500/15"
            />
          </form>

          <PersonaSwitcher />

          <Dropdown
            align="right"
            width="w-72"
            trigger={
              <button className="relative grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100">
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-white" />
              </button>
            }
            items={[
              { label: 'Vehicle Count changed: 3 → 8', icon: ScrollText, onClick: () => navigate('/audit') },
              { label: 'Form “Commercial Auto” published', icon: PlayCircle, onClick: () => navigate('/versions') },
              { label: 'Annual Revenue updated', icon: ScrollText, onClick: () => navigate('/audit') },
            ]}
          />

          <Dropdown
            align="right"
            trigger={
              <button className="flex items-center gap-2 rounded-lg border border-slate-200 py-1 pl-1 pr-2.5 hover:bg-slate-50">
                <span className="grid h-6 w-6 place-items-center rounded-md bg-navy-700 text-[10px] font-bold text-white">
                  AD
                </span>
                <span className="hidden text-xs font-medium text-slate-700 sm:block">Admin</span>
              </button>
            }
            items={[
              { label: 'Profile', icon: User, onClick: () => toast('Profile is a later-phase screen', 'info') },
              { label: 'Users & Roles', icon: Users, onClick: () => navigate('/users') },
              { label: 'Settings', icon: Settings, onClick: () => navigate('/settings') },
              { label: 'Sign out', icon: LogOut, danger: true, onClick: () => toast('Signed out (demo)', 'info') },
            ]}
          />
        </div>
      </div>
    </header>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const setRuntimeForm = useFormStore((s) => s.setRuntimeForm)
  // Entering any designer/builder screen means you're working on YOUR form —
  // drop any preview override so previewing your design shows your design.
  useEffect(() => {
    if (pathname === '/forms/new' || pathname.startsWith('/builder')) setRuntimeForm(null)
  }, [pathname, setRuntimeForm])

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-shell px-5 py-6 lg:px-8">
            <DesignerFlow />
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  )
}
