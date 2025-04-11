import { Controller, Get, Post, Req, Res, Body, Logger } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express'

@Controller('payments')
export class PaymentsController {

  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-payment-session')
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
    // this.logger.log(`Webhook received`, JSON.stringify(req.body, null, 2));
    return this.paymentsService.stripeWebhook(req, res);
  }  
}
