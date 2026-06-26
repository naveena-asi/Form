// Field-type palette catalog — powers the Field Builder (blueprint §5).
import {
  Type,
  Hash,
  DollarSign,
  Percent,
  Mail,
  Phone,
  Link as LinkIcon,
  Calendar,
  Clock,
  CalendarClock,
  MapPin,
  Map,
  Globe,
  Hash as HashIcon,
  List,
  CircleDot,
  CheckSquare,
  Table,
  Upload,
  Image,
  PenLine,
  AlignLeft,
  Tag,
  Minus,
  Shield,
  Layers,
  Receipt,
  EyeOff,
  Cog,
  Calculator,
  type LucideIcon,
} from 'lucide-react'
import type { FieldGroup, FieldType } from './types'

export interface FieldTypeMeta {
  type: FieldType
  label: string
  group: FieldGroup
  icon: LucideIcon
}

export const fieldTypeCatalog: FieldTypeMeta[] = [
  // Basic
  { type: 'text', label: 'Text', group: 'Basic', icon: Type },
  { type: 'number', label: 'Number', group: 'Basic', icon: Hash },
  { type: 'decimal', label: 'Decimal', group: 'Basic', icon: HashIcon },
  { type: 'currency', label: 'Currency', group: 'Basic', icon: DollarSign },
  { type: 'percentage', label: 'Percentage', group: 'Basic', icon: Percent },
  { type: 'email', label: 'Email', group: 'Basic', icon: Mail },
  { type: 'phone', label: 'Phone', group: 'Basic', icon: Phone },
  { type: 'url', label: 'URL', group: 'Basic', icon: LinkIcon },
  // Date / Time
  { type: 'date', label: 'Date', group: 'Date/Time', icon: Calendar },
  { type: 'datetime', label: 'Date & Time', group: 'Date/Time', icon: CalendarClock },
  { type: 'time', label: 'Time', group: 'Date/Time', icon: Clock },
  // Advanced
  { type: 'address', label: 'Address', group: 'Advanced', icon: MapPin },
  { type: 'state', label: 'State', group: 'Advanced', icon: Map },
  { type: 'country', label: 'Country', group: 'Advanced', icon: Globe },
  { type: 'zip', label: 'Zip Code', group: 'Advanced', icon: HashIcon },
  { type: 'select', label: 'Dropdown', group: 'Advanced', icon: List },
  { type: 'radio', label: 'Radio', group: 'Advanced', icon: CircleDot },
  { type: 'checkbox', label: 'Checkbox', group: 'Advanced', icon: CheckSquare },
  // Repeating
  { type: 'grid', label: 'Grid / Table', group: 'Repeating', icon: Table },
  // File
  { type: 'file', label: 'File Upload', group: 'File', icon: Upload },
  { type: 'image', label: 'Image Upload', group: 'File', icon: Image },
  // Special
  { type: 'signature', label: 'Signature', group: 'Special', icon: PenLine },
  { type: 'richtext', label: 'Rich Text', group: 'Special', icon: AlignLeft },
  { type: 'label', label: 'Label', group: 'Special', icon: Tag },
  { type: 'divider', label: 'Divider', group: 'Special', icon: Minus },
  // Insurance specific
  { type: 'limit', label: 'Limit', group: 'Insurance', icon: Shield },
  { type: 'deductible', label: 'Deductible', group: 'Insurance', icon: Shield },
  { type: 'coverage', label: 'Coverage Selector', group: 'Insurance', icon: Layers },
  { type: 'classcode', label: 'Class Code', group: 'Insurance', icon: Tag },
  { type: 'premium', label: 'Premium', group: 'Insurance', icon: Receipt },
  // System
  { type: 'hidden', label: 'Hidden Field', group: 'System', icon: EyeOff },
  { type: 'system', label: 'System Field', group: 'System', icon: Cog },
  { type: 'computed', label: 'Computed Field', group: 'System', icon: Calculator },
]

export const fieldGroups: FieldGroup[] = [
  'Basic',
  'Date/Time',
  'Advanced',
  'Repeating',
  'File',
  'Special',
  'Insurance',
  'System',
]

/** Common field properties listed in the blueprint — shown in the properties panel. */
export const commonFieldProperties = [
  'Label',
  'API Name',
  'Help Text',
  'Data Type, Length, Precision',
  'Default Value (Static / Formula / System)',
  'Required, Editable, Read-Only, Visible',
  'Masking (SSN, Tax ID, etc.)',
  'Validation (Min, Max, Regex, Unique, etc.)',
  'Display (Column width, Order, Tooltip, CSS Class)',
  'Data Source (Static, API, DB, Lookup, Parent-Child)',
]
