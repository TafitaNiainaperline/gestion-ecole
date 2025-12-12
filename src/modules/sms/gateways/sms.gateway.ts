import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
export interface SmsStatusUpdate {
  smsLogId: string;
  messageId: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  phone: string;
  content?: string;
  updatedAt: string;
  errorMessage?: string;
}
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/sms',
})
export class SmsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(SmsGateway.name);
  @WebSocketServer()
  server: Server;
  handleConnection(client: Socket) {
    this.logger.log(`✅ Client connected: ${client.id}`);
    try {
      const clientCount = this.server?.sockets?.sockets?.size || 0;
      this.logger.log(`📊 Total connected clients: ${clientCount}`);
    } catch (error) {
      this.logger.warn('Could not get client count');
    }
  }
  handleDisconnect(client: Socket) {
    this.logger.log(`❌ Client disconnected: ${client.id}`);
    try {
      const clientCount = this.server?.sockets?.sockets?.size || 0;
      this.logger.log(`📊 Total connected clients: ${clientCount}`);
    } catch (error) {
      this.logger.warn('Could not get client count');
    }
  }
  /**
   * Emit SMS status update to all connected clients
   */
  emitSmsStatusUpdate(update: SmsStatusUpdate) {
    try {
      const clientCount = this.server?.sockets?.sockets?.size || 0;
      this.logger.log(`📤 Emitting SMS status update to ${clientCount} connected client(s)`);
      this.logger.log(`   Event: sms-status-update`);
      this.logger.log(`   Data: ${JSON.stringify(update)}`);
      this.server.emit('sms-status-update', update);
      this.logger.log(`✅ Event emitted successfully`);
    } catch (error) {
      this.logger.error('Error emitting SMS status update:', error);
    }
  }
  /**
   * Emit multiple SMS status updates
   */
  emitBulkSmsStatusUpdate(updates: SmsStatusUpdate[]) {
    this.logger.log(`Emitting ${updates.length} SMS status updates`);
    this.server.emit('sms-bulk-status-update', updates);
  }
}