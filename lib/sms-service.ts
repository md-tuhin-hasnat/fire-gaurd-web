/**
 * SMS Service
 * Mock SMS service for sending notifications to traffic police
 * In production, integrate with Twilio, AWS SNS, or local SMS gateway
 */

import connectDB from './db';
import mongoose from 'mongoose';

// SMS Log Schema (for mock implementation)
interface ISMSLog {
  to: string;
  message: string;
  sentAt: Date;
  status: 'sent' | 'failed';
  provider: 'mock' | 'twilio' | 'aws_sns';
}

const SMSLogSchema = new mongoose.Schema<ISMSLog>({
  to: { type: String, required: true },
  message: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
  provider: { type: String, enum: ['mock', 'twilio', 'aws_sns'], default: 'mock' },
});

const SMSLog = mongoose.models.SMSLog || mongoose.model('SMSLog', SMSLogSchema);

/**
 * Send SMS (Mock Implementation)
 * @param to - Phone number to send SMS
 * @param message - SMS message content
 * @returns Promise<boolean> - Success status
 */
export async function sendSMS(to: string, message: string): Promise<boolean> {
  try {
    await connectDB();

    // Mock: Just log to database and console
    await SMSLog.create({
      to,
      message,
      sentAt: new Date(),
      status: 'sent',
      provider: 'mock',
    });

    console.log(`📱 SMS Sent to ${to}:`);
    console.log(`   Message: ${message}`);
    console.log('');

    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    
    // Log failed attempt
    try {
      await SMSLog.create({
        to,
        message,
        sentAt: new Date(),
        status: 'failed',
        provider: 'mock',
      });
    } catch (logError) {
      console.error('Error logging SMS failure:', logError);
    }

    return false;
  }
}

/**
 * Send SMS to multiple recipients
 */
export async function sendBulkSMS(
  recipients: string[],
  message: string
): Promise<{ sent: number; failed: number }> {
  const results = await Promise.allSettled(
    recipients.map((phone) => sendSMS(phone, message))
  );

  const sent = results.filter((r) => r.status === 'fulfilled' && r.value === true).length;
  const failed = results.length - sent;

  console.log(`📊 Bulk SMS Results: ${sent} sent, ${failed} failed`);

  return { sent, failed };
}

/**
 * Get SMS logs (for admin viewing)
 */
export async function getSMSLogs(limit: number = 50) {
  await connectDB();
  return await SMSLog.find().sort({ sentAt: -1 }).limit(limit);
}

export default sendSMS;
