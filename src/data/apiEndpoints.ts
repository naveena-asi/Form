// API Layer reference — endpoint catalog (blueprint §16).
export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  description: string
}

export const apiEndpoints: ApiEndpoint[] = [
  { method: 'GET', path: '/form/{id}', description: 'Get Form Definition' },
  { method: 'POST', path: '/form/{id}/save', description: 'Save Answers (draft)' },
  { method: 'POST', path: '/form/{id}/submit', description: 'Submit Form' },
  { method: 'POST', path: '/form/{id}/validate', description: 'Validate Form' },
  { method: 'POST', path: '/form/{id}/calculate', description: 'Calculate Premium' },
  { method: 'GET', path: '/rules', description: 'Get Rules' },
  { method: 'POST', path: '/files/upload', description: 'Upload Files' },
  { method: 'POST', path: '/documents/pdf', description: 'Generate PDF' },
  { method: 'GET', path: '/lookups/{table}', description: 'Get Lookup Data' },
  { method: 'GET', path: '/form/{id}/versions', description: 'List Versions' },
]
