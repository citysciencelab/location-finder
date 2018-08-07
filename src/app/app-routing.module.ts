import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TouchscreenComponent } from './touchscreen/touchscreen.component';
import { InfoscreenComponent } from './infoscreen/infoscreen.component';

const routes: Routes = [
  { path: '', component: TouchscreenComponent},
  { path: 'infoscreen', component: InfoscreenComponent}
];

@NgModule({
  exports: [ RouterModule ],
  imports: [ RouterModule.forRoot(routes) ]
})
export class AppRoutingModule {}
