import { useState } from 'react'
import {
  FileText,
  Search,
  Filter,
  MoreVertical,
  Check,
  X,
  ArrowRight,
  User,
  ShieldAlert,
  Building2,
  Clock,
  ArrowLeft,
  FileDown,
  FileText as FileTextIcon
} from 'lucide-react'
import { PageHeader, Button, Badge, Card } from '@/components/ui'
import { Modal } from '@/components/ui/Modal'

// --- Mock Data ---
interface AppData {
  id: string
  broker: string
  insured: string
  product: string
  date: string
  premium: number
  status: 'Under Review' | 'Referred' | 'Bound' | 'Declined' | 'Quoted' | 'Info Requested'
}

const MOCK_APPLICATIONS: AppData[] = [
  { id: 'APP-100234', broker: 'Acme Brokerage (Sarah Jenkins)', insured: 'TechNova Solutions', product: 'General Liability - Technology', date: 'Oct 24, 2026', premium: 1250, status: 'Under Review' },
  { id: 'APP-100235', broker: 'First Choice Insure', insured: 'Main St Bakery', product: 'Business Owner\'s Policy (BOP)', date: 'Oct 23, 2026', premium: 840, status: 'Referred' },
  { id: 'APP-100236', broker: 'Acme Brokerage (Sarah Jenkins)', insured: 'Skyline Construction', product: 'Workers Compensation', date: 'Oct 22, 2026', premium: 3450, status: 'Bound' },
  { id: 'APP-100237', broker: 'Shield Group', insured: 'DataShield LLC', product: 'Cyber Liability', date: 'Oct 21, 2026', premium: 2100, status: 'Declined' },
  { id: 'APP-100238', broker: 'First Choice Insure', insured: 'City Plumbing', product: 'Commercial Auto', date: 'Oct 20, 2026', premium: 4200, status: 'Under Review' },
  { id: 'APP-100239', broker: 'Elite Brokers Inc.', insured: 'Green Earth Landscaping', product: 'General Liability - Contractors', date: 'Oct 19, 2026', premium: 1800, status: 'Quoted' },
  { id: 'APP-100240', broker: 'Shield Group', insured: 'Apex Logistics', product: 'Commercial Auto', date: 'Oct 18, 2026', premium: 8500, status: 'Info Requested' },
]

const UNDERWRITERS = [
  'John Smith (Senior UW)',
  'Alice Wong (Cyber Specialist)',
  'Marcus Johnson (Property)',
  'Emma Davis (Casualty)',
]

export default function Applications() {
  const [selectedApp, setSelectedApp] = useState<AppData | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Modals state
  const [actionModal, setActionModal] = useState<'accept' | 'reject' | 'refer' | 'requestInfo' | 'quote' | 'revise' | 'withdraw' | 'remind' | 'waive' | null>(null)
  
  // Action form state
  const [reason, setReason] = useState('')
  const [selectedUW, setSelectedUW] = useState(UNDERWRITERS[0])
  const [reqLossRuns, setReqLossRuns] = useState(false)
  const [reqFinancials, setReqFinancials] = useState(false)
  const [reqSafety, setReqSafety] = useState(false)
  const [quotePremiumAdj, setQuotePremiumAdj] = useState(0)

  const filteredApps = MOCK_APPLICATIONS.filter(app => 
    app.insured.toLowerCase().includes(searchQuery.toLowerCase()) || 
    app.broker.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleActionSubmit = () => {
    // In a real app, this would call an API to update the status
    alert(`Application ${actionModal}ed successfully!`)
    setActionModal(null)
    setReason('')
  }

  // --- Render Functions ---
  
  if (selectedApp) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedApp(null)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Applications
          </button>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900">Application {selectedApp.id}</h1>
              <Badge tone={
                selectedApp.status === 'Bound' ? 'green' : 
                selectedApp.status === 'Declined' ? 'red' : 
                selectedApp.status === 'Referred' ? 'amber' : 
                selectedApp.status === 'Quoted' ? 'purple' :
                selectedApp.status === 'Info Requested' ? 'pink' :
                'navy'
              }>
                {selectedApp.status}
              </Badge>
            </div>
            <p className="text-slate-500 font-medium">Submitted by <b className="text-slate-700">{selectedApp.broker}</b> on {selectedApp.date}</p>
          </div>

          <div className="flex gap-2">
            {selectedApp.status === 'Bound' ? (
              <>
                <Button variant="subtle" icon={FileTextIcon} className="text-brand-600 hover:text-brand-700 hover:bg-brand-50" onClick={() => alert('Downloading Policy Certificate...')}>
                  Policy Certificate
                </Button>
                <Button variant="primary" icon={FileDown} className="bg-indigo-600 hover:bg-indigo-700" onClick={() => alert('Downloading COI...')}>
                  Download COI
                </Button>
              </>
            ) : selectedApp.status === 'Declined' ? (
              <Badge tone="red" className="px-3 py-1.5 text-sm">Application Declined</Badge>
            ) : selectedApp.status === 'Quoted' ? (
              <>
                <Button variant="subtle" icon={X} onClick={() => setActionModal('withdraw')} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  Withdraw Quote
                </Button>
                <Button variant="primary" icon={FileTextIcon} className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setActionModal('revise')}>
                  Revise Quote
                </Button>
              </>
            ) : selectedApp.status === 'Info Requested' ? (
              <>
                <Button variant="subtle" onClick={() => setActionModal('waive')} className="text-slate-600 hover:text-slate-700 hover:bg-slate-50 border border-slate-200">
                  Waive Requirements
                </Button>
                <Button variant="primary" icon={Clock} className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setActionModal('remind')}>
                  Send Reminder
                </Button>
              </>
            ) : (
              <>
                <Button variant="subtle" icon={User} onClick={() => setActionModal('refer')} className="text-slate-600 hover:text-slate-700 hover:bg-slate-50 border border-slate-200">
                  Refer to UW
                </Button>
                <Button variant="subtle" onClick={() => setActionModal('requestInfo')} className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border border-amber-200">
                  Request Info
                </Button>
                <Button variant="subtle" icon={X} onClick={() => setActionModal('reject')} className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200">
                  Reject
                </Button>
                <Button variant="primary" icon={Check} onClick={() => setActionModal('quote')} className="bg-emerald-600 hover:bg-emerald-700">
                  Issue Quote
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-base font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">Applicant Details</h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Insured Name (DBA)</dt>
                  <dd className="text-sm font-medium text-slate-900 mt-1">{selectedApp.insured}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Business Entity</dt>
                  <dd className="text-sm font-medium text-slate-900 mt-1">LLC</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Industry / Class Code</dt>
                  <dd className="text-sm font-medium text-slate-900 mt-1">Professional Services (541511)</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Years in Business</dt>
                  <dd className="text-sm font-medium text-slate-900 mt-1">5 Years</dd>
                </div>
              </dl>
            </Card>

            <Card className="p-6">
              <h2 className="text-base font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">Form Answers</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-slate-600 mb-1">Has the applicant had any claims in the last 3 years?</div>
                  <div className="text-sm font-bold text-slate-900">No</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-1">Estimated Annual Revenue</div>
                  <div className="text-sm font-bold text-slate-900">$1,500,000</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-1">Number of Employees</div>
                  <div className="text-sm font-bold text-slate-900">12</div>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">Underwriting Summary</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-slate-500">Product</div>
                  <div className="text-sm font-bold text-slate-900 mt-1">{selectedApp.product}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500">Quoted Premium</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">${selectedApp.premium.toLocaleString()}<span className="text-sm text-slate-500 font-medium">/yr</span></div>
                </div>
                <div className="bg-blue-50 text-blue-700 p-3 rounded-lg flex items-start gap-2 border border-blue-100">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="text-xs font-medium">This application triggered a manual review due to high revenue limit.</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Action Modals */}
        <Modal open={actionModal === 'accept'} onClose={() => setActionModal(null)} title="Confirm Acceptance">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Are you sure you want to accept and bind this application for <b>{selectedApp.insured}</b>?</p>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="subtle" onClick={() => setActionModal(null)}>Cancel</Button>
              <Button variant="primary" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleActionSubmit}>Accept Application</Button>
            </div>
          </div>
        </Modal>

        <Modal open={actionModal === 'reject'} onClose={() => setActionModal(null)} title="Reject Application">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Please provide a reason for rejecting this application. This will be sent back to the broker.</p>
            <textarea 
              className="w-full h-24 p-3 text-sm rounded-lg border border-slate-300 shadow-sm focus:ring-red-500 focus:border-red-500" 
              placeholder="Enter rejection reason..."
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="subtle" onClick={() => setActionModal(null)}>Cancel</Button>
              <Button variant="primary" className="bg-red-600 hover:bg-red-700" onClick={handleActionSubmit}>Reject Application</Button>
            </div>
          </div>
        </Modal>

        <Modal open={actionModal === 'refer'} onClose={() => setActionModal(null)} title="Refer to Underwriter">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Underwriter</label>
              <select className="w-full p-2.5 text-sm rounded-lg border border-slate-300 shadow-sm" value={selectedUW} onChange={e => setSelectedUW(e.target.value)}>
                {UNDERWRITERS.map(uw => <option key={uw} value={uw}>{uw}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Referral Notes</label>
              <textarea 
                className="w-full h-24 p-3 text-sm rounded-lg border border-slate-300 shadow-sm focus:ring-amber-500 focus:border-amber-500" 
                placeholder="Explain why this requires senior review..."
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="subtle" onClick={() => setActionModal(null)}>Cancel</Button>
              <Button variant="primary" className="bg-amber-600 hover:bg-amber-700" onClick={handleActionSubmit}>Submit Referral</Button>
            </div>
          </div>
        </Modal>

        <Modal open={actionModal === 'requestInfo'} onClose={() => setActionModal(null)} title="Request Additional Info">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Select the documents required from the broker before underwriting can proceed.</p>
            
            <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600" checked={reqLossRuns} onChange={e => setReqLossRuns(e.target.checked)} />
                <span className="text-sm font-medium text-slate-800">5-Year Loss Runs</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600" checked={reqFinancials} onChange={e => setReqFinancials(e.target.checked)} />
                <span className="text-sm font-medium text-slate-800">Audited Financial Statements</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600" checked={reqSafety} onChange={e => setReqSafety(e.target.checked)} />
                <span className="text-sm font-medium text-slate-800">Employee Safety Manual</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Additional Notes</label>
              <textarea 
                className="w-full h-20 p-3 text-sm rounded-lg border border-slate-300 shadow-sm focus:ring-amber-500 focus:border-amber-500" 
                placeholder="Any specific instructions for the broker..."
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="subtle" onClick={() => setActionModal(null)}>Cancel</Button>
              <Button variant="primary" className="bg-amber-600 hover:bg-amber-700" onClick={handleActionSubmit}>Send Request</Button>
            </div>
          </div>
        </Modal>

        <Modal open={actionModal === 'quote'} onClose={() => setActionModal(null)} title="Issue Premium Quote">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Review the generated premium and apply any discretionary adjustments before sending the formal quote.</p>
            
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-sm font-semibold text-slate-700">System Premium</div>
              <div className="text-lg font-bold text-slate-900">${selectedApp.premium.toLocaleString()}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Discretionary Adjustment ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                <input 
                  type="number"
                  className="w-full p-2.5 pl-8 text-sm rounded-lg border border-slate-300 shadow-sm" 
                  value={quotePremiumAdj}
                  onChange={e => setQuotePremiumAdj(Number(e.target.value))}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Use negative values for credits, positive for debits.</p>
            </div>

            <div className="flex justify-between items-center p-4 bg-brand-50 rounded-lg border border-brand-200 mt-2">
              <div className="text-sm font-semibold text-brand-700">Final Quoted Premium</div>
              <div className="text-xl font-bold text-brand-900">${(selectedApp.premium + quotePremiumAdj).toLocaleString()}</div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="subtle" onClick={() => setActionModal(null)}>Cancel</Button>
              <Button variant="primary" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleActionSubmit}>Issue Quote</Button>
            </div>
          </div>
        </Modal>

        {/* Action Modals for Quoted / Info Requested states */}
        <Modal open={actionModal === 'withdraw'} onClose={() => setActionModal(null)} title="Withdraw Quote">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Are you sure you want to withdraw this quote? It will no longer be valid for binding.</p>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="subtle" onClick={() => setActionModal(null)}>Cancel</Button>
              <Button variant="primary" className="bg-red-600 hover:bg-red-700" onClick={handleActionSubmit}>Withdraw</Button>
            </div>
          </div>
        </Modal>
        
        <Modal open={actionModal === 'revise'} onClose={() => setActionModal(null)} title="Revise Quote">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">You are re-opening a quoted application. The current quote will be marked invalid.</p>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="subtle" onClick={() => setActionModal(null)}>Cancel</Button>
              <Button variant="primary" className="bg-indigo-600 hover:bg-indigo-700" onClick={handleActionSubmit}>Revise Quote</Button>
            </div>
          </div>
        </Modal>

        <Modal open={actionModal === 'waive'} onClose={() => setActionModal(null)} title="Waive Requirements">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Are you sure you want to waive the pending information requests? This will return the application to 'Under Review' status.</p>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="subtle" onClick={() => setActionModal(null)}>Cancel</Button>
              <Button variant="primary" className="bg-indigo-600 hover:bg-indigo-700" onClick={handleActionSubmit}>Waive Requirements</Button>
            </div>
          </div>
        </Modal>

        <Modal open={actionModal === 'remind'} onClose={() => setActionModal(null)} title="Send Reminder">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">An email reminder will be sent to <b>{selectedApp.broker}</b> regarding the pending subjectivities.</p>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="subtle" onClick={() => setActionModal(null)}>Cancel</Button>
              <Button variant="primary" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleActionSubmit}>Send Reminder</Button>
            </div>
          </div>
        </Modal>

      </div>
    )
  }

  // --- Main List View ---

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Applications"
        subtitle="Review, refer, and manage incoming policies from your broker network."
        actions={
          <div className="flex gap-2">
            <Button variant="subtle" icon={Filter}>Filter</Button>
          </div>
        }
      />

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, Insured, or Broker..."
              className="h-10 w-full rounded-lg border border-slate-300 pl-10 pr-4 text-sm shadow-sm focus:border-brand-500 focus:ring-brand-500"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">App ID</th>
                <th className="px-6 py-4">Insured</th>
                <th className="px-6 py-4">Broker</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Premium</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApps.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/60 transition group">
                  <td className="px-6 py-4 font-medium text-slate-900">{app.id}</td>
                  <td className="px-6 py-4 text-slate-700 font-semibold">{app.insured}</td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      {app.broker}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{app.product}</td>
                  <td className="px-6 py-4 text-slate-900 font-bold">${app.premium.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <Badge tone={
                      app.status === 'Bound' ? 'green' : 
                      app.status === 'Declined' ? 'red' : 
                      app.status === 'Referred' ? 'amber' : 
                      app.status === 'Quoted' ? 'purple' :
                      app.status === 'Info Requested' ? 'pink' :
                      'navy'
                    }>
                      {app.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="subtle" size="sm" onClick={() => setSelectedApp(app)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredApps.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                    No applications found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
