import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SmsLog, SmsLogDocument } from './schemas/sms-log.schema';

@Injectable()
export class SmsLogService {
  constructor(
    @InjectModel(SmsLog.name) private smsLogModel: Model<SmsLogDocument>,
  ) {}

  async create(smsLogData: any): Promise<SmsLog> {
    const newSmsLog = new this.smsLogModel(smsLogData);
    return newSmsLog.save();
  }

  async findByNotificationId(notificationId: string): Promise<SmsLog[]> {
    return this.smsLogModel.find({ notificationId }).populate(['parentId', 'studentId']);
  }

  async findById(id: string): Promise<SmsLog> {
    const smsLog = await this.smsLogModel.findById(id).populate(['parentId', 'studentId']);

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

  async findPending(): Promise<SmsLog[]> {
    return this.smsLogModel.find({ status: 'PENDING', retryCount: { $lt: 3 } });
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
}
