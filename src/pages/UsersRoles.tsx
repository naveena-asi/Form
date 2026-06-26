import { useState } from 'react'
import { Users, UserPlus, Shield, Trash2 } from 'lucide-react'
import { Card, CardHeader, PageHeader, Badge, Button, Modal, ConfirmDialog } from '@/components/ui'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { toast } from '@/store/useToast'
import { uid } from '@/lib/uid'

interface UserRow {
  id: string
  name: string
  email: string
  role: 'Admin' | 'Designer' | 'Underwriter' | 'Viewer'
  status: 'Active' | 'Invited'
}

const roleTone: Record<string, 'navy' | 'green' | 'amber' | 'gray'> = {
  Admin: 'navy',
  Designer: 'green',
  Underwriter: 'amber',
  Viewer: 'gray',
}

const seed: UserRow[] = [
  { id: 'u1', name: 'Admin User', email: 'admin@quantana.com.au', role: 'Admin', status: 'Active' },
  { id: 'u2', name: 'John Doe', email: 'john.d@quantana.com.au', role: 'Designer', status: 'Active' },
  { id: 'u3', name: 'Sara Kim', email: 'sara.k@quantana.com.au', role: 'Underwriter', status: 'Active' },
  { id: 'u4', name: 'Priya Nair', email: 'priya.n@quantana.com.au', role: 'Viewer', status: 'Invited' },
]

const permissions = [
  { role: 'Admin', perms: 'Full access — forms, rules, users, settings' },
  { role: 'Designer', perms: 'Build & edit forms, fields, logic, rules' },
  { role: 'Underwriter', perms: 'Review submissions, validations, rating' },
  { role: 'Viewer', perms: 'Read-only access to forms & reports' },
]

export default function UsersRoles() {
  const [users, setUsers] = useState<UserRow[]>(seed)
  const [invite, setInvite] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const columns: Column<UserRow>[] = [
    {
      key: 'name',
      header: 'User',
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-navy-700 text-[11px] font-bold text-white">
            {u.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
          </span>
          <div>
            <div className="font-medium text-slate-900">{u.name}</div>
            <div className="text-xs text-slate-400">{u.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u) => (
        <select
          className="select w-36 !py-1.5 text-xs"
          value={u.role}
          onChange={(e) => setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, role: e.target.value as UserRow['role'] } : x)))}
        >
          {['Admin', 'Designer', 'Underwriter', 'Viewer'].map((r) => <option key={r}>{r}</option>)}
        </select>
      ),
    },
    { key: 'status', header: 'Status', render: (u) => <Badge tone={u.status === 'Active' ? 'green' : 'amber'}>{u.status}</Badge> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (u) => (
        <button onClick={() => setConfirmDelete(u.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500">
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Platform"
        title="Users & Roles"
        subtitle="Manage who can design, review and administer forms."
        actions={
          <Button variant="primary" icon={UserPlus} onClick={() => setInvite(true)}>
            Invite User
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <Card className="overflow-hidden">
          <CardHeader title="Team" subtitle={`${users.length} members`} icon={Users} />
          <DataTable columns={columns} rows={users} />
        </Card>

        <Card className="self-start">
          <CardHeader title="Roles & Permissions" icon={Shield} />
          <div className="space-y-3 p-5">
            {permissions.map((p) => (
              <div key={p.role}>
                <Badge tone={roleTone[p.role]}>{p.role}</Badge>
                <p className="mt-1 text-xs text-slate-500">{p.perms}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {invite && <InviteModal onClose={() => setInvite(false)} onInvite={(u) => { setUsers((l) => [...l, u]); setInvite(false); toast(`Invitation sent to ${u.email}`) }} />}

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Remove user"
        message="Revoke this user's access to the platform?"
        confirmLabel="Remove"
        onConfirm={() => {
          if (confirmDelete) {
            setUsers((l) => l.filter((x) => x.id !== confirmDelete))
            toast('User removed', 'info')
          }
        }}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  )
}

function InviteModal({ onClose, onInvite }: { onClose: () => void; onInvite: (u: UserRow) => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRow['role']>('Designer')

  return (
    <Modal
      open
      onClose={onClose}
      title="Invite User"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!email) return toast('Enter an email', 'error')
              onInvite({ id: uid('u'), name: name || email.split('@')[0], email, role, status: 'Invited' })
            }}
          >
            Send Invite
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Full Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com" />
        </div>
        <div>
          <label className="label">Role</label>
          <select className="select" value={role} onChange={(e) => setRole(e.target.value as UserRow['role'])}>
            {['Admin', 'Designer', 'Underwriter', 'Viewer'].map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
      </div>
    </Modal>
  )
}
