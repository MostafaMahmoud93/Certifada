import { Component, OnInit } from '@angular/core';
import { CanvasService } from '../../../shared/canvas-service';
import type { Canvas as FabricCanvas, Object as FabricObject } from 'fabric';
import * as fabric from 'fabric';
import { ActiveSelection } from 'fabric';

@Component({
  selector: 'app-footer-toolbar',
  standalone : false,
  templateUrl: './footer-toolbar.html',
  styleUrl: './footer-toolbar.css'
})

export class FooterToolbar implements OnInit {
  private canvas: fabric.Canvas | null = null;
  constructor(private canvasService: CanvasService) {}

  ngOnInit() {
    this.canvasService.canvas$.subscribe(c => (this.canvas = c));
  }

   get hasSelection(): boolean {
    if (!this.canvas) return false;
    const activeObjs = this.canvas.getActiveObjects();
    return activeObjs.length > 0;
  }

  alignLeft() {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObjects();
    if (active.length === 1) {
      const obj = active[0];
      // place left edge at x=0: adjust for origin (objects default originX='center')
      const halfW = obj.getScaledWidth() / 2;
      obj.set({ originX: 'center', left: halfW });
    } else {
      // multiple: align their left edges to the minimal left among centers, then shift so edges match
      const leftEdges = active.map(o => o.left! - o.getScaledWidth() / 2);
      const minEdge = Math.min(...leftEdges);
      active.forEach(o => {
        const halfW = o.getScaledWidth() / 2;
        o.set({ originX: 'center', left: minEdge + halfW });
      });
    }
    this.canvas.requestRenderAll();
    this.reselect(active);
  }

  alignRight() {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObjects();
    const canvasW = this.canvas.getWidth();
    if (active.length === 1) {
      const obj = active[0];
      const halfW = obj.getScaledWidth() / 2;
      obj.set({ originX: 'center', left: canvasW - halfW });
    } else {
      // find max right‐edge among selected
      const rightEdges = active.map(o => o.left! + o.getScaledWidth() / 2);
      const maxEdge = Math.max(...rightEdges);
      active.forEach(o => {
        const halfW = o.getScaledWidth() / 2;
        o.set({ originX: 'center', left: maxEdge - halfW });
      });
    }
    this.canvas.requestRenderAll();
    this.reselect(active);
  }

  alignTop() {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObjects();
    if (active.length === 1) {
      const obj = active[0];
      const halfH = obj.getScaledHeight() / 2;
      obj.set({ originY: 'center', top: halfH });
    } else {
      const topEdges = active.map(o => o.top! - o.getScaledHeight() / 2);
      const minEdge = Math.min(...topEdges);
      active.forEach(o => {
        const halfH = o.getScaledHeight() / 2;
        o.set({ originY: 'center', top: minEdge + halfH });
      });
    }
    this.canvas.requestRenderAll();
    this.reselect(active);
  }

  alignBottom() {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObjects();
    const canvasH = this.canvas.getHeight();
    if (active.length === 1) {
      const obj = active[0];
      const halfH = obj.getScaledHeight() / 2;
      obj.set({ originY: 'center', top: canvasH - halfH });
    } else {
      const bottomEdges = active.map(o => o.top! + o.getScaledHeight() / 2);
      const maxEdge = Math.max(...bottomEdges);
      active.forEach(o => {
        const halfH = o.getScaledHeight() / 2;
        o.set({ originY: 'center', top: maxEdge - halfH });
      });
    }
    this.canvas.requestRenderAll();
    this.reselect(active);
  }

  alignCenterVertically() {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObjects();
    const canvasH = this.canvas.getHeight();
    if (active.length === 1) {
      const obj = active[0];
      const halfH = obj.getScaledHeight() / 2;
      obj.set({ originY: 'center', top: canvasH / 2 });
    } else {
      // center to average centerY of all objects
      const centerYs = active.map(o => o.top!); // already center coords
      const avgCenterY = centerYs.reduce((a, b) => a + b, 0) / centerYs.length;
      active.forEach(o => {
        o.set({ originY: 'center', top: avgCenterY });
      });
    }
    this.canvas.requestRenderAll();
    this.reselect(active);
  }

  alignCenterHorizontally() {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObjects();
    const canvasW = this.canvas.getWidth();
    if (active.length === 1) {
      const obj = active[0];
      const halfW = obj.getScaledWidth() / 2;
      obj.set({ originX: 'center', left: canvasW / 2 });
    } else {
      const centerXs = active.map(o => o.left!); // already center coords
      const avgCenterX = centerXs.reduce((a, b) => a + b, 0) / centerXs.length;
      active.forEach(o => {
        o.set({ originX: 'center', left: avgCenterX });
      });
    }
    this.canvas.requestRenderAll();
    this.reselect(active);
  }

  private reselect(objs: FabricObject[]) {
    if (!this.canvas) return;
    this.canvas.discardActiveObject();
    const newSel = new ActiveSelection(objs, { canvas: this.canvas });
    this.canvas.setActiveObject(newSel);
    this.canvas.requestRenderAll();
  }

}