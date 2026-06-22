import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-billing-cancelled',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
  <section class="max-w-xl mx-auto p-6 text-center">
    <h2 class="text-2xl font-bold mb-2">Payment cancelled</h2>
    <p class="text-gray-600">No problem — you can try again anytime.</p>
    <a class="inline-block mt-6 px-4 py-2 rounded-xl bg-slate-200" routerLink="/">Back to pricing</a>
  </section>
  `,
})
export class BillingCancelledComponent {}
