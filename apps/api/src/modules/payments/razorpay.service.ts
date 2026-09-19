import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';
import Razorpay from 'razorpay';

/**
 * Thin wrapper around the Razorpay SDK. Keeps all gateway specifics in one
 * place so the rest of the app deals only with our domain (paise, ledger).
 */
@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private _client: Razorpay | null = null;
  private readonly webhookSecret: string;

  constructor(private readonly config: ConfigService) {
    this.webhookSecret = this.config.get<string>('RAZORPAY_WEBHOOK_SECRET', '');
    const keyId = this.config.get<string>('RAZORPAY_KEY_ID', '');
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET', '');
    if (keyId && keySecret) {
      this._client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    } else {
      this.logger.warn('Razorpay credentials not set — payment endpoints will be unavailable');
    }
  }

  private get client(): Razorpay {
    if (!this._client) throw new Error('Razorpay is not configured (missing RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)');
    return this._client;
  }

  /** Create a Razorpay order for a pay-per-event / ritual checkout. */
  async createOrder(amountPaise: number, receipt: string) {
    return this.client.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      payment_capture: true,
    });
  }

  /** Verify the signature on an incoming webhook payload (raw body string). */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const expected = createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');
    return expected === signature;
  }
}
