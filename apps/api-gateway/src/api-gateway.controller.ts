import { Controller, Get } from '@nestjs/common';

@Controller()
export class ApiGatewayController {
  @Get('health')
  getHealth() {
    return { status: 'OK' };
  }
}
