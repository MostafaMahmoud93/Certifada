import {
  Component,
  ElementRef,
  HostListener,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  OnInit,
} from '@angular/core';

@Component({
  selector: 'click-edit-field',
  templateUrl: './click-edit-field.html',
  styleUrls: ['./click-edit-field.scss'],
  standalone: false,
})
export class ClickEditFieldComponent implements OnInit {
  @Input() label = '';
  @Input() type: 'text' | 'number' | 'select' = 'text';
  @Input() value: any;
  @Input() options: any[] = [];
  @Input() disabled = false;
  @Input() step?: number;

  @Output() ngModelChange = new EventEmitter<any>();

  editing = false;

  constructor(private elRef: ElementRef, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cdr.detectChanges();
  }

  onEdit() {
    if (!this.disabled) this.editing = true;
  }

  onBlur() {
    this.editing = false;
    this.ngModelChange.emit(this.value);
  }

  @HostListener('focusout', ['$event'])
  onFocusOut(event: FocusEvent) {
    if (this.editing) {
      this.onBlur();
    }
  }
}
