import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { BrandExtractorService, BrandKit } from './brand-extractor.service';


type UseFor = 'work' | 'personal' | 'school';
type OrgType =
  | 'small business' | 'medium business' | 'enterprise' | 'school/university'
  | 'government' | 'other';

type RoleType =
  | 'business analyst' | 'consultant' | 'management' | 'finance' | 'admin/support'
  | 'operation' | 'it/engineering' | 'marketer' | 'hr' | 'pm' | 'learning'
  | 'sales';

@Component({
  standalone: true,
  selector: 'app-wizard-dialog',
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './wizard-dialog.component.html'
})
export class WizardDialogComponent {


    // wizard-dialog.component.ts (add these in the class)
useForOptions: UseFor[] = ['work','personal','school'];

orgOptions: OrgType[] = [
  'small business','medium business','enterprise',
  'school/university','government','other'
];

roleOptions: RoleType[] = [
  'business analyst','consultant','management','finance','admin/support',
  'operation','it/engineering','marketer','hr','pm','learning','sales'
];

setUseFor(u: UseFor) {
  this.step1Form.patchValue({ useFor: u });
}
setOrgType(o: OrgType) {
  this.step1Form.patchValue({ orgType: o });
}
setRole(r: RoleType) {
  this.step1Form.patchValue({ role: r });
}


  #fb = inject(FormBuilder);
  #dialogRef = inject(MatDialogRef<WizardDialogComponent, any>);
  #extractor = inject(BrandExtractorService);

  step = signal<1 | 2 | 3>(1);
  loading = signal(false);
  errorMsg = signal<string | null>(null);

  // Step 1
  step1Form = this.#fb.group({
    useFor: this.#fb.control<UseFor | null>(null, Validators.required),
    orgType: this.#fb.control<OrgType | null>(null, Validators.required),
    role:   this.#fb.control<RoleType | null>(null, Validators.required)
  });

  // Step 2 (brand kit)
  step2Form = this.#fb.group({
    mode: this.#fb.control<'manual' | 'website'>('website', Validators.required),
    companyName: this.#fb.control<string>('', []),
    website: this.#fb.control<string>('', []),
    // optional uploads/values (simple strings/urls for demo)
    logos: this.#fb.control<string[]>([]),
    colors: this.#fb.control<string[]>([]),
    fonts: this.#fb.control<string[]>([])
  });

  // Step 3 (subdomain only, we append `.certifada.com`)
  step3Form = this.#fb.group({
    subdomain: this.#fb.control('', [
      Validators.required,
      Validators.pattern(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/), // RFC-1123-ish
      Validators.minLength(3),
      Validators.maxLength(30)
    ])
  });

  brandPreview = signal<BrandKit | null>(null);
  domainCheck = signal<{available: boolean; reason?: string} | null>(null);

  canNext(): boolean {
  const s = this.step();
  if (s === 1) return this.step1Form.valid;

  if (s === 2) {
    const mode = this.step2Form.value.mode;
    if (mode === 'manual') {
      return !!this.step2Form.value.companyName;
    }
    if (mode === 'website') {
      return !!this.step2Form.value.website && !!this.brandPreview();
    }
    return false;
  }

  if (s === 3) {
    return this.step3Form.valid && !!this.domainCheck()?.available;
  }
  return false;
}

  setMode(mode: 'manual' | 'website') {
    this.step2Form.patchValue({ mode });
    this.brandPreview.set(null);
    this.errorMsg.set(null);
  }

  async extractFromWebsite() {
    const url = (this.step2Form.value.website || '').trim();
    if (!url) {
      this.errorMsg.set('Please enter a website URL.');
      return;
    }
    this.loading.set(true);
    this.errorMsg.set(null);
    this.brandPreview.set(null);
    try {
      const data = await this.#extractor.extractFromWebsite(url);
        if (!data || !data.logos || !data.colors || !data.fonts) {
            throw new Error('Invalid brand data received.');
        }
      // Merge into form (non-destructive)
      const logos = data.logos?.slice(0, 5) ?? [];
      const colors = data.colors?.slice(0, 8) ?? [];
      const fonts = data.fonts?.slice(0, 5) ?? [];
      this.step2Form.patchValue({
        companyName: this.step2Form.value.companyName || data.name || '',
        logos, colors, fonts
      });
      this.brandPreview.set(data);
    } catch (err: any) {
      this.errorMsg.set(err?.message || 'Failed to extract brand kit.');
    } finally {
      this.loading.set(false);
    }
  }

  async checkDomain() {
    this.domainCheck.set(null);
    if (this.step3Form.invalid) return;
    const sub = this.step3Form.value.subdomain!.toLowerCase();
    this.loading.set(true);
    try {
      const res = await this.#extractor.checkDomainAvailability(sub);
        if (!res || typeof res.available !== 'boolean') {
            throw new Error('Invalid domain check response.');
        }
      this.domainCheck.set(res);
    } catch (err: any) {
      this.domainCheck.set({ available: false, reason: err?.message || 'Check failed' });
    } finally {
      this.loading.set(false);
    }
  }

  next() {
    if (!this.canNext()) return;
    if (this.step() === 1) this.step.set(2);
    else if (this.step() === 2) this.step.set(3);
  }

  back() {
    if (this.step() === 2) this.step.set(1);
    else if (this.step() === 3) this.step.set(2);
  }

  finish() {
    if (!this.canNext()) return;
    const payload = {
      step1: this.step1Form.value,
      step2: this.step2Form.value,
      step3: {
        fullDomain: `${this.step3Form.value.subdomain}.certifada.com`,
        subdomain: this.step3Form.value.subdomain
      }
    };
    this.#dialogRef.close(payload);
  }

  close() {
    this.#dialogRef.close(null);
  }

  onCompanyNameInput(e: Event) {
  this.step2Form.patchValue({ companyName: (e.target as HTMLInputElement).value });
}
onWebsiteInput(e: Event) {
  this.step2Form.patchValue({ website: (e.target as HTMLInputElement).value });
}
onCsvChange(key: 'logos'|'colors'|'fonts', e: Event) {
  const v = (e.target as HTMLInputElement).value || '';
  this.step2Form.patchValue({ [key]: v.split(',').map(x => x.trim()).filter(Boolean) });
}

}
