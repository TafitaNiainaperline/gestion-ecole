import { Types } from 'mongoose';

export interface PopulatedParent {
  _id: Types.ObjectId;
  name?: string;
  phone?: string;
}

export interface PopulatedStudent {
  _id: Types.ObjectId;
  firstName?: string;
  lastName?: string;
  matricule?: string;
  classe?: string;
  niveau?: string;
  status?: string;
  parentId?: PopulatedParent;
}

export interface NotificationData {
  _id: Types.ObjectId | string;
  type?: string;
  title?: string;
  message: string;
  targetType: string;
  targetClasses?: string[];
  targetStudents?: string[];
  totalRecipients?: number;
  successCount?: number;
  failureCount?: number;
}

export interface RecipientData {
  student: PopulatedStudent;
  parent: PopulatedParent;
  phone: string;
  message: string;
}

export interface SmsApiResult {
  phone: string;
  success: boolean;
  smsLogId?: string;
  status?: string;
  error?: string;
}

export interface SendImmediateStats {
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  smsLogIds: string[];
  results?: SendResultItem[];
}

export interface SendResultItem {
  phone: string;
  success: boolean;
  smsLogId?: string;
  externalSmsId?: string;
  status?: string;
  error?: string;
}

export interface SendNowStats {
  totalRecipients?: number;
  successCount?: number;
  failureCount?: number;
}
