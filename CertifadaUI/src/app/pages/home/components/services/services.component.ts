import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { IconsModule } from '../../icons/icons.module';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [
    CommonModule,
    IconsModule,
    RouterLink
  ],
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss'
})
export class ServicesComponent implements
  OnInit, AfterViewInit {

  constructor() { }

  ngOnInit(): void {
  }
  ngAfterViewInit() {
  }

  serviceData = [
    {
      icon:'trending-up',
      title:'Grow Your Business',
      desc:'If the distribution of letters and words is random, the reader will not be distracted from making.'
    },
    {
      icon:'dollar-sign',
      title:'Drive More Sales',
      desc:'If the distribution of letters and words is random, the reader will not be distracted from making.'
    },
    {
      icon:'compass',
      title:'Handled By Expert',
      desc:'If the distribution of letters and words is random, the reader will not be distracted from making.'
    },
    {
      icon:'command',
      title:'Discussion For Idea',
      desc:'If the distribution of letters and words is random, the reader will not be distracted from making.'
    },
    {
      icon:'box',
      title:'Web Design',
      desc:'If the distribution of letters and words is random, the reader will not be distracted from making.'
    },
    {
      icon:'camera',
      title:'Network Security',
      desc:'If the distribution of letters and words is random, the reader will not be distracted from making.'
    },
    {
      icon:'bell',
      title:'Social Media',
      desc:'If the distribution of letters and words is random, the reader will not be distracted from making.'
    },
    {
      icon:'monitor',
      title:'Design & Branding',
      desc:'If the distribution of letters and words is random, the reader will not be distracted from making.'
    },
  ]

}