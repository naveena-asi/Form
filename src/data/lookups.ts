// Lookup tables — reference data for the Lookup Builder (blueprint §10).
import type { LookupTable } from './types'

export const lookupTables: LookupTable[] = [
  {
    id: 'lk-states',
    name: 'States & Zip Ranges',
    source: 'Static',
    description: 'US states with regional rating territory.',
    columns: ['Code', 'Name', 'Territory'],
    rows: [
      { Code: 'CA', Name: 'California', Territory: 'West' },
      { Code: 'TX', Name: 'Texas', Territory: 'South' },
      { Code: 'NY', Name: 'New York', Territory: 'Northeast' },
      { Code: 'FL', Name: 'Florida', Territory: 'Southeast' },
      { Code: 'IL', Name: 'Illinois', Territory: 'Midwest' },
    ],
  },
  {
    id: 'lk-classcodes',
    name: 'Class Codes',
    source: 'Database',
    description: 'Industry class codes mapped to base rate factors.',
    columns: ['Code', 'Description', 'BaseFactor'],
    rows: [
      { Code: '7219', Description: 'Trucking — Long Haul', BaseFactor: '1.45' },
      { Code: '7218', Description: 'Trucking — Local', BaseFactor: '1.20' },
      { Code: '5403', Description: 'Carpentry / Construction', BaseFactor: '1.30' },
      { Code: '8810', Description: 'Clerical / Office', BaseFactor: '0.85' },
      { Code: '8742', Description: 'Sales / Outside', BaseFactor: '0.95' },
    ],
  },
  {
    id: 'lk-makes',
    name: 'Vehicle Makes',
    source: 'CSV',
    description: 'Common commercial vehicle makes.',
    columns: ['Make', 'Category'],
    rows: [
      { Make: 'Ford', Category: 'Light/Medium' },
      { Make: 'Freightliner', Category: 'Heavy' },
      { Make: 'Peterbilt', Category: 'Heavy' },
      { Make: 'Isuzu', Category: 'Light' },
      { Make: 'RAM', Category: 'Light' },
    ],
  },
  {
    id: 'lk-coverages',
    name: 'Coverage Limits',
    source: 'API',
    description: 'Available liability limit options by state.',
    columns: ['Limit', 'Label'],
    rows: [
      { Limit: '500000', Label: '$500K CSL' },
      { Limit: '1000000', Label: '$1M CSL' },
      { Limit: '2000000', Label: '$2M CSL' },
    ],
  },
]
