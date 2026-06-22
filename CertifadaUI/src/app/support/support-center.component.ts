import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../shared/components/toast/toast.service';
import { SharedModule } from '../shared/shared.module';

@Component({
  standalone: true,
  selector: 'app-support-center',
  imports: [CommonModule, HttpClientModule, SharedModule, FormsModule],
  templateUrl: './support-center.component.html',
  styleUrls: ['./support-center.component.css'],

})
export class SupportCenter {

activeSection:
  | 'support'
  | 'live'
  | 'API'
  | 'access-token'
  | 'developers' = 'API';

  integrationItems = [
  {
    title: 'Get Certifcates',
    method: 'GET',
    path: '/api/v1/Certifcates',
    description: 'Retrieve a list of Certifcates in your account.'
  },
  {
    title: 'Create Certifcates',
    method: 'POST',
    path: '/api/v1/Certifcates',
    description: 'Create a new Certifcates with its Parameters.'
  },
  {
    title: 'Delete Certifcates',
    method: 'DELETE',
    path: '/api/v1/Certifcates/:id',
    description: 'Delete a Certifcate by their ID.'
  },
  {
    title: 'Update Certifcates',
    method: 'PUT',
    path: '/api/v1/Certifcates/:id',
    description: 'Update an existing Certificate’s data.'
  }
];

searchTerm = '';
token: { name: string; value: string; created: Date } | null = null;
isDeveloperOpen = true;
sidebarOpen = false;
isMobile = false;
tokenVisible = false;

constructor(@Inject(ToastService) private toast: ToastService) { }

ngOnInit() {
  this.isMobile = window.innerWidth < 768;
  window.addEventListener('resize', () => {
    this.isMobile = window.innerWidth < 768;
    if (!this.isMobile) this.sidebarOpen = true;
  });
}
generateToken() {
  const randomPart = () =>
    Math.random().toString(36).substring(2); 

  let tokenStr = '';
  while (tokenStr.length < 64) {
    tokenStr += randomPart();
  }

  this.token = {
    name: 'My Access Token',
    value: tokenStr.substring(0, 64),
    created: new Date()
  };

  this.tokenVisible = false;
}

revokeToken() {
  this.token = null;
}

 setSection(section: 'support' | 'live' | 'API' | 'access-token' | 'developers') {
    this.activeSection = section;
    if (section != 'API' && section != 'access-token') {
      this.isDeveloperOpen = false;
    }
  }

copyTokenToClipboard() {
  if (!this.token?.value) return;

  navigator.clipboard.writeText(this.token.value).then(() => {
    console.log('Token copied!');
  });
      this.toast.success('Token copied to clipboard!');
}
}
