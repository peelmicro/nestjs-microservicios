import {
  Controller,
  Inject,
  Post,
  Body,
  Logger,
  Get,
  UseGuards,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ClientProxy } from '@nestjs/microservices';
import { RegisterUserDto } from './dto/register-user.dto';
import { NATS_SERVICE } from 'src/config/services';
import { LoginUserDto } from './dto/login-user.dto';
import { catchError } from 'rxjs';
import { User } from './decorators/user.decorator';
import { AuthGuard } from './guards/auth.guard';
import { CurrentUser } from './interfaces/current-user.interface';
import { Token } from './decorators/token.decorator';

const debug = false;

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Post('register')
  registerUser(@Body() registerUserDto: RegisterUserDto) {
    if (debug) {
      this.logger.log('registerUser', registerUserDto);
    }
    return this.client.send('auth.register.user', registerUserDto).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto) {
    if (debug) {
      this.logger.log('loginUser', loginUserDto);
    }
    return this.client.send('auth.login.user', loginUserDto).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @UseGuards( AuthGuard )
  @Get('verify')
  verifyToken( @User() user: CurrentUser, @Token() token: string  ) {
    if (debug) {
      this.logger.log('verifyToken', { user, token });
    }
    // Validation of the token and the user is made in the AuthGuard
    return { user, token }
  }

}
