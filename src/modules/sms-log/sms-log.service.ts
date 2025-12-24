import {
  Injectable,
  Logger,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SmsLog, SmsLogDocument } from './schemas/sms-log.schema';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class SmsLogService {
  private readonly logger = new Logger(SmsLogService.name);

  constructor(
    @InjectModel(SmsLog.name) private smsLogModel: Model<SmsLogDocument>,
    @Inject(forwardRef(() => SmsService))
    private smsService: SmsService,
  ) {}

  async create(smsLogData: any): Promise<SmsLog> {
    const newSmsLog = new this.smsLogModel(smsLogData);
    return newSmsLog.save();
  }

  async findByNotificationId(notificationId: string): Promise<SmsLog[]> {
    return this.smsLogModel
      .find({ notificationId })
      .populate(['parentId', 'studentId']);
  }

  async findById(id: string): Promise<SmsLog> {
    const smsLog = await this.smsLogModel
      .findById(id)
      .populate(['parentId', 'studentId']);

    if (!smsLog) {
      throw new NotFoundException(`SmsLog with ID ${id} not found`);
    }

    return smsLog;
  }

  async updateStatus(id: string, status: string, data?: any): Promise<SmsLog> {
    const updateData: any = { status };

    if (data?.smsServerId) updateData.smsServerId = data.smsServerId;
    if (data?.errorMessage) updateData.errorMessage = data.errorMessage;
    if (status === 'SENT') updateData.sentAt = new Date();
    if (status === 'DELIVERED') updateData.deliveredAt = new Date();

    const smsLog = await this.smsLogModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!smsLog) {
      throw new NotFoundException(`SmsLog with ID ${id} not found`);
    }

    return smsLog;
  }

  async incrementRetryCount(id: string): Promise<SmsLog> {
    const smsLog = await this.smsLogModel.findByIdAndUpdate(
      id,
      { $inc: { retryCount: 1 } },
      { new: true },
    );

    if (!smsLog) {
      throw new NotFoundException(`SmsLog with ID ${id} not found`);
    }

    return smsLog as SmsLog;
  }

  async findAllFailed(): Promise<SmsLogDocument[]> {
    return this.smsLogModel
      .find({ status: 'FAILED', ignored: { $ne: true } })
      .populate(['parentId', 'studentId'])
      .sort({ createdAt: -1 });
  }

  async findSendingAndPending(): Promise<SmsLogDocument[]> {
    return this.smsLogModel
      .find({
        status: { $in: ['SENDING', 'PENDING'] },
        ignored: { $ne: true },
      })
      .populate(['parentId', 'studentId'])
      .sort({ createdAt: -1 });
  }

  async ignoreSingleSms(
    smsLogId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const smsLog = await this.smsLogModel.findById(smsLogId);

      if (!smsLog) {
        return {
          success: false,
          message: 'SMS log not found',
        };
      }

      await this.smsLogModel.findByIdAndUpdate(smsLogId, { ignored: true });

      this.logger.log(`✅ SMS ${smsLogId} marked as ignored`);
      return {
        success: true,
        message: 'SMS marked as ignored',
      };
    } catch (error) {
      this.logger.error(`Error ignoring SMS ${smsLogId}:`, error);
      return {
        success: false,
        message: `Error ignoring SMS: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async ignoreAllFailedSms(): Promise<{
    success: boolean;
    message: string;
    count: number;
  }> {
    try {
      const result = await this.smsLogModel.updateMany(
        { status: 'FAILED', ignored: { $ne: true } },
        { $set: { ignored: true } },
      );

      this.logger.log(
        `✅ ${result.modifiedCount} failed SMS marked as ignored`,
      );
      return {
        success: true,
        message: `${result.modifiedCount} SMS marked as ignored`,
        count: result.modifiedCount,
      };
    } catch (error) {
      this.logger.error('Error ignoring all failed SMS:', error);
      return {
        success: false,
        message: `Error ignoring SMS: ${error instanceof Error ? error.message : 'Unknown error'}`,
        count: 0,
      };
    }
  }

  /**
   * Helper method to calculate stats from a list of SMS logs
   */
  private calculateStats(logs: SmsLog[]): {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    pending: number;
  } {
    return {
      total: logs.length,
      sent: logs.filter((l) => l.status === 'SENT').length,
      delivered: logs.filter((l) => l.status === 'DELIVERED').length,
      failed: logs.filter((l) => l.status === 'FAILED').length,
      pending: logs.filter((l) => l.status === 'PENDING').length,
    };
  }

  async getStats(notificationId: string): Promise<any> {
    const logs = await this.smsLogModel.find({ notificationId });
    return this.calculateStats(logs);
  }

  async findAll(): Promise<SmsLog[]> {
    return this.smsLogModel
      .find()
      .sort({ sentAt: -1 })
      .populate(['parentId', 'studentId']);
  }

  async getGlobalStats(): Promise<any> {
    const logs = await this.smsLogModel.find();
    return this.calculateStats(logs);
  }

  async getRecentNotifications(limit: number = 10): Promise<any[]> {
    // Group by notificationId/notificationTitle and get recent notifications
    const logs = await this.smsLogModel
      .find({ status: 'SENT' })
      .sort({ sentAt: -1 })
      .limit(100)
      .populate(['parentId', 'studentId']);

    // Group by notification (using title and type as key)
    const grouped = new Map<string, any>();

    logs.forEach((log) => {
      const key = `${log.notificationTitle || 'Sans titre'}_${log.notificationType || 'CUSTOM'}_${
        log.sentAt ? new Date(log.sentAt).toISOString().slice(0, 16) : 'unknown'
      }`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          id: log._id.toString(),
          type: log.notificationType || 'CUSTOM',
          title: log.notificationTitle || 'Sans titre',
          sentAt: log.sentAt,
          count: 0,
          recipients: new Set(),
        });
      }

      const entry = grouped.get(key);
      entry.count++;
      if (log.parentId && typeof log.parentId === 'object') {
        entry.recipients.add((log.parentId as any).name || 'Inconnu');
      }
    });

    // Convert to array and format
    const notifications = Array.from(grouped.values())
      .map((notif) => ({
        id: notif.id,
        type: notif.type,
        destinataires: notif.title,
        nombre: notif.count,
        date: this.formatRelativeTime(notif.sentAt),
      }))
      .slice(0, limit);

    return notifications;
  }

  private formatRelativeTime(date: Date | undefined): string {
    if (!date) return 'Inconnu';

    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return new Date(date).toLocaleDateString('fr-FR');
  }

  async getHistory(): Promise<any[]> {
    // Get all SMS logs sorted by date (all statuses, not just SENT)
    const logs = await this.smsLogModel
      .find({ status: { $in: ['SENT', 'DELIVERED', 'FAILED', 'PENDING'] } })
      .sort({ createdAt: -1 })
      .populate(['parentId', 'studentId']);

    // Group by notification campaign (using title, type, and rounded time)
    const grouped = new Map<string, any>();

    logs.forEach((log: any) => {
      // Create a key for grouping (notification title + type + hour)
      const dateForGrouping = log.sentAt || log.createdAt;
      const dateRounded = dateForGrouping
        ? new Date(dateForGrouping).toISOString().slice(0, 13) // Group by hour
        : 'unknown';
      const key = `${log.notificationTitle || 'Sans titre'}_${log.notificationType || 'CUSTOM'}_${dateRounded}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          id: log._id.toString(),
          notificationTitle: log.notificationTitle || 'Sans titre',
          notificationType: log.notificationType || 'CUSTOM',
          message: log.message,
          sentAt: log.sentAt || log.createdAt,
          phones: new Set<string>(),
          successCount: 0,
          failedCount: 0,
          totalCount: 0,
        });
      }

      const entry = grouped.get(key);
      entry.totalCount++;

      if (
        log.status === 'SENT' ||
        log.status === 'DELIVERED' ||
        log.status === 'PENDING'
      ) {
        entry.successCount++;
      } else if (log.status === 'FAILED') {
        entry.failedCount++;
      }

      // Add phone number
      if (log.phoneNumber) {
        entry.phones.add(log.phoneNumber);
      }
    });

    // Convert to array and format for frontend
    const history = Array.from(grouped.values()).map((campaign, index) => {
      const totalCount = campaign.totalCount;
      const successCount = campaign.successCount;
      const failedCount = campaign.failedCount;

      let status = 'SENT';
      if (failedCount === totalCount) {
        status = 'FAILED';
      } else if (failedCount > 0) {
        status = 'PARTIAL';
      }

      return {
        id: `${campaign.id}-${index}`,
        phones: Array.from(campaign.phones),
        message: campaign.message,
        sentAt: campaign.sentAt,
        status,
        notificationType: campaign.notificationType,
        destinatairesInfo: campaign.notificationTitle,
        successCount,
        failedCount,
        totalCount,
      };
    });

    return history;
  }


  /**
   * Retry sending a single failed SMS
   */
  async retrySingleSms(
    smsLogId: string,
  ): Promise<{ success: boolean; message: string; smsLog?: SmsLog }> {
    try {
      const smsLog = await this.smsLogModel
        .findById(smsLogId)
        .populate(['parentId', 'studentId']);

      if (!smsLog) {
        return {
          success: false,
          message: 'SMS log not found',
        };
      }

      if (smsLog.status !== 'FAILED') {
        return {
          success: false,
          message: `Cannot retry SMS with status: ${smsLog.status}. Only FAILED SMS can be retried.`,
        };
      }

      this.logger.log(`🔄 Retrying SMS ${smsLogId} to ${smsLog.phoneNumber}`);

      // Resend the SMS
      const smsResult = await this.smsService.sendSms(
        smsLog.phoneNumber,
        smsLog.message,
      );

      // Increment retry count
      await this.incrementRetryCount(smsLogId);

      // Update SMS log with result
      const updatedSmsLog = await this.smsLogModel.findByIdAndUpdate(
        smsLogId,
        {
          status: smsResult.success ? 'PENDING' : 'FAILED',
          smsServerId: smsResult.messageId || smsLog.smsServerId,
          errorMessage: smsResult.success
            ? null
            : smsResult.error || smsResult.message,
        },
        { new: true },
      );

      if (smsResult.success) {
        this.logger.log(`✅ SMS ${smsLogId} retried successfully`);
        return {
          success: true,
          message: 'SMS retried successfully and is now PENDING',
          smsLog: updatedSmsLog as SmsLog,
        };
      } else {
        this.logger.warn(
          `❌ SMS ${smsLogId} retry failed: ${smsResult.error || smsResult.message}`,
        );
        return {
          success: false,
          message: `SMS retry failed: ${smsResult.error || smsResult.message}`,
          smsLog: updatedSmsLog as SmsLog,
        };
      }
    } catch (error) {
      this.logger.error(`Error retrying SMS ${smsLogId}:`, error);
      return {
        success: false,
        message: `Error retrying SMS: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Retry all failed SMS
   */
  async retryAllFailed(): Promise<{
    success: boolean;
    message: string;
    results: any;
  }> {
    try {
      const failedSms = await this.findAllFailed();

      if (failedSms.length === 0) {
        return {
          success: true,
          message: 'No failed SMS to retry',
          results: {
            total: 0,
            retried: 0,
            stillFailed: 0,
          },
        };
      }

      this.logger.log(`🔄 Retrying ${failedSms.length} failed SMS`);

      let retriedSuccessfully = 0;
      let stillFailed = 0;

      for (const sms of failedSms) {
        const result = await this.retrySingleSms(sms._id.toString());
        if (result.success) {
          retriedSuccessfully++;
        } else {
          stillFailed++;
        }
      }

      return {
        success: true,
        message: `Retry completed: ${retriedSuccessfully} succeeded, ${stillFailed} still failed`,
        results: {
          total: failedSms.length,
          retried: retriedSuccessfully,
          stillFailed,
        },
      };
    } catch (error) {
      this.logger.error('Error retrying all failed SMS:', error);
      return {
        success: false,
        message: `Error retrying failed SMS: ${error instanceof Error ? error.message : 'Unknown error'}`,
        results: {
          total: 0,
          retried: 0,
          stillFailed: 0,
        },
      };
    }
  }

  /**
   * Cancel a single SMS in SENDING or PENDING status
   */
  async cancelSingleSendingSms(
    smsLogId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const smsLog = await this.smsLogModel.findById(smsLogId);

      if (!smsLog) {
        return {
          success: false,
          message: 'SMS log not found',
        };
      }

      if (smsLog.status !== 'SENDING' && smsLog.status !== 'PENDING') {
        return {
          success: false,
          message: `Cannot cancel SMS with status: ${smsLog.status}. Only SENDING or PENDING SMS can be cancelled.`,
        };
      }

      await this.smsLogModel.findByIdAndUpdate(smsLogId, {
        status: 'FAILED',
        errorMessage: 'Cancelled by user',
        ignored: true,
      });

      this.logger.log(`✅ SMS ${smsLogId} cancelled successfully`);
      return {
        success: true,
        message: 'SMS cancelled successfully',
      };
    } catch (error) {
      this.logger.error(`Error cancelling SMS ${smsLogId}:`, error);
      return {
        success: false,
        message: `Error cancelling SMS: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Cancel all SMS in SENDING or PENDING status
   */
  async cancelAllSendingSms(): Promise<{
    success: boolean;
    message: string;
    count: number;
  }> {
    try {
      const result = await this.smsLogModel.updateMany(
        {
          status: { $in: ['SENDING', 'PENDING'] },
          ignored: { $ne: true },
        },
        {
          $set: {
            status: 'FAILED',
            errorMessage: 'Cancelled by user',
            ignored: true,
          },
        },
      );

      this.logger.log(
        `✅ ${result.modifiedCount} sending/pending SMS cancelled`,
      );
      return {
        success: true,
        message: `${result.modifiedCount} SMS cancelled`,
        count: result.modifiedCount,
      };
    } catch (error) {
      this.logger.error('Error cancelling all sending/pending SMS:', error);
      return {
        success: false,
        message: `Error cancelling SMS: ${error instanceof Error ? error.message : 'Unknown error'}`,
        count: 0,
      };
    }
  }

  async getStatsByClassForCurrentMonth(): Promise<any[]> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const logs = await this.smsLogModel
      .find({
        createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth },
        status: { $in: ['SENT', 'DELIVERED', 'PENDING'] },
      })
      .populate({
        path: 'studentId',
        select: 'classe firstName lastName',
      });

    const classeStats = new Map<string, { sent: number; total: number }>();

    logs.forEach((log: any) => {
      const classe = log.studentId?.classe || 'Sans classe';

      if (!classeStats.has(classe)) {
        classeStats.set(classe, { sent: 0, total: 0 });
      }

      const stats = classeStats.get(classe)!;
      stats.total++;
      if (log.status === 'SENT' || log.status === 'DELIVERED') {
        stats.sent++;
      }
    });

    const result = Array.from(classeStats.entries())
      .map(([classe, stats]) => ({
        classe,
        sent: stats.sent,
        total: stats.total,
        taux:
          stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total) // Sort by total SMS descending
      .slice(0, 10);

    return result;
  }
}
