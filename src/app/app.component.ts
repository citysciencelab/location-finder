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
    if (!environment.production) {
      console.log(this.config);
    }
  }

}
