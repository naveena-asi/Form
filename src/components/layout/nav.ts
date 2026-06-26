import {
  LayoutDashboard,
  Files,
  FilePlus2,
  Layers,
  Boxes,
  GitBranch,
  Calculator,
  ShieldCheck,
  Table2,
  Database,
  Workflow,
  PlayCircle,
  ClipboardCheck,
  FileOutput,
  History,
  ScrollText,
  Plug,
  Settings,
  Users,
  Wand2,
  Building2,
  Package,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    title: 'Workspace',
    items: [
      { label: 'Dashboard', to: '/', icon: LayoutDashboard, end: true },
      { label: 'Form Library', to: '/forms', icon: Files },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { label: 'Carriers', to: '/carriers', icon: Building2 },
      { label: 'Products', to: '/products', icon: Package },
      { label: 'Guardrails', to: '/guardrails', icon: ShieldAlert },
    ],
  },
  {
    title: 'Form Designer',
    items: [
      { label: 'AI Generate', to: '/ai', icon: Wand2 },
      { label: 'Create Form', to: '/forms/new', icon: FilePlus2 },
      { label: 'Section Builder', to: '/builder/sections', icon: Layers },
      { label: 'Field Builder', to: '/builder/fields', icon: Boxes },
      { label: 'Conditional Logic', to: '/builder/logic', icon: GitBranch },
      { label: 'Formula Builder', to: '/builder/formula', icon: Calculator },
      { label: 'Validation Engine', to: '/builder/validation', icon: ShieldCheck },
      { label: 'Repeating Grid', to: '/builder/grid', icon: Table2 },
      { label: 'Lookup Tables', to: '/builder/lookup', icon: Database },
      { label: 'Rule / Rating', to: '/builder/rules', icon: Workflow },
      { label: 'Workflow & Nav', to: '/builder/workflow', icon: Workflow },
    ],
  },
  {
    title: 'Runtime',
    items: [
      { label: 'Preview (Live)', to: '/preview', icon: PlayCircle },
      { label: 'Review & Submit', to: '/review', icon: ClipboardCheck },
      { label: 'Outputs', to: '/outputs', icon: FileOutput },
    ],
  },
  {
    title: 'Platform',
    items: [
      { label: 'Versioning', to: '/versions', icon: History },
      { label: 'Audit Log', to: '/audit', icon: ScrollText },
      { label: 'API Layer', to: '/api', icon: Plug },
      { label: 'Users & Roles', to: '/users', icon: Users },
      { label: 'Settings', to: '/settings', icon: Settings },
    ],
  },
]

/** Resolve the breadcrumb trail (group › screen) for a given route. */
export function trailFor(pathname: string): string[] {
  for (const group of navGroups) {
    for (const item of group.items) {
      if (item.to === pathname) return [group.title, item.label]
    }
  }
  return ['Workspace']
}
