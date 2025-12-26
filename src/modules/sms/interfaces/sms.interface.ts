export interface SmsApiResponse {
  success: boolean;
  message: string;
  messageId?: string;
  messageIds?: string[];
  data?: SmsApiResponseData;
  error?: string;
}

export interface SmsApiResponseData {
  sent?: number;
  timestamp?: Date;
  phones?: string[];
  status?: string;
  message?: string;
  data?: ExternalApiSmsItem[];
}

export interface ExternalApiSmsItem {
  _id: string;
  phone: string;
  message?: string;
  status: string;
  isDraft?: boolean;
  projectId?: string;
  secretId?: string;
  createdAt?: string;
  updatedAt?: string;
  sender?: string;
  phoneId?: string;
  slot?: number;
}

export interface ExternalApiResponse {
  status?: string;
  message?: string;
  messageIds?: string[];
  data?: ExternalApiSmsItem[];
}
