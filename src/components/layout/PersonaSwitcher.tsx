import { useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, UserRound, ChevronDown, Briefcase } from 'lucide-react'
import { Dropdown } from '@/components/ui/Dropdown'

/** Switches between the Admin Console, Customer Portal, and Buyer Portal personas. */
export function PersonaSwitcher() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isCustomer = pathname.startsWith('/portal') || pathname === '/apply'
  const isBuyer = pathname.startsWith('/buyer')

  let current = { label: 'Admin', icon: LayoutDashboard }
  if (isCustomer) {
    current = { label: 'Customer', icon: UserRound }
  } else if (isBuyer) {
    current = { label: 'Buyer', icon: Briefcase }
  }

  return (
    <Dropdown
      align="right"
      width="w-52"
      trigger={
        <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white py-1.5 pl-2.5 pr-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
          <current.icon className="h-3.5 w-3.5 text-navy-600" />
          <span>
            Viewing as <span className="font-semibold">{current.label}</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </button>
      }
      items={[
        {
          label: 'Admin Console',
          icon: LayoutDashboard,
          onClick: () => navigate('/'),
        },
        {
          label: 'Customer Portal',
          icon: UserRound,
          onClick: () => navigate('/portal'),
        },
        {
          label: 'Buyer Portal',
          icon: Briefcase,
          onClick: () => navigate('/buyer'),
        },
      ]}
    />
  )
}

