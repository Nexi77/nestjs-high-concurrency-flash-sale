import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderWorkerService {
  getHello(): string {
    return 'Hello World!';
  }
}
