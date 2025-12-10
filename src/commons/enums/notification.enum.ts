export enum NotificationType {
  ECOLAGE = 'ECOLAGE',
  REUNION = 'REUNION',
  MALADIE = 'MALADIE',
  CUSTOM = 'CUSTOM',
}

export enum NotificationTargetType {
  CLASSE = 'CLASSE',
  INDIVIDUEL = 'INDIVIDUEL',
  TOUS = 'TOUS',
  NIVEAU = 'NIVEAU',
  IMPAYES = 'IMPAYES',
}

export enum NotificationStatus {
  DRAFT = 'DRAFT',
  SENDING = 'SENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}
