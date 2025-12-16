import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SmsLog, SmsLogDocument } from './schemas/sms-log.schema';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class SmsLogService {
  private readonly logger = new Logger(SmsLogService.name);
  // Map to store promises waiting for webhook confirmation
  private pendingWebhooks = new Map<string, {
    resolve: (value: string) => void;
    reject: (reason?: any) => void;
    timeout: NodeJS.Timeout;
  }>();

  constructor(
    @InjectModel(SmsLog.name) private smsLogModel: Model<SmsLogDocument>,
    @Inject(forwardRef(() => SmsService))
    private smsService: SmsService,
  ) {}

  async create(smsLogData: any): Promise<SmsLog> {
    const newSmsLog = new this.smsLogModel(smsLogData);
    return newSmsLog.save();
  }

  /**
   * Wait for webhook confirmation with timeout
   * Returns the final status (SENT or FAILED) or timeout
   */
  async waitForWebhookConfirmation(smsLogId: string, timeoutMs: number = 30000): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingWebhooks.delete(smsLogId);
        resolve('PENDING'); // Return PENDING if webhook doesn't arrive
      }, timeoutMs);

      this.pendingWebhooks.set(smsLogId, {
        resolve,
        reject,
        timeout,
      });
    });
  }

  /**
   * Notify waiting code that webhook arrived
   */
  notifyWebhookArrived(smsLogId: string, status: string): void {
    const pending = this.pendingWebhooks.get(smsLogId);
    if (pending) {
      clearTimeout(pending.timeout);
      pending.resolve(status);
      this.pendingWebhooks.delete(smsLogId);
      this.logger.log(`Webhook notified for SMS ${smsLogId}: ${status}`);
    }
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

  async update(id: string, smsLogData: any): Promise<SmsLog> {
    const updatedSmsLog = await this.smsLogModel.findByIdAndUpdate(id, smsLogData, {
      new: true,
    });

    if (!updatedSmsLog) {
      throw new NotFoundException(`SmsLog with ID ${id} not found`);
    }

    return updatedSmsLog;
  }

  async delete(id: string): Promise<SmsLog> {
    const deletedSmsLog = await this.smsLogModel.findByIdAndDelete(id);
    if (!deletedSmsLog) {
      throw new NotFoundException(`SmsLog with ID ${id} not found`);
    }
    return deletedSmsLog;
  }

  async updateStatus(id: string, status: string): Promise<SmsLog> {
    const smsLog = await this.smsLogModel.findByIdAndUpdate(id, { status }, {
      new: true,
    });

    if (!smsLog) {
      throw new NotFoundException(`SmsLog with ID ${id} not found`);
    }

    return smsLog;
  }

  /**
   * Update SMS log status via webhook from external API
   * Accepts: sms_id (log ID), messageId, status, or phone
   */
  async updateStatusByWebhook(body: {
    sms_id?: string;
    messageId?: string;
    status?: string;
    phone?: string;
  }): Promise<any> {
    try {
      const { sms_id, messageId, status, phone } = body;

      this.logger.log(` WEBHOOK RECEIVED: ${JSON.stringify(body)}`);

      // Map API status to internal status
      let internalStatus = 'PENDING';
      if (status) {
        const statusLower = status.toLowerCase();
        if (statusLower === 'sent' || statusLower === 'success' || statusLower === 'ok') {
          internalStatus = 'SENT';
        } else if (statusLower === 'delivered') {
          internalStatus = 'DELIVERED';
        } else if (statusLower === 'error' || statusLower === 'failed' || statusLower === 'failure' || statusLower === 'invalid') {
          internalStatus = 'FAILED';
        } else if (statusLower === 'pending' || statusLower === 'processing' || statusLower === 'forfait_requis' || statusLower === 'en attente de forfait') {
          internalStatus = 'PENDING';
        }
      }

      this.logger.log(`📊 Webhook mapped status: "${status}" → "${internalStatus}"`);

      let updatedLog = null;

      // Try to find by sms_id (log ID)
      if (sms_id) {
        updatedLog = await this.smsLogModel.findByIdAndUpdate(
          sms_id,
          { status: internalStatus, updatedAt: new Date() },
          { new: true },
        );
        if (updatedLog) {
          this.logger.log(
            `✅ Webhook updated SMS log ${sms_id} to status ${internalStatus}`,
          );
          return { success: true, message: 'Status updated', log: updatedLog };
        }
      }

      // Fallback: Try to find by messageId
      if (messageId && !updatedLog) {
        updatedLog = await this.smsLogModel.findOneAndUpdate(
          { messageId: messageId },
          { status: internalStatus, updatedAt: new Date() },
          { new: true },
        );
        if (updatedLog) {
          this.logger.log(
            `✅ Webhook updated SMS log (messageId: ${messageId}) to status ${internalStatus}`,
          );
          return { success: true, message: 'Status updated by messageId', log: updatedLog };
        }
      }

      // Fallback: Try to find by phone
      if (phone && !updatedLog) {
        updatedLog = await this.smsLogModel.findOneAndUpdate(
          { phoneNumber: phone },
          { status: internalStatus, updatedAt: new Date() },
          { new: true },
        );
        if (updatedLog) {
          this.logger.log(
            `✅ Webhook updated SMS log (phone: ${phone}) to status ${internalStatus}`,
          );
          return { success: true, message: 'Status updated by phone', log: updatedLog };
        }
      }

      this.logger.warn(
        `⚠️ Webhook could not find SMS log: sms_id=${sms_id}, messageId=${messageId}, phone=${phone}`,
      );
      return {
        success: false,
        message: 'SMS log not found',
        details: body,
      };
    } catch (error) {
      this.logger.error(
        `Error in webhook handler: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return {
        success: false,
        message: 'Error processing webhook',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async findAllFailed(): Promise<SmsLogDocument[]> {
    return this.smsLogModel
      .find({ status: 'FAILED' })
      .populate(['parentId', 'studentId'])
      .sort({ createdAt: -1 });
  }

  async getStats(notificationId: string): Promise<any> {
    const logs = await this.smsLogModel.find({ notificationId });

    return {
      total: logs.length,
      sent: logs.filter((l) => l.status === 'SENT').length,
      delivered: logs.filter((l) => l.status === 'DELIVERED').length,
      failed: logs.filter((l) => l.status === 'FAILED').length,
      pending: logs.filter((l) => l.status === 'PENDING').length,
    };
  }

  async findAll(): Promise<SmsLog[]> {
    return this.smsLogModel
      .find()
      .sort({ createdAt: -1 })
      .populate(['parentId', 'studentId']);
  }

  async getGlobalStats(): Promise<any> {
    const logs = await this.smsLogModel.find();

    return {
      total: logs.length,
      sent: logs.filter((l) => l.status === 'SENT').length,
      delivered: logs.filter((l) => l.status === 'DELIVERED').length,
      failed: logs.filter((l) => l.status === 'FAILED').length,
      pending: logs.filter((l) => l.status === 'PENDING').length,
    };
  }

  async getRecentNotifications(limit: number = 10): Promise<any[]> {
    // Group by notificationId/notificationTitle and get recent notifications
    const logs = await this.smsLogModel
      .find({ status: 'SENT' })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate(['parentId', 'studentId']);

    // Group by notification (using title and type as key)
    const grouped = new Map<string, any>();

    logs.forEach((log) => {
      const key = `${log.notificationTitle || 'Sans titre'}_${log.notificationType || 'CUSTOM'}_${
        log.createdAt ? new Date(log.createdAt).toISOString().slice(0, 16) : 'unknown'
      }`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          id: log._id.toString(),
          type: log.notificationType || 'CUSTOM',
          title: log.notificationTitle || 'Sans titre',
          createdAt: log.createdAt,
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
        date: this.formatRelativeTime(notif.createdAt),
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
    // Get all SMS logs sorted by date
    const logs = await this.smsLogModel
      .find({ status: 'SENT' })
      .sort({ createdAt: -1 })
      .populate(['parentId', 'studentId']);

    // Group by notification campaign (using title, type, and rounded time)
    const grouped = new Map<string, any>();

    logs.forEach((log) => {
      // Create a key for grouping (notification title + type + hour)
      const createdAtRounded = log.createdAt
        ? new Date(log.createdAt).toISOString().slice(0, 13) // Group by hour
        : 'unknown';
      const key = `${log.notificationTitle || 'Sans titre'}_${log.notificationType || 'CUSTOM'}_${createdAtRounded}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          id: log._id.toString(),
          notificationTitle: log.notificationTitle || 'Sans titre',
          notificationType: log.notificationType || 'CUSTOM',
          message: log.message,
          createdAt: log.createdAt,
          phones: new Set<string>(),
          successCount: 0,
          failedCount: 0,
          totalCount: 0,
        });
      }

      const entry = grouped.get(key);
      entry.totalCount++;

      if (log.status === 'SENT') {
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
        createdAt: campaign.createdAt,
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



  async retrySingleSms(smsLogId: string): Promise<{ success: boolean; message: string; smsLog?: SmsLog }> {
    try {
      const smsLog = await this.smsLogModel.findById(smsLogId).populate(['parentId', 'studentId']);

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

      this.logger.log(` Retrying SMS ${smsLogId} to ${smsLog.phoneNumber}`);

      const smsResult = await this.smsService.sendSms(smsLog.phoneNumber, smsLog.message);

      const updatedSmsLog = await this.smsLogModel.findByIdAndUpdate(
        smsLogId,
        {
          status: smsResult.success ? 'SENT' : 'FAILED',
        },
        { new: true },
      );

      if (smsResult.success) {
        this.logger.log(` SMS ${smsLogId} retried successfully`);
        return {
          success: true,
          message: 'SMS retried successfully and is now SENT',
          smsLog: updatedSmsLog as SmsLog,
        };
      } else {
        this.logger.warn(` SMS ${smsLogId} retry failed: ${smsResult.error || smsResult.message}`);
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

 
  async retryAllFailed(): Promise<{ success: boolean; message: string; results: any }> {
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

      this.logger.log(` Retrying ${failedSms.length} failed SMS`);

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


  async cancelSingleSendingSms(smsLogId: string): Promise<{ success: boolean; message: string }> {
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
      });

      this.logger.log(` SMS ${smsLogId} cancelled successfully`);
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


  async cancelAllSendingSms(): Promise<{ success: boolean; message: string; count: number }> {
    try {
      const result = await this.smsLogModel.updateMany(
        {
          status: { $in: ['SENDING', 'PENDING'] },
        },
        {
          $set: {
            status: 'FAILED',
          }
        },
      );

      this.logger.log(`${result.modifiedCount} sending/pending SMS cancelled`);
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

  async findAllWithPagination(
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: string;
      notificationId?: string;
      parentId?: string;
      studentId?: string;
      from?: string;
      to?: string;
    },
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<{ data: SmsLog[]; total: number; page: number; limit: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    const query: any = {};

    if (filters?.status) query.status = filters.status;
    if (filters?.notificationId) query.notificationId = filters.notificationId;
    if (filters?.parentId) query.parentId = filters.parentId;
    if (filters?.studentId) query.studentId = filters.studentId;


    if (filters?.from || filters?.to) {
      query.createdAt = {};
      if (filters?.from) query.createdAt.$gte = new Date(filters.from);
      if (filters?.to) query.createdAt.$lte = new Date(filters.to);
    }


    const sortObj: any = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;


    const [data, total] = await Promise.all([
      this.smsLogModel
        .find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate(['parentId', 'studentId']),
      this.smsLogModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
