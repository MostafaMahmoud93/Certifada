import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { tns } from 'tiny-slider/src/tiny-slider';

@Component({
  selector: 'app-client',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client.component.html',
  styleUrl: './client.component.scss'
})
export class ClientComponent {
  slider: any;

  ngAfterViewInit() {
    const sliderContainer = document.querySelector('.tiny-three-item');
    if (sliderContainer) {
      this.slider = tns({
        container: '.tiny-three-item',
        controls: false,
        mouseDrag: true,
        loop: true,
        rewind: true,
        autoplay: true,
        autoplayButtonOutput: false,
        autoplayTimeout: 3000,
        navPosition: "bottom",
        speed: 400,
        gutter: 12,
        responsive: {
            992: {
                items: 3
            },

            767: {
                items: 2
            },

            320: {
                items: 1
            },
        },
      });
    }
  }

  clientData = [
    {
      desc:'" It seems that only fragments of the original text remain in the Lorem Ipsum texts used today. "',
      image:'assets/team/01.jpg',
      name:'Calvin Carlo',
      title:'Manager'
    },
    {
      desc:'" The most well-known dummy text is the Lorem Ipsum, which is said to have originated in the 16th century. "',
      image:'assets/team/02.jpg',
      name:'Christa Smith',
      title:'Manager'
    },
    {
      desc:'" One disadvantage of Lorum Ipsum is that in Latin certain letters appear more frequently than others "',
      image:'assets/team/03.jpg',
      name:'Jemina CLone',
      title:'Manager'
    },
    {
      desc:'" Thus, Lorem Ipsum has only limited suitability as a visual filler for German texts "',
      image:'assets/team/04.jpg',
      name:'Smith Vodka',
      title:'Manager'
    },
    {
      desc:'"There is now an abundance of readable dummy texts. These are usually used when a text is required"',
      image:'assets/team/05.jpg',
      name:'Cristino Murfi',
      title:'Manager'
    },
    {
      desc:'"According to most sources, Lorum Ipsum can be traced back to a text composed by Cicero"',
      image:'assets/team/06.jpg',
      name:'Cristino Murfi',
      title:'Manager'
    },
  ]

}
