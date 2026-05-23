// 10 xil rasmiy hujjat turi (Translation Portal'dagi "Document Domain" bilan mos)
export const DOCUMENT_TYPES = [
  { key: 'legal', label: 'Yuridik', labelEn: 'Legal', icon: 'gavel' },
  { key: 'financial', label: 'Moliyaviy', labelEn: 'Financial', icon: 'account_balance' },
  { key: 'medical', label: 'Tibbiy', labelEn: 'Medical', icon: 'medical_services' },
  { key: 'technical', label: 'Texnik', labelEn: 'Technical', icon: 'precision_manufacturing' },
  { key: 'marketing', label: 'Marketing', labelEn: 'Marketing', icon: 'campaign' },
  { key: 'scientific', label: 'Ilmiy', labelEn: 'Scientific', icon: 'science' },
  { key: 'academic', label: 'Akademik', labelEn: 'Academic', icon: 'history_edu' },
  { key: 'regulatory', label: 'Normativ', labelEn: 'Regulatory', icon: 'policy' },
  { key: 'it', label: 'IT va Dasturiy ta\'minot', labelEn: 'IT & Software', icon: 'code' },
  { key: 'general', label: 'Umumiy', labelEn: 'General', icon: 'description' },
];

export const DOCUMENT_TYPE_KEYS = DOCUMENT_TYPES.map((t) => t.key);

import { REGISTRY } from './templates/registry.js';

export function documentTypeLabel(key) {
  if (REGISTRY[key]) return REGISTRY[key].label;
  const t = DOCUMENT_TYPES.find((d) => d.key === key);
  return t ? t.label : key;
}

// Google Document Translation qo'llab-quvvatlaydigan formatlar
export const ALLOWED_EXTENSIONS = ['.docx', '.pdf', '.xlsx', '.pptx', '.txt'];

export const MIME_BY_EXT = {
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
};

export const STATUS = {
  PENDING: 'pending', // navbatda
  PROCESSING: 'processing', // tarjima qilinmoqda
  DONE: 'done', // tayyor
  ERROR: 'error', // xatolik
};
