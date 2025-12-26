export interface CreateSmsLogData {
  notificationId?: string | null;
  notificationTitle?: string;
  notificationType?: string;
  parentId: string;
  studentId?: string | null;
  phoneNumber: string;
  message: string;
  status?: string;
  smsServerId?: string | null;
  errorMessage?: string | null;
  sentAt?: Date | null;
}

export interface UpdateStatusData {
  smsServerId?: string;
  errorMessage?: string;
}

export interface SmsStats {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  pending: number;
}

export interface RecentNotification {
  id: string;
  type: string;
  destinataires: string;
  nombre: number;
  date: string;
}

export interface NotificationGroupEntry {
  id: string;
  type: string;
  title: string;
  sentAt?: Date;
  count: number;
  recipients: Set<string>;
}

export interface HistoryCampaign {
  id: string;
  notificationTitle: string;
  notificationType: string;
  message: string;
  sentAt?: Date;
  phones: Set<string>;
  successCount: number;
  failedCount: number;
  totalCount: number;
}

export interface HistoryEntry {
  id: string;
  phones: string[];
  message: string;
  sentAt?: Date;
  status: string;
  notificationType: string;
  destinatairesInfo: string;
  successCount: number;
  failedCount: number;
  totalCount: number;
}

export interface RetryResults {
  total: number;
  retried: number;
  stillFailed: number;
}

export interface ClasseStats {
  classe: string;
  sent: number;
  total: number;
  taux: number;
}

export interface PopulatedParent {
  _id: string;
  name?: string;
}

export interface PopulatedStudent {
  _id: string;
  classe?: string;
  firstName?: string;
  lastName?: string;
}
