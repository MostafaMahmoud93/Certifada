// ---- auth ----
export interface TokenModel {
  token: string;
  expiration: string;
  userId?: string;
  userName?: string;
  email?: string;
  isAdmin?: boolean;
  userActions: string[];
}
export interface ServiceResponse<T> {
  data: T;
  message: string;
  success: boolean;
}
export interface UserDto {
  id: string;
  email: string;
  fullName: string;
}

// ---- templates ----
export interface TemplateListItem {
  id: string;
  name: string;
  description?: string | null;
  width: number;
  height: number;
  placeholdersJson: string;
  thumbnailDataUrl?: string | null;
  status?: string;
  createdAt: string;
  updatedAt: string;
}
export interface TemplateDetail extends TemplateListItem {
  canvasJson: string;
}
export interface SaveTemplateRequest {
  name: string;
  description?: string | null;
  width: number;
  height: number;
  canvasJson: string;
  placeholdersJson: string;
  thumbnailDataUrl?: string | null;
}

// ---- credentials ----
export interface GeneratedCertificate {
  id: string;
  templateId: string;
  recipientName: string;
  dataJson: string;
  format: string;
  fileDataUrl?: string | null;
  batchId?: string | null;
  createdAt: string;
}
export interface BatchItem {
  recipientName: string;
  dataJson: string;
  fileDataUrl?: string | null;
}
export interface SaveCertificateRequest {
  templateId: string;
  recipientName: string;
  dataJson: string;
  format: string;
  fileDataUrl?: string | null;
}
export interface SaveBatchRequest {
  templateId: string;
  format: string;
  items: BatchItem[];
}
export interface BatchResult {
  batchId: string;
  count: number;
}
export interface QuotaInfo {
  created: number;
  limit: number;
}
