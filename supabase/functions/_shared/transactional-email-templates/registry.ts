import * as React from 'npm:react@18.3.1'
import { template as matchInterest } from './match-interest.tsx'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: any) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'match-interest': matchInterest,
}
