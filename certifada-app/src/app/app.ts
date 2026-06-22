import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AlertHost } from './shared/components/alert/alert-host';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AlertHost],
  template: '<router-outlet></router-outlet><app-alert-host />',
})
export class App {}
