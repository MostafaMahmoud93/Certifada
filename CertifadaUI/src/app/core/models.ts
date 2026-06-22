export interface UserDto {
  id: number;
  email: string;
  fullName: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: UserDto;
}

export interface TemplateListItem {
  id: number;
  name: string;
  description?: string | null;
  width: number;
  height: number;
  placeholdersJson: string;
  thumbnailDataUrl?: string | null;
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

export interface GeneratedCertificate {
  id: number;
  templateId: number;
  recipientName: string;
  dataJson: string;
  format: string;
  fileDataUrl?: string | null;
  batchId?: string | null;
  createdAt: string;
}

export interface SaveCertificateRequest {
  templateId: number;
  recipientName: string;
  dataJson: string;
  format: string;
  fileDataUrl?: string | null;
}

export interface BatchItem {
  recipientName: string;
  dataJson: string;
  fileDataUrl?: string | null;
}

export interface SaveBatchRequest {
  templateId: number;
  format: string;
  items: BatchItem[];
}

export interface BatchResult {
  batchId: string;
  count: number;
}
