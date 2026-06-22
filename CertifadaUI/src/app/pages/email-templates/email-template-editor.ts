import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface MentionData {
  id: string;
  value: string;
  label?: string;
}

interface PlaceholderItem {
  id: string;
  value: string;
  label: string;
}

@Component({
  selector: 'app-email-template-editor',
  templateUrl: './email-template-editor.html',
  standalone: false,
  styleUrls: ['./email-template-editor.css'],
})

export class EmailTemplateEditor {

  constructor(private sanitizer: DomSanitizer,) {}

  focusedField: 'subject' | 'body' | null = null;
  isDark = false;
  @Input() subject: string = '';
  @Input() body: string = `
    <p>Hi {{user.name}},</p><br/>
    <p>We’re excited to inform you that your <strong>{{template.name}}</strong> certificate has been issued.</p>
    <p>Download it anytime from your portal.</p>
    <p><br/>Best,<br/>Certifada Team</p>
  `;

  @Output() subjectChange = new EventEmitter<string>();
  @Output() bodyChange = new EventEmitter<string>();

   mockData: Record<string, string> = {
    'user.name': 'Bilal Hemdulla',
    'user.email': 'info@certifada.com',
    'template.name': 'Thanks & Appreciation',
    'credential.title': 'Professional Certificate'
  };

  placeholders: MentionData[] = [
    { id: 'user.name', value: '{{user.name}}', label: 'User Name' },
    { id: 'user.email', value: '{{user.email}}', label: 'User Email' },
    { id: 'template.name', value: '{{template.name}}', label: 'Template Name' },
    { id: 'credential.title', value: '{{credential.title}}', label: 'Credential Title' }
  ];

  quillModules = {
    toolbar: [
    [{'font': [] }, { 'size': [] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{'color': [] }, { 'background': [] }],
    [{'script': 'sub' }, { 'script': 'super' }],
    [{'header': [1, 2, 3, 4, 5, 6, false] }],
    ['blockquote', 'code-block'],
    [{'align': [] }],
    [{'list': 'ordered' }, { 'list': 'bullet' }],
    [{'indent': '-1' }, { 'indent': '+1' }],
    [{'direction': 'rtl' }],
    ['link', 'image', 'video'],
    ['clean']
  ],
  mention: {
    mentionDenotationChars: ['{{'],
    source: (searchTerm: string, renderList: (data: MentionData[], searchTerm: string) => void) => {
      const values: MentionData[] = this.placeholders.map(p => ({
        id: p.id,
        value: p.value,
        label: p.label
      }));

      const filtered = values.filter(item =>
        !searchTerm || item.value.toLowerCase().includes(searchTerm.toLowerCase())
      );

      renderList(filtered, searchTerm);
    },
    renderItem: (item: MentionData) => {
      return `${item.label}`;
    }
  }
};
  

get theme() : boolean{
  const saved = localStorage.getItem('theme');
    this.isDark =
      saved === 'dark' ||
      (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);

      return this.isDark;
  }

  insertPlaceholder( placeholder: string): void {
    if (this.focusedField === 'subject') {
      this.subject += ` ${placeholder}`;
      this.subjectChange.emit(this.subject);
    } else {
      this.body += ` ${placeholder}`;
      this.bodyChange.emit(this.body);
    }
  }

    get sanitizedBody(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.body);
  }

private replacePlaceholders(template: string): string {
  return template.replace(/{{\s*([\w.]+)\s*}}/g, (_, key) => {
    if (key in this.mockData) {
      return this.mockData[key];
    } else {
      return `<span style="color:red;">{{ ${key} }}</span>`;
    }
  });
}


get previewBody(): SafeHtml {
  const replaced = this.replacePlaceholders(this.body);
  return this.sanitizer.bypassSecurityTrustHtml(replaced);
}

get previewSubject(): SafeHtml {
  const replaced = this.replacePlaceholders(this.subject);
  return this.sanitizer.bypassSecurityTrustHtml(replaced);
}

get validationErrors(): string[] {
  const errors: string[] = [];

  if (this.subject) {
    if (!this.subject.trim()) {
      errors.push('Subject is required.');
    }
  }

  if (this.body) {
    if (!this.body.trim()) {
      errors.push('Body is required.');
    }
  }


  // Check for properly formatted placeholders
  const validPlaceholders = [...this.body.matchAll(/{{\s*([\w.]+)\s*}}/g)];
  const allPlaceholders = [...this.body.matchAll(/{{[^}]*}}/g)];

  // Flag unknown variables
  for (const match of validPlaceholders) {
    const key = match[1];
    if (!(key in this.mockData)) {
      errors.push(`Unknown placeholder: {{ ${key} }}`);
    }
  }

  // Detect malformed placeholders (e.g. {{ user name }} or missing closing brace)
  const malformed = allPlaceholders.filter(p =>
    !/^\{\{\s*[\w.]+\s*\}\}$/.test(p[0])
  );

  malformed.forEach((match) => {
    errors.push(`Malformed placeholder: ${match[0]}`);
  });

  return errors;
}


}
