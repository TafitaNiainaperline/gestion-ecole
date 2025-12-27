import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';
import { NotificationStatus } from '../../commons/enums';
import { StudentService } from '../student/student.service';
import { SmsService } from '../sms/sms.service';
import { SmsLogService } from '../sms-log/sms-log.service';
import { SendImmediateDto } from './dto/send-immediate.dto';
import {
  PopulatedParent,
  PopulatedStudent,
  NotificationData,
  RecipientData,
  SmsApiResult,
  SendImmediateStats,
  SendResultItem,
  SendNowStats,
} from './interfaces';

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private studentService: StudentService,
    private smsService: SmsService,
    private smsLogService: SmsLogService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledNotifications() {
    try {
      const now = new Date();
      const scheduledNotifications = await this.notificationModel.find({
        scheduledAt: { $lte: now },
        status: NotificationStatus.DRAFT,
      });
      for (const notification of scheduledNotifications) {
        this.logger.log(
          `Sending scheduled notification: ${String(notification._id)}`,
        );
        await this.notificationModel.findByIdAndUpdate(
          notification._id,
          { status: NotificationStatus.SENDING },
          { new: true },
        );
        await this.sendNotification(notification);
        this.logger.log(
          `Notification sent successfully: ${String(notification._id)}`,
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error processing scheduled notifications: ${errorMessage}`,
      );
    }
  }
  async sendNow(
    notificationId: string,
  ): Promise<{ message: string; stats: SendNowStats }> {
    const notification = await this.notificationModel.findByIdAndUpdate(
      notificationId,
      { status: NotificationStatus.SENDING },
      { new: true },
    );
    if (!notification) {
      throw new Error(`Notification with ID ${notificationId} not found`);
    }
    await this.sendNotification(notification);
    return {
      message: 'Notification sent and removed from scheduled notifications',
      stats: {
        totalRecipients: notification.totalRecipients,
        successCount: notification.successCount,
        failureCount: notification.failureCount,
      },
    };
  }

  private async sendNotification(
    notification: NotificationDocument,
  ): Promise<void> {
    try {
      const targetStudents = await this.getTargetStudents(notification);
      this.logger.log(`Processing ${targetStudents.length} target students`);
      let successCount = 0;
      let failureCount = 0;
      for (const student of targetStudents) {
        try {
          this.logger.log(
            `Processing student: ${String(student._id)} (${student.firstName} ${student.lastName})`,
          );
          const parent = student.parentId;
          if (!parent) {
            this.logger.warn(
              `Student ${String(student._id)} (${student.firstName} ${student.lastName}) has no parent associated`,
            );
            failureCount++;
            continue;
          }
          if (!parent.phone) {
            this.logger.warn(
              `Parent ${String(parent._id)} for student ${String(student._id)} has no phone number`,
            );
            failureCount++;
            continue;
          }
          this.logger.log(
            `Sending SMS to parent ${parent.name} (${parent.phone})`,
          );
          const message = this.buildMessage(
            notification.message,
            parent,
            student,
          );
          const smsResult = await this.smsService.sendSms(
            parent.phone,
            message,
          );
          await this.smsLogService.create({
            notificationId: String(notification._id),
            notificationTitle: notification.title,
            notificationType: notification.type,
            parentId: String(parent._id),
            studentId: String(student._id),
            phoneNumber: parent.phone,
            message,
            status: smsResult.success ? 'PENDING' : 'FAILED',
            smsServerId: smsResult.messageId, // Store the messageId from API
            errorMessage: smsResult.success
              ? undefined
              : smsResult.error || smsResult.message,
          });
          if (smsResult.success) {
            successCount++;
          } else {
            failureCount++;
          }
        } catch (error) {
          this.logger.error(
            `Failed to send SMS for student ${String(student._id)}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          );
          failureCount++;
        }
      }
      await this.notificationModel.findByIdAndUpdate(
        notification._id,
        {
          totalRecipients: successCount + failureCount,
          successCount,
          failureCount,
          status: NotificationStatus.SENT,
          sentAt: new Date(),
        },
        { new: true },
      );
      this.logger.log(
        `Notification ${String(notification._id)}: ${successCount} sent, ${failureCount} failed`,
      );
      await this.notificationModel.findByIdAndDelete(notification._id);
      this.logger.log(
        `Notification ${String(notification._id)} deleted from scheduled notifications`,
      );
    } catch (error) {
      this.logger.error(
        `Error sending notification ${String(notification._id)}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      throw error;
    }
  }

  private async getTargetStudents(
    notification: NotificationDocument | NotificationData,
  ): Promise<PopulatedStudent[]> {
    const targetType = notification.targetType;
    const targetClasses = notification.targetClasses;
    const targetStudents = notification.targetStudents;
    this.logger.log(`Getting target students for targetType: ${targetType}`);
    this.logger.log(`targetClasses: ${JSON.stringify(targetClasses)}`);
    this.logger.log(`targetStudents: ${JSON.stringify(targetStudents)}`);
    if (targetType === 'CLASSE') {
      if (!targetClasses || targetClasses.length === 0) {
        this.logger.warn('No target classes specified');
        return [];
      }
      const students = await Promise.all(
        targetClasses.map((classe: string) =>
          this.studentService.findByClasse(classe),
        ),
      );
      const flatStudents = students.flat() as unknown as PopulatedStudent[];
      this.logger.log(
        `Found ${flatStudents.length} students in target classes`,
      );
      return flatStudents;
    }
    if (targetType === 'INDIVIDUEL') {
      if (!targetStudents || targetStudents.length === 0) {
        this.logger.warn('No target students specified');
        return [];
      }
      // Get specific target students
      const students = await Promise.all(
        targetStudents.map((studentId) =>
          this.studentService.findById(String(studentId)),
        ),
      );
      this.logger.log(`Found ${students.length} individual students`);
      return students as unknown as PopulatedStudent[];
    }
    if (targetType === 'TOUS') {
      const allStudents = await this.studentService.findAll();
      this.logger.log(`Found ${allStudents.length} students (all)`);
      return allStudents as unknown as PopulatedStudent[];
    }
    this.logger.warn(`Unknown targetType: ${targetType}`);
    return [];
  }

  private buildMessage(
    template: string,
    parent: PopulatedParent,
    student: PopulatedStudent,
  ): string {
    let message = template;
    // Replace placeholders with actual data
    message = message.replace(/{parentName}/g, parent.name || '');
    message = message.replace(/{parentPhone}/g, parent.phone || '');
    message = message.replace(/{studentFirstName}/g, student.firstName || '');
    message = message.replace(/{studentLastName}/g, student.lastName || '');
    message = message.replace(
      /{studentFullName}/g,
      `${student.firstName || ''} ${student.lastName || ''}`,
    );
    message = message.replace(/{matricule}/g, student.matricule || '');
    message = message.replace(/{classe}/g, student.classe || '');
    message = message.replace(/{niveau}/g, student.niveau || '');
    message = message.replace(/{status}/g, student.status || '');
    return message;
  }

  async sendImmediate(
    sendImmediateDto: SendImmediateDto,
  ): Promise<{ success: boolean; message: string; stats: SendImmediateStats }> {
    try {
      this.logger.log(
        'Sending immediate SMS notification (REST bulk approach)',
      );

      // Create a temporary notification object for processing
      const tempNotification: NotificationData = {
        _id: 'immediate-' + Date.now(),
        type: sendImmediateDto.type,
        title: sendImmediateDto.title,
        message: sendImmediateDto.message,
        targetType: sendImmediateDto.targetType,
        targetClasses: sendImmediateDto.targetClasses,
        targetStudents: sendImmediateDto.targetStudents,
      };

      // Get target students
      const targetStudents = await this.getTargetStudents(tempNotification);
      this.logger.log(
        `Processing ${targetStudents.length} target students for immediate send`,
      );

      const recipients: RecipientData[] = [];
      let skippedCount = 0;

      // Build list of valid recipients
      for (const student of targetStudents) {
        const parent = student.parentId;

        if (!parent) {
          this.logger.warn(
            `Student ${String(student._id)} (${student.firstName} ${student.lastName}) has no parent associated`,
          );
          skippedCount++;
          continue;
        }

        if (!parent.phone) {
          this.logger.warn(
            `Parent ${String(parent._id)} for student ${String(student._id)} has no phone number`,
          );
          skippedCount++;
          continue;
        }

        const message = this.buildMessage(
          sendImmediateDto.message,
          parent,
          student,
        );

        recipients.push({
          student,
          parent,
          phone: parent.phone,
          message,
        });
      }

      if (recipients.length === 0) {
        this.logger.warn('No valid recipients found');
        return {
          success: false,
          message: 'Aucun destinataire valide trouvé',
          stats: {
            totalRecipients: 0,
            sentCount: 0,
            failedCount: skippedCount,
            smsLogIds: [],
          },
        };
      }

      const messageGroups = new Map<string, RecipientData[]>();
      recipients.forEach((r) => {
        const existing = messageGroups.get(r.message) || [];
        existing.push(r);
        messageGroups.set(r.message, existing);
      });

      let sentCount = 0;
      let failedCount = skippedCount;
      const smsLogIds: string[] = [];
      const results: SendResultItem[] = [];

      for (const [message, groupRecipients] of messageGroups) {
        const phones = groupRecipients.map((r) => r.phone);

        this.logger.log(`📤 Sending bulk SMS to ${phones.length} recipients`);

        const smsResult = await this.smsService.sendMultiSms(phones, message);

        const resultsByPhone = new Map<string, SmsApiResult>();
        smsResult.results.forEach((r: SmsApiResult) => {
          resultsByPhone.set(r.phone, r);
        });

        for (const recipient of groupRecipients) {
          const formattedPhone = recipient.phone
            .replace(/\s+/g, '')
            .replace(/^\+261/, '0');
          const apiRes = resultsByPhone.get(formattedPhone);

          try {
            const smsLog = await this.smsLogService.create({
              notificationId: null,
              notificationTitle: sendImmediateDto.title,
              notificationType: sendImmediateDto.type,
              parentId: String(recipient.parent._id),
              studentId: String(recipient.student._id),
              phoneNumber: formattedPhone,
              message: recipient.message,
              status: apiRes?.success ? 'SENT' : 'FAILED',
              smsServerId: apiRes?.smsLogId || null,
              errorMessage: apiRes?.success
                ? undefined
                : apiRes?.error || 'Unknown error',
              sentAt: apiRes?.success ? new Date() : undefined,
            });

            const logId = String(
              (smsLog as unknown as { _id: { toString(): string } })._id,
            );
            smsLogIds.push(logId);

            if (apiRes?.success) {
              sentCount++;
              results.push({
                phone: formattedPhone,
                success: true,
                smsLogId: logId,
                externalSmsId: apiRes.smsLogId,
                status: apiRes.status || 'SENT',
              });
            } else {
              failedCount++;
              results.push({
                phone: formattedPhone,
                success: false,
                smsLogId: logId,
                error: apiRes?.error || 'Unknown error',
              });
            }
          } catch (error) {
            this.logger.error(
              `Failed to create SMS log for ${formattedPhone}: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`,
            );
            failedCount++;
          }
        }
      }

      this.logger.log(
        `✅ Immediate send completed: ${sentCount} sent, ${failedCount} failed`,
      );

      return {
        success: sentCount > 0,
        message: `SMS envoyés: ${sentCount} réussis, ${failedCount} échoués`,
        stats: {
          totalRecipients: sentCount + failedCount,
          sentCount,
          failedCount,
          smsLogIds,
          results,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error sending immediate SMS: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      throw error;
    }
  }
}
