import { Injectable, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { envs } from 'src/config/envs';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe = new Stripe(envs.stripeSecret);

  async createPaymentSession(paymentSessionDto: PaymentSessionDto) {
    const { currency, items, orderId } = paymentSessionDto;

    const lineItems = items.map((item) => {
      return {
        price_data: {
          currency: currency,
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100), // 20 dólares 2000 / 100 = 20.00 // 15.0000
        },
        quantity: item.quantity,
      };
    });

    const session = await this.stripe.checkout.sessions.create({
      // Colocar aquí el ID de mi orden
      payment_intent_data: {
        metadata: {
          orderId: orderId,
        },
      },
      line_items: lineItems,
      mode: 'payment',
      success_url: envs.stripeSuccessUrl,
      cancel_url: envs.stripeCancelUrl,
    });

    return session;
  }

  async stripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      this.logger.error('Missing stripe signature');
      return res.status(400).send({ error: 'Missing stripe signature' });
    }

    let event: Stripe.Event;

    // Real
    const endpointSecret = envs.stripeEndpointSecret;

    try {
      event = this.stripe.webhooks.constructEvent(
        req['rawBody'],
        sig,
        endpointSecret,
      );
      if (!event) {
        this.logger.error('Invalid event');
        return res.status(400).send({ error: 'Invalid event' });
      }
    } catch (err) {
      this.logger.error(`Webhook Error: ${err.message}`);
      res.status(400).send({ error: `Webhook Error: ${err.message}` });
      return;
    }

    this.logger.log(`Event type received: ${event.type}`);

    switch (event.type) {
      case 'charge.succeeded':
        const chargeSucceeded = event.data.object;
        // TODO: llamar nuestro microservicio
        this.logger.log({
          metadata: chargeSucceeded.metadata,
          orderId: chargeSucceeded.metadata.orderId,
        });
        break;

      default:
        this.logger.log(`Event ${event.type} not handled`);
    }

    return res.status(200).json({ sig });
  }
}
