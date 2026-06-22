import { CommonModule } from '@angular/common';
import { Component, NgModule, OnInit ,ElementRef, ViewChild} from '@angular/core';
import { FormsModule }  from '@angular/forms';
import { Router } from '@angular/router';
import { TemplatePreview } from '../template-preview/template-preview';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { actions } from '../../../shared/constants/actions.constant';

interface Card {
  id: number;
  title: string;
  subtitle: string;
  Created: Date;
  CreatedBy: string;
  Branch: string;
}

@Component({
  selector: 'app-templates',
  templateUrl: './templates.html',
  standalone: false
  
})  
export class templates implements OnInit {
   @ViewChild('cardContainer') cardContainer!: ElementRef;
actions = actions;
  viewMode: 'grid' | 'list' = 'grid';
  activeCardIndex: number | null = null;
  showFormPanel = false; 
  isEditMode = false; 
  selectedCardIndex: number | null = null;
  searchTerm = '';
  templates: any[] = [];

  cardForm: Partial<Card> = {
    title: '',
    subtitle: '',
    CreatedBy: '',
    Branch: ''
  };

  cards: Card[] = [
    {id: 1, title: 'Thanks Templates',subtitle: 'for school work',Created: new Date(),CreatedBy: 'Bilal Hemdulla',Branch: 'IT' },
    {id:2, title: 'Trainging Sessions',subtitle: 'go for it...',Created: new Date(),CreatedBy: 'Bilal Hemdulla',Branch: 'IT' },
    {id:3, title: 'HR Cycle 2025',subtitle: 'annual thing',Created: new Date(),CreatedBy: 'Bilal Hemdulla',Branch: 'IT' },
  ];

    constructor(private router: Router,private dialog: MatDialog, private sanitizer: DomSanitizer,
    ) { }
  

    ngOnInit() {

   

  }

  get filteredCards(): Card[] {
    const term = this.searchTerm.toLowerCase();
    return this.cards.filter(c =>
      c.title.toLowerCase().includes(term)
    );
  }

  navigateToCanvas() {
    this.router.navigate(['/canvas']);
  } 

  toggleView() {
  this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
}


  toggleCardActions(index: number): void {
    this.activeCardIndex = this.activeCardIndex === index ? null : index;
  }

   openCreateForm() {
    this.isEditMode = false;
    this.cardForm = {
      title: '',
      subtitle: '',
      CreatedBy: '',
      Branch: ''
    };
    this.showFormPanel = true;
  }

  openEditForm(card: Card, index: number) {
    this.isEditMode = true;
    this.selectedCardIndex = index;
    this.cardForm = { ...card }; // clone the data
    this.showFormPanel = true;
  }

  saveCard() {
    if (this.isEditMode && this.selectedCardIndex !== null) {
      this.cards[this.selectedCardIndex] = {
        ...this.cardForm,
        id: this.cards[this.selectedCardIndex].id,
        CreatedBy: this.cards[this.selectedCardIndex].CreatedBy,
        Branch: this.cards[this.selectedCardIndex].Branch,
        title: this.cards[this.selectedCardIndex].title,
        subtitle: this.cards[this.selectedCardIndex].subtitle  
      } as Card;
    } else {
      const newCard: Card = {
        ...(this.cardForm as Card),
        id: Date.now(),
        Created: new Date()
      };
      this.cards.push(newCard);
     //this.router.navigate(['/canvas']);

    }

    this.closeForm();
  }

  closeForm() {
    this.showFormPanel = false;
    this.selectedCardIndex = null;
  }

  openCanvasPreview(card: Card) {

   const storedTemplates = localStorage.getItem('templates');
    if (storedTemplates) {
      this.templates = JSON.parse(storedTemplates);
    }

  const saved = this.templates[0]?.image;

  if (saved) {
    this.dialog.open(TemplatePreview, {
      width: '500px',
      data: {
        image: this.sanitizer.bypassSecurityTrustUrl(saved),
        value1: card.title,
        value2: card.Branch,
        value3:  card.CreatedBy,
        value4: 45,
        label1: 'Template Name: ',
        label2: 'Branch Name: ',
        label3: 'Created By: ',
        label4: 'Credintials: '
      }
    });
  }
  }


  exportToExcel(cards: any[]) {
  const exportData = cards.map(card => ({
    Title: card.title,
    Subtitle: card.subtitle,
    Created: new Date(card.Created).toLocaleDateString(),
    CreatedBy: card.CreatedBy
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = { Sheets: { 'Cards': worksheet }, SheetNames: ['Cards'] };
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  FileSaver.saveAs(blob, 'cards-export.xlsx');
}

 exportCardsToPDF() {
    const data = this.cardContainer.nativeElement;

    html2canvas(data, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#fff'
    }).then(canvas => {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const margin = 15; // mm
      const headerHeight = 20;
      const footerHeight = 15;

      const imgWidth = pdfWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const imgData = canvas.toDataURL('image/png');

      // Add header
      pdf.setFontSize(16);
      pdf.text('Certificates Templates', margin, 12);
      pdf.setFontSize(10);
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, pdfWidth - margin - 40, 12);

      // Add image content below header
      const contentStartY = headerHeight + 5;

      pdf.addImage(imgData, 'PNG', margin, contentStartY, imgWidth, imgHeight);

      // Add footer
      pdf.setFontSize(10);
      pdf.text('Company Name – Confidential', margin, pdfHeight - 10);
      pdf.text(`Page 1 of 1`, pdfWidth - margin - 30, pdfHeight - 10);

      pdf.save('cards-export.pdf');
    });
  }
}