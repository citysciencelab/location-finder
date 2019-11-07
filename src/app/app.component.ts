import { Component, OnInit } from '@angular/core';

import { environment } from '../environments/environment';
import { ConfigurationService } from './configuration.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(private config: ConfigurationService) { }

  ngOnInit() {
    if (environment.production) {
      // Disable the context menu on right-click (or long-tap on touch interfaces)
      document.body.oncontextmenu = () => false;
    } else {
      console.log(this.config);
    }
  }

}
