import { Component, OnInit } from '@angular/core';
import { IonIcon, IonFooter } from '@ionic/angular/standalone';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: true,
  imports: [IonFooter, IonIcon]
})
export class FooterComponent  implements OnInit {
  readonly currentYear = new Date().getFullYear();

  constructor() { }

  ngOnInit() {}

}