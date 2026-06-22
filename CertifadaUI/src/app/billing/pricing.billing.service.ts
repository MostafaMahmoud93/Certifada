import { Injectable } from '@angular/core';
import { loadStripe } from '@stripe/stripe-js';
import { environment } from '../../environments/environment';


export type Selection = {
  planId: string;
  interval: 'month' | 'year';
  region: 'AE' | 'US';
  productId: string;
  priceId: string;
};
const Url = environment.apiURL;
@Injectable({ providedIn: 'root' })
export class BillingService {
   private _apiCreateCheckoutSession = `${Url}/api/billing/create-checkout-session`;
  private stripePromise = loadStripe(environment.stripePublishableKey);

  async startCheckout(sel: Selection) {
    // 1) Ask our backend to create a Checkout Session for this priceId
    const resp = await fetch(this._apiCreateCheckoutSession, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // You can include more metadata if you want
      body: JSON.stringify({
        priceId: sel.priceId,
        planId: sel.planId,
        interval: sel.interval,
        region: sel.region,
      }),
    });

    if (!resp.ok) {
      throw new Error(await resp.text());
    }

    const { sessionId } = await resp.json();

    // 2) Redirect the browser to Stripe Checkout
    const stripe = await this.stripePromise;
    if (!stripe) throw new Error('Stripe.js failed to load.');
    const { error } = await stripe.redirectToCheckout({ sessionId });
    if (error) throw error;
  }
}
