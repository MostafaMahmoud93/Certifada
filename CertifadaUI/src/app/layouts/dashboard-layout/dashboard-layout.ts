import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../shared/header/header';

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet, Header],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.scss'
})
export class DashboardLayout {

}
