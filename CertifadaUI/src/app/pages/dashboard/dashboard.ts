import { CommonModule } from '@angular/common';
import { Component, NgModule, OnInit } from '@angular/core';
import * as echarts from 'echarts';
import { EChartsOption } from 'echarts';
import { SharedModule } from '../../shared/shared.module';
import 'echarts/theme/macarons.js';
import { Tile } from './tile-config';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

interface TableRow {
  code: string;
  name: string;
  date: string;
  owner: string;
  status: 'Approved' | 'Pending';
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',   
  standalone: false
})

export class Dashboard implements OnInit {

  activeTab: 'control' | 'statistics' = 'control';
  isDark =true; 

  tableData: TableRow[] = [
    { code: 'A102544', name: 'Participation in the annual Forum', date: '15/06/2025', owner: 'Micheal Frandy molars', status: 'Approved' },
    { code: 'A102545', name: 'Participation in the annual Forum', date: '15/06/2025', owner: 'Simposan doeti calcom', status: 'Pending' },
    { code: 'A102546', name: 'Thanks and appreciation',      date: '15/06/2025', owner: 'Micheal Frandy molars', status: 'Approved' },
    { code: 'A102547', name: 'Thanks and appreciation',      date: '15/06/2025', owner: 'Simposan doeti calcom', status: 'Approved' },
    { code: 'A102544', name: 'Participation in the annual Forum', date: '15/06/2025', owner: 'Micheal Frandy molars', status: 'Approved' },
    { code: 'A102545', name: 'Participation in the annual Forum', date: '15/06/2025', owner: 'Simposan doeti calcom', status: 'Pending' }
  ];

  lineChartOptions!: EChartsOption;
  barChartOptions!: EChartsOption;

  ngOnInit() {
    const saved = localStorage.getItem('theme');
    this.isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    this.initLineChart();
    this.initBarChart();
  }

  statusClass(status: string) {
    return {
      'bg-green-500': status === 'Approved',
      'bg-gray-300 dark:text-gray-800 dark:bg-gray-500': status === 'Pending'
    };
  }

  viewDetails(row: TableRow) {
    alert(`View details for ${row.code}`);
  }

  private initLineChart() {
    this.lineChartOptions = {
      tooltip: { trigger: 'axis' },
      toolbox: { feature: { saveAsImage: {} } },
      xAxis: {
        type: 'category',
        data: ['Dec','Nov','Oct','Sep','Aug','Jul','Jun','May','Apr','Mar','Feb','Jan'],
        boundaryGap: false
      },
      
      yAxis: { type: 'value' },
      series: [{
        data: [8200, 932, 5901, 934, 12900, 1330, 1320, 1200, 11000, 1050, 1080, 1120],
        type: 'line', smooth: true,
        lineStyle: { width: 3 },
        areaStyle: { opacity: 0.1 },
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: this.isDark ? '#6366F1' : '#4F46E5' },
            { offset: 1, color: this.isDark ? '#312E81' :  '#C7D2FE' }
          ])
        }
      }]
    };
  }

  private initBarChart() {
    this.barChartOptions = {
      xAxis: {
        type: 'category',
        data: ['Op1','Op2','Op3','Op4','Op5','Op6'],
        axisTick: { show: false }
      },
      toolbox: { feature: { saveAsImage: {} } },
      yAxis: { type: 'value', show: false },
      tooltip: { show: true },
      series: [{
        data: [120, 200, 150, 80, 70, 110],
        type: 'bar',
        barWidth: '40%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: this.isDark ? '#6366F1' : '#4F46E5' },
            { offset: 1, color: this.isDark ? '#312E81' :  '#C7D2FE' }
          ])
        }
      }]
    };
  }

    tiles: Tile[] = [
    { id: 'tile1', title: 'Tile 1', icon: 'color_lens', value: '013', dataType: 'KPI', visible: true },
    { id: 'tile2', title: 'Tile 2', icon: 'card_membership', value: '1209', dataType: 'KPI', visible: true },
    { id: 'tile3', title: 'Tile 3', icon: 'assignment_turned_in', value: '1047', dataType: 'KPI', visible: true },
  ];

  toggleTileVisibility(tileId: string) {
    const tile = this.tiles.find(t => t.id === tileId);
    if (tile) {
      tile.visible = !tile.visible;
    }
  }

  removeTile(tileId: string) {
    this.tiles = this.tiles.filter(tile => tile.id !== tileId);
  }
  


onTileDrop(event: CdkDragDrop<Tile[]>) {
  const previousIndex = this.tiles.findIndex(tile => tile === event.item.data);
  moveItemInArray(this.tiles, previousIndex, event.currentIndex);
}
}