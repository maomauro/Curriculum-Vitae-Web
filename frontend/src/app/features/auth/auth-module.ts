import { NgModule } from '@angular/core';

import { AuthRoutingModule } from './auth-routing-module';
import { AuthSharedModule } from './auth-shared.module';

@NgModule({
  imports: [AuthSharedModule, AuthRoutingModule],
})
export class AuthModule {}
