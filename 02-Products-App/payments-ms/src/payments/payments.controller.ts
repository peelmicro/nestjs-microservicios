import { Controller, Get, Post, Req, Res, Body, Logger } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express'
import { MessagePattern } from '@nestjs/microservices';

const debug = true
@Controller('payments')
export class PaymentsController {

  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-payment-session')
  @MessagePattern('create.payment.session') // It is recommended to use the dot notation for the message pattern with NATS
  createPaymentSession(@Body() paymentSessionDto: PaymentSessionDto ) {
    return this.paymentsService.createPaymentSession(paymentSessionDto);
  }

  @Get('success')
  success() {
    return {
      ok: true,
      message: 'Payment successful'
    }
  }

  @Get('cancel')
  cancel() {
    return {
      ok: false,
      message: 'Payment cancelled'
    }
  }

  @Post('/webhook')
  async stripeWebhook(@Req() req: Request, @Res() res: Response) {
    if (debug) {
      this.logger.debug('Webhook request received');
      this.logger.debug(`Headers: ${JSON.stringify(req.headers)}`);
      this.logger.debug(`Body: ${JSON.stringify(req.body)}`);
    }
    try {
      const result = await this.paymentsService.stripeWebhook(req, res);
      if (debug) {
        this.logger.debug('Webhook processed successfully');
      }
      return result;
    } catch (error) {
      this.logger.error(`Webhook error: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
  }  
}
