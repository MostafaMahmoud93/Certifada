import {
  Component,
  OnInit,
  OnDestroy 
} from '@angular/core';
import { Subscription } from 'rxjs';
import { CanvasService } from '../../../shared/canvas-service';
import { Object as FabricObject, Canvas as FabricCanvas } from 'fabric';
import { CommonModule } from '@angular/common';
import * as fabric from 'fabric';

interface Layer {
  name: string;
  obj: FabricObject;
  visible: boolean;
  locked: boolean;
}

@Component({
  selector: 'app-layers-panel',
  standalone : false,
  templateUrl: './layers-panel.html',
  styleUrls: ['./layers-panel.css']
})

export class LayersPanel implements OnInit, OnDestroy {
  private canvas!: fabric.Canvas;
  objects: FabricObject[] = [];
  layers: Layer[] = [];
  selectedLayerIndex: number | null = null;
  private canvasSub!: Subscription;
  private canvasEventSubs: Subscription[] = [];

  constructor(private canvasService: CanvasService) {}

  ngOnInit() {
    this.canvasSub = this.canvasService.canvas$.subscribe((c: FabricCanvas | null) => {
      if (c && !this.canvas) {
        this.canvas = c;
        this.canvas.preserveObjectStacking = true;

        this.hookCanvasEvents();
        this.updateObjectList();
      }
    });
  }

  hoverObject(obj: FabricObject) {
    this.canvasService.hoverObject(obj);
  }

  resetHoverObject(obj: FabricObject) {
  this.canvasService.resetHoverObject(obj);
}

  startEditing(index: number) {
    this.selectedLayerIndex = index;
  }

  stopEditing() {
    this.selectedLayerIndex = null;
  }

  saveText(index: number, newText: string) {
    console.log('saveText', index);
    this.objects[index].type = newText;
    this.stopEditing();
  }
    
  ngOnDestroy() {
    this.canvasSub.unsubscribe();
    this.canvasEventSubs.forEach(s => s.unsubscribe());
  }

  private hookCanvasEvents() {
    this.canvas.on('object:added', () => {
      this.updateObjectList();
    });

    this.canvas.on('object:removed', () => {
      this.updateObjectList();
    });

    const eventsTeardown = new Subscription(() => {
      this.canvas.off('object:added');
      this.canvas.off('object:removed');
    });

    this.canvasEventSubs.push(eventsTeardown);
  }

  private updateObjectList() {
    // Grab all objects from the canvas, reverse so topmost is first
   // this.objects = this.canvas.getObjects().slice().reverse();

    this.objects = this.canvas
  .getObjects()
  .filter(obj => !(obj as any).isGridLine)
  .reverse();
  }

  toggleVisibility(obj: FabricObject) {
    obj.visible = !obj.visible;
    this.canvas.requestRenderAll();
  }

  toggleLock(obj: FabricObject) {
    obj.selectable = !obj.selectable;
    obj.evented    = obj.selectable;
    this.canvas.requestRenderAll();
  }

  bringForward(obj: FabricObject) {
    this.canvas.bringObjectForward(obj);    
    this.canvas.requestRenderAll();
  }

  sendBackward(obj: FabricObject) {
    this.canvas.sendObjectBackwards(obj);   
    this.canvas.requestRenderAll();
  }

  bringToFront(obj: FabricObject) {
    this.canvas.bringObjectToFront(obj);    
    this.canvas.requestRenderAll();
  }

  sendToBack(obj: FabricObject) {
    this.canvas.sendObjectToBack(obj);      
    this.canvas.requestRenderAll();
  }

}
