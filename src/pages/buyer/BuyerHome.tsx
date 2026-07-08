import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, ShieldCheck, Check, ArrowRight, X, ChevronDown, List as ListIcon, Grid as GridIcon,
  FileSearch, Star, Package, Building2, Umbrella, Laptop, Briefcase, Car, HardHat, UserCircle, ArrowLeft, ChevronLeft
} from 'lucide-react'
import { Card, Badge, Button } from '@/components/ui'
import { Modal } from '@/components/ui/Modal'
import { products, type Product } from '@/data/products'
import { cn } from '@/lib/cn'

const ALL_PRODUCT_TYPES = [
  'General Liability',
  'Commercial Auto',
  'Workers Compensation',
  'Professional Liability',
  'Cyber Liability',
  'Commercial Property',
  "Business Owner's Policy (BOP)",
  'Umbrella / Excess Liability',
  'Employment Practices Liability',
  'Commercial Crime',
  'Directors & Officers (D&O)',
]

const POPULAR_SEARCHES = ['General Liability', 'Commercial Auto', 'Workers Comp', 'Cyber Liability', 'Professional Liability']

const PRODUCT_CATEGORIES = [
  { id: 'gl', name: 'General Liability', icon: Briefcase, count: 18 },
  { id: 'ca', name: 'Commercial Auto', icon: Car, count: 12 },
  { id: 'wc', name: 'Workers Comp', icon: HardHat, count: 15 },
  { id: 'pl', name: 'Professional Liability', icon: UserCircle, count: 10 },
  { id: 'cy', name: 'Cyber Liability', icon: Laptop, count: 9 },
  { id: 'cp', name: 'Commercial Property', icon: Building2, count: 14 },
  { id: 'bop', name: 'BOP', icon: Package, count: 8 },
  { id: 'ul', name: 'Umbrella Liability', icon: Umbrella, count: 6 },
]

export default function BuyerHome() {
  const navigate = useNavigate()

  // -- State --
  const [query, setQuery] = useState('')
  const [searchTriggered, setSearchTriggered] = useState(false)
  const [activeSearchTerm, setActiveSearchTerm] = useState('')
  
  // Filters
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set())
  const [coverageNeeds, setCoverageNeeds] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [stateFilter] = useState('Texas (TX)')

  // View
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [sortBy, setSortBy] = useState('Relevance')
  const [selectedCategory, setSelectedCategory] = useState<Product | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // -- Handlers --
  const handleSearch = (q: string) => {
    if (!q.trim()) return
    setQuery(q)
    setActiveSearchTerm(q)
    setSearchTriggered(true)
    if (selectedTypes.size === 0) {
      // Auto-select type based on popular searches for realism
      if (ALL_PRODUCT_TYPES.includes(q)) setSelectedTypes(new Set([q]))
    }
  }

  const clearSearch = () => {
    setQuery('')
    setActiveSearchTerm('')
    setSearchTriggered(false)
    setSelectedTypes(new Set())
    setSelectedCategory(null)
  }

  const toggleType = (type: string) => {
    setSelectedTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  const selectAllTypes = () => setSelectedTypes(new Set(ALL_PRODUCT_TYPES))
  const clearAllTypes = () => setSelectedTypes(new Set())

  // -- Derived Data --
  const filteredResults = useMemo(() => {
    if (activeSearchTerm.toLowerCase().includes('heavy equipment')) return []
    
    let base = [...products]
    
    // Determine the primary product type being searched or filtered
    const primaryType = Array.from(selectedTypes)[0] || 
                        (activeSearchTerm && ALL_PRODUCT_TYPES.find(t => t.toLowerCase().includes(activeSearchTerm.toLowerCase()))) || 
                        'General Liability'

    // Generate 18 distinct mock products for the selected category
    const generatedMocks: Product[] = []
    
    // Use the first base product as a template for coverages
    const template = base.find(p => p.name.includes('Liability')) || base[0]

    const variants = [
      '', ' - Premises Operations', ' - Contractors', ' - Retail', ' - Consultants', 
      ' - Technology', ' - Healthcare', ' - Real Estate', ' - Hospitality', ' - Manufacturing',
      ' - Small Business', ' - Enterprise', ' - E-Commerce', ' - Education', ' - Logistics',
      ' - Financial Services', ' - Non-Profit', ' - Event Special'
    ]

    for (let i = 0; i < 18; i++) {
      generatedMocks.push({
        ...template,
        id: `mock-${primaryType.replace(/\s+/g, '-').toLowerCase()}-${i}`,
        baseProductId: template.id,
        name: `${primaryType}${variants[i] || ` Variant ${i}`}`,
        eligibility: `Comprehensive coverage tailored for ${variants[i] ? variants[i].replace(' - ', '').toLowerCase() : 'various'} businesses requiring ${primaryType.toLowerCase()} protection.`,
        baseRate: 400 + (i * 50) + (Math.floor(Math.random() * 100)),
        carrierId: `car-${i}`,
      })
    }
    
    return generatedMocks
  }, [activeSearchTerm, selectedTypes])

  // Generate distinct carrier mocks when a category is selected
  const carrierProducts = useMemo(() => {
    if (!selectedCategory) return []
    const carriers = [
      'Travelers', 'The Hartford', 'Chubb', 'Liberty Mutual', 'Hiscox',
      'Next Insurance', 'Nationwide', 'CNA', 'AmTrust', 'Berkshire Hathaway',
      'Markel', 'State Farm', 'Allstate', 'Progressive', 'Zurich'
    ]
    const numCarriers = (parseInt(selectedCategory.id.split('-').pop() || '0') % 2 === 0) ? 18 : 12
    
    return Array.from({ length: numCarriers }).map((_, i) => ({
      ...selectedCategory,
      id: `${selectedCategory.id}-car-${i}`,
      baseProductId: (selectedCategory as any).baseProductId || selectedCategory.id,
      carrierName: carriers[i % carriers.length],
      baseRate: selectedCategory.baseRate + (Math.floor(Math.random() * 200) - 100),
    }))
  }, [selectedCategory])

  const recommendations = [
    { name: 'General Liability Insurance', carriers: 18, rate: 500 },
    { name: 'Commercial Property Insurance', carriers: 16, rate: 650 },
    { name: "Business Owner's Policy (BOP)", carriers: 15, rate: 1100 },
    { name: 'Commercial Auto Insurance', carriers: 12, rate: 700 },
  ]

  const hasNoResults = searchTriggered && filteredResults.length === 0

  return (
    <div className="min-h-full pb-10 max-w-6xl mx-auto">
      
      {/* Universal Search Bar (Step 1) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-slate-900">
            {searchTriggered ? 'Search Results' : 'Find Insurance Products'}
          </h1>
          {searchTriggered && (
            <Button variant="subtle" icon={ArrowLeft} onClick={clearSearch}>
              Back to Home
            </Button>
          )}
        </div>
        
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="input h-14 w-full pl-12 pr-4 text-[16px] rounded-xl shadow-sm border-slate-200"
              placeholder="Search insurance products, e.g., General Liability, Commercial Auto..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="primary" className="h-14 px-8 rounded-xl text-[15px] bg-indigo-600 hover:bg-indigo-700" onClick={() => handleSearch(query)}>
              Search
            </Button>
          </div>
        </div>

        {/* Popular Searches (only show on home screen) */}
        {!searchTriggered && (
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold text-slate-500">Popular:</span>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SEARCHES.map(p => (
                <button key={p} onClick={() => handleSearch(p)} className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm">
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Conditional Screens based on search state */}
      {!searchTriggered ? (
        /* SCREEN A: LANDING (Steps 5 & 6) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Categories (Step 5) */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Browse by Product Category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {PRODUCT_CATEGORIES.map(cat => (
                <button 
                  key={cat.id} 
                  onClick={() => { clearAllTypes(); toggleType(cat.name); handleSearch(cat.name); }}
                  className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition"
                >
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
                    <cat.icon className="h-7 w-7" strokeWidth={1.5} />
                  </span>
                  <div className="text-center">
                    <div className="text-[14px] font-bold text-slate-800 leading-tight">{cat.name}</div>
                    <div className="text-[12px] font-medium text-slate-500 mt-1">{cat.count} Products</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recommendations (Step 6) */}
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-4">Recommendations for You</h2>
            <Card className="flex flex-col overflow-hidden border-slate-200 shadow-sm rounded-2xl">
              <div className="divide-y divide-slate-100">
                {recommendations.map((rec, i) => (
                  <div key={i} className="flex items-center justify-between p-5 hover:bg-slate-50 transition cursor-pointer" onClick={() => handleSearch(rec.name)}>
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-50 text-brand-600 ring-1 ring-brand-200">
                        <Check className="h-4 w-4" />
                      </span>
                      <span className="text-[14px] font-semibold text-slate-800">{rec.name}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="bg-slate-50 py-3 text-sm font-semibold text-indigo-600 hover:bg-slate-100 transition border-t border-slate-100">
                View All Recommendations
              </button>
            </Card>
          </div>
        </div>

      ) : (
        /* SCREENS B & C: SEARCH RESULTS (Steps 2, 3, 4) */
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[280px_1fr]">
          
          {/* Left Column: Filters (Step 2) */}
          <Card className="flex flex-col rounded-2xl overflow-hidden shadow-sm border-slate-200 p-0 sticky top-24">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-4 flex items-center justify-between">
              <div className="font-bold text-slate-800">Filters & Categories</div>
              <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-800" onClick={clearAllTypes}>Clear All</button>
            </div>
            
            <div className="p-5 space-y-6">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">Product Type</span>
                  <button className="text-[11px] font-semibold text-indigo-600" onClick={selectAllTypes}>Select All</button>
                </div>
                <div className="space-y-3">
                  {ALL_PRODUCT_TYPES.map(type => (
                    <label key={type} className="flex items-start gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="form-checkbox mt-0.5 rounded border-slate-300 text-indigo-600 shadow-sm focus:ring-indigo-500 transition"
                        checked={selectedTypes.has(type)}
                        onChange={() => toggleType(type)}
                      />
                      <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition leading-tight">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-5 pt-5 border-t border-slate-100">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Coverage Needs</label>
                  <select className="select py-2 px-3 text-sm" value={coverageNeeds} onChange={e => setCoverageNeeds(e.target.value)}>
                    <option value="">Select</option>
                    <option value="liability">Liability Only</option>
                    <option value="property">Property Included</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">State</label>
                  <div className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white p-1.5 shadow-sm">
                    <span className="inline-flex items-center gap-1.5 rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {stateFilter}
                      <button className="text-slate-400 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <Button variant="primary" className="w-full bg-indigo-600 hover:bg-indigo-700 py-2.5">
                  Apply Filters
                </Button>
              </div>
            </div>
          </Card>

          {/* Center Column: Results (Step 3) or No Results (Step 4) */}
          <div className="flex flex-col gap-4">
            
            {hasNoResults ? (
              /* SCREEN C: NO RESULTS (Step 4) */
              <Card className="flex flex-col items-center justify-center p-12 text-center rounded-2xl shadow-sm border-slate-200">
                <span className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-slate-400">
                  <FileSearch className="h-8 w-8" />
                </span>
                <h3 className="text-xl font-bold text-slate-800">No results found for "{activeSearchTerm}"</h3>
                <p className="mt-2 text-sm text-slate-500 max-w-sm">Try adjusting your search criteria, checking your spelling, or removing filters.</p>
                
                <div className="mt-8 text-left bg-slate-50 rounded-xl p-5 border border-slate-200 w-full max-w-md">
                  <span className="font-bold text-slate-800 mb-3 block">Suggestions:</span>
                  <ul className="list-disc pl-5 space-y-2 text-sm font-medium text-slate-600">
                    <li>Check spelling or try broader keywords</li>
                    <li>Browse all product categories</li>
                    <li>Remove some active filters</li>
                  </ul>
                </div>
                
                <Button variant="primary" className="mt-6 bg-indigo-600" onClick={clearSearch}>
                  View All Categories
                </Button>
              </Card>
            ) : selectedCategory ? (
              /* SCREEN 2.5: CARRIER RESULTS FOR CATEGORY */
              <div className="flex flex-col gap-4">
                <Button variant="subtle" icon={ChevronLeft} onClick={() => setSelectedCategory(null)} className="self-start text-slate-500 hover:text-slate-800 -ml-2">
                  Back to Categories
                </Button>
                <Card className="flex flex-col rounded-2xl overflow-hidden shadow-sm border-slate-200">
                  <div className="border-b border-slate-100 bg-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="text-sm font-medium text-slate-600">
                      Showing <b className="text-slate-900">{carrierProducts.length}</b> carrier options for <b className="text-slate-900">{selectedCategory.name}</b>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500 font-medium">Sort by:</span>
                        <select className="select py-1.5 pl-2 pr-8 text-sm font-semibold border-slate-200 shadow-sm" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                          <option>Premium: Low to High</option>
                          <option>A.M. Best Rating</option>
                          <option>Carrier Name: A to Z</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 bg-white">
                    {carrierProducts.map((product, idx) => (
                      <div key={product.id} className="flex flex-col sm:flex-row gap-5 p-6 hover:bg-slate-50 transition group">
                        <div className="flex flex-1 items-start gap-4">
                          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-slate-200">
                            <Building2 className="h-6 w-6" />
                          </span>
                          <div>
                            <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-700 transition">{(product as any).carrierName}</h4>
                            <p className="mt-1 text-sm text-slate-500 line-clamp-2 max-w-xl leading-relaxed">{product.name}</p>
                            <div className="mt-3 flex items-center gap-2">
                              <Badge tone="gray" className="bg-slate-100 text-slate-600 text-xs font-bold ring-0 px-2.5 py-0.5">A.M. Best: A+</Badge>
                              {idx === 0 && <Badge tone="green" className="bg-brand-50 text-brand-700 text-xs font-bold ring-0 px-2.5 py-0.5">Lowest Rate</Badge>}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center sm:items-end justify-between sm:flex-col sm:border-l sm:border-slate-100 sm:pl-6 sm:text-right min-w-[150px]">
                          <div>
                            <div className="text-xs font-medium text-slate-500 mt-1">Estimated Premium</div>
                            <div className="text-lg font-bold text-slate-900">${product.baseRate} <span className="text-sm text-slate-500 font-medium">/ yr</span></div>
                          </div>
                          <Button variant="subtle" className="mt-4 font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-slate-200" onClick={() => setSelectedProduct(product as Product)}>
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            ) : (
              /* SCREEN B: SEARCH RESULTS (Step 3) */
              <Card className="flex flex-col rounded-2xl overflow-hidden shadow-sm border-slate-200">
                {/* Header info */}
                <div className="border-b border-slate-100 bg-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="text-sm font-medium text-slate-600">
                    Showing <b className="text-slate-900">{filteredResults.length}</b> results for <b className="text-slate-900">"{activeSearchTerm || Array.from(selectedTypes)[0] || 'General Liability'}"</b> in Texas
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-500 font-medium">Sort by:</span>
                      <select className="select py-1.5 pl-2 pr-8 text-sm font-semibold border-slate-200 shadow-sm" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option>Relevance</option>
                        <option>Premium: Low to High</option>
                        <option>Name: A to Z</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Results List */}
                <div className="divide-y divide-slate-100 bg-white">
                  {filteredResults.map((product, idx) => (
                    <div key={product.id} className="flex flex-col sm:flex-row gap-5 p-6 hover:bg-slate-50 transition group">
                      <div className="flex flex-1 items-start gap-4">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-200/50">
                          <ShieldCheck className="h-6 w-6" />
                        </span>
                        <div>
                          <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-700 transition">{product.name}</h4>
                          <p className="mt-1 text-sm text-slate-500 line-clamp-2 max-w-xl leading-relaxed">{product.eligibility}</p>
                          <div className="mt-3 flex items-center gap-2">
                            {idx === 0 && <Badge tone="green" className="bg-brand-50 text-brand-700 text-xs font-bold ring-0 px-2.5 py-0.5">Best Seller</Badge>}
                            {idx === 0 && <Badge tone="amber" className="bg-amber-50 text-amber-700 text-xs font-bold ring-0 px-2.5 py-0.5">Most Popular</Badge>}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center sm:items-end justify-between sm:flex-col sm:border-l sm:border-slate-100 sm:pl-6 sm:text-right min-w-[150px]">
                        <div>
                          <div className="text-sm font-bold text-slate-800">{idx % 2 === 0 ? '18' : '12'} Carriers</div>
                          <div className="text-xs font-medium text-slate-500 mt-1">Starting at <span className="font-bold text-slate-900">${product.baseRate}</span> / year</div>
                        </div>
                        <Button variant="subtle" className="mt-4 font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-slate-200" onClick={() => setSelectedCategory(product as Product)}>
                          View Carriers
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* View Details Modal */}
      <Modal
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title={
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-200/50">
              <Package className="h-5 w-5" />
            </span>
            <div>
              <div className="text-base font-bold text-slate-900">{selectedProduct?.name}</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Carrier: {(selectedProduct as any)?.carrierName || 'Various'}</div>
            </div>
          </div>
        }
        footer={
          <>
            <Button variant="subtle" onClick={() => setSelectedProduct(null)}>
              Cancel
            </Button>
            <Button variant="primary" iconRight={ArrowRight} className="bg-indigo-600 hover:bg-indigo-700" onClick={() => navigate(`/buyer/apply/${(selectedProduct as any)?.baseProductId || selectedProduct?.id}`)}>
              Apply Now
            </Button>
          </>
        }
      >
        {selectedProduct && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-100">
              <div>
                <div className="text-xs font-semibold text-slate-500">Base Rate</div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">${selectedProduct.baseRate.toLocaleString()} <span className="text-sm font-medium text-slate-500">/ yr</span></div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500">Eligible States</div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {selectedProduct.states.map(s => (
                    <span key={s} className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200">{s}</span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-3">Available Coverages</h4>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                      <th className="px-4 py-2.5">Coverage</th>
                      <th className="px-4 py-2.5">Limits</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedProduct.coverages.map(c => (
                      <tr key={c.name} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                          {c.name}
                          {c.required && <span className="ml-2 inline-flex items-center rounded-full bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700">REQUIRED</span>}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-slate-500">{c.limits.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
