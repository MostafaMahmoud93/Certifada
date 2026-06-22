import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Selection } from '../../../shared/selection';
import { CommonModule } from '@angular/common';
import { Object as FabricObject, Canvas as FabricCanvas, IText, Textbox, Image as FabricImage, Rect, Circle, Ellipse, Line} from 'fabric';
import * as fabric from 'fabric';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CanvasService } from '../../../shared/canvas-service';

@Component({
  selector: 'app-properties-panel',
  standalone : false,
  templateUrl: './properties-panel.html',
  styleUrl: './properties-panel.css'
})

export class PropertiesPanel implements OnInit {
  
  form!: FormGroup;
  private sub!: Subscription;
  selectedItem: string | null = null;
  selectedObject: FabricObject | null = null;
  fontFamilies = ['JF Flat','Arial', 'Helvetica', 'Courier New', 'Times New Roman', 'Verdana', 'Georgia', 'Comic Sans MS'];

  constructor(private fb: FormBuilder, private selection: Selection, private CanvasService:CanvasService,private cdr: ChangeDetectorRef
                      
  ) {}

  ngOnInit() {
      this.selection.selectedObject$.subscribe(obj => {
      this.selectedObject = obj;
      this.buildForm();
      });
  }
  
  private buildForm() {
      if (!this.selectedObject) {
        this.form = this.fb.group({});
        return;
      }
      
      const type = this.selectedObject.type;
      const commonControls: any = {
        left: [this.selectedObject.left],
        top: [this.selectedObject.top],
        angle: [this.selectedObject.angle],
        opacity: [this.selectedObject.opacity],
        flipX: [this.selectedObject.flipX || false],
        flipY: [this.selectedObject.flipY || false],
        lockMovementX: [this.selectedObject.lockMovementX || false],
        lockMovementY: [this.selectedObject.lockMovementY || false],
        lockRotation: [this.selectedObject.lockRotation || false],
        lockScalingX: [this.selectedObject.lockScalingX || false],
        lockScalingY: [this.selectedObject.lockScalingY || false],
        selectable: [this.selectedObject.selectable || true]
      };

      if (type === 'textbox' || type === 'i-text' || type === 'text' || type === 'Text') {
        const txt = this.selectedObject as Textbox | IText | fabric.Text;
        this.form = this.fb.group({
          ...commonControls,
          text: [txt.text],
          fontFamily: [txt.fontFamily],
          fontSize: [txt.fontSize],
          fontWeight: [txt.fontWeight],
          fontStyle: [txt.fontStyle],
          textAlign: [txt.textAlign],
          lineHeight: [txt.lineHeight],
          charSpacing: [txt.charSpacing],
          underline: [txt.underline || false],
          linethrough: [txt.linethrough || false],
          overline: [txt.overline || false],
          fill: [txt.fill],
          stroke: [txt.stroke],
          strokeWidth: [txt.strokeWidth],
          strokeDashArray: [Array.isArray(txt.strokeDashArray) ? txt.strokeDashArray.join(',') : ''],
          backgroundColor: [txt.backgroundColor || ''],
          shadowColor: [txt.shadow?.color || '#000000'],
          shadowOffsetX: [txt.shadow?.offsetX || 0],
          shadowOffsetY: [txt.shadow?.offsetY || 0],
          shadowBlur: [txt.shadow?.blur || 0]
        });
      } else if (type === 'image') {
        const img = this.selectedObject as FabricImage;
        this.form = this.fb.group({
          ...commonControls,
          width: [img.width! * img.scaleX!],
          height: [img.height! * img.scaleY!],
          lockAspectRatio: [true],
          opacity: [img.opacity],
          angle: [img.angle],
          flipX: [img.flipX || false],
          flipY: [img.flipY || false],
          shadowColor: [img.shadow?.color || '#000000'],
          shadowOffsetX: [img.shadow?.offsetX || 0],
          shadowOffsetY: [img.shadow?.offsetY || 0],
          shadowBlur: [img.shadow?.blur || 0]
        });
      } else if (this.isShape(this.selectedObject)) {
        const obj = this.selectedObject as any;
        const shapeControls: any = {
          fill: [obj.fill],
          stroke: [obj.stroke],
          strokeWidth: [obj.strokeWidth],
          strokeDashArray: [Array.isArray(obj.strokeDashArray) ? obj.strokeDashArray.join(',') : ''],
          opacity: [obj.opacity],
          angle: [obj.angle],
          shadowColor: [obj.shadow?.color || '#000000'],
          shadowOffsetX: [obj.shadow?.offsetX || 0],
          shadowOffsetY: [obj.shadow?.offsetY || 0],
          shadowBlur: [obj.shadow?.blur || 0]
        };
        if (type === 'rect') {
          const rect = obj as Rect;
          this.form = this.fb.group({
            ...commonControls,
            ...shapeControls,
            rx: [rect.rx || 0]
          });
        } else {
          this.form = this.fb.group({
            ...commonControls,
            ...shapeControls
          });
        }
      } else {
        this.form = this.fb.group({});
      }
            this.cdr.detectChanges();

      this.form.valueChanges.subscribe(values => this.applyChanges(values));
  }

  private applyChanges(values: any) {
      if (!this.selectedObject) return;
      const obj = this.selectedObject;
      const type = obj.type;

      // Common transforms
      obj.set({
        //left: values.left,
        //top: values.top,
        angle: values.angle,
        opacity: values.opacity,
        flipX: values.flipX,
        flipY: values.flipY,
        lockMovementX: values.lockMovementX,
        lockMovementY: values.lockMovementY,
        lockRotation: values.lockRotation,
        lockScalingX: values.lockScalingX,
        lockScalingY: values.lockScalingY,
        selectable: values.selectable
      });

      if (type === 'textbox' || type === 'i-text'  || type === 'text' || type === 'Text') {
        const txt = obj as Textbox | IText;
        txt.set({
          text: values.text,
          fontFamily: values.fontFamily,
          fontSize: values.fontSize,
          fontWeight: values.fontWeight,
          fontStyle: values.fontStyle,
          textAlign: values.textAlign,
          lineHeight: values.lineHeight,
          charSpacing: values.charSpacing,
          underline: values.underline,
          linethrough: values.linethrough,
          overline: values.overline,
          fill: values.fill,
          stroke: values.stroke,
          strokeWidth: values.strokeWidth,
          strokeDashArray: values.strokeDashArray.split(',').map((n: string) => parseFloat(n)) || [],
          backgroundColor: values.backgroundColor || '',
          shadow: new fabric.Shadow({
            color: values.shadowColor,
            offsetX: values.shadowOffsetX,
            offsetY: values.shadowOffsetY,
            blur: values.shadowBlur
          })
        });
      } else if (type === 'image') {
        const img = obj as FabricImage;
        if (values.lockAspectRatio) {
          const ratio = (img.width! / img.height!);
          img.scaleX = values.width / img.width!;
          img.scaleY = img.scaleX;
        } else {
          img.scaleX = values.width / img.width!;
          img.scaleY = values.height / img.height!;
        }
        img.set({
          opacity: values.opacity,
          angle: values.angle,
          flipX: values.flipX,
          flipY: values.flipY,
          shadow: new fabric.Shadow({
            color: values.shadowColor,
            offsetX: values.shadowOffsetX,
            offsetY: values.shadowOffsetY,
            blur: values.shadowBlur
          })
        });
      } else if (this.isShape(obj)) {
        obj.set({
          fill: values.fill,
          stroke: values.stroke,
          strokeWidth: values.strokeWidth,
          strokeDashArray: values.strokeDashArray.split(',').map((n: string) => parseFloat(n)) || [],
          opacity: values.opacity,
          angle: values.angle,
          shadow: new fabric.Shadow({
            color: values.shadowColor,
            offsetX: values.shadowOffsetX,
            offsetY: values.shadowOffsetY,
            blur: values.shadowBlur
          })
        });
        if (type === 'rect') {
          const rect = obj as Rect;
          rect.set({ rx: values.rx, ry: values.rx });
        }
      }

      obj.canvas?.requestRenderAll();

    }

  isShape(obj: FabricObject | null): boolean {
      if (!obj) return false;
      return [
        'rect', 'circle', 'triangle', 'ellipse', 'line', 'pentagon', 'hexagon', 'star', 
        'roundedRect', 'arrow', 'cross', 'heart', 'parallelogram', 'trapezoid', 'moon', 
        'diamond', 'cloud', 'capsule', 'ring', 'chevron', 'arrowDown', 'arrowUp', 'rightTriangle', 
        'frame', 'paths', 'polygon', 'path', 'polyline',
      ].includes(obj.type);
  }

  ngOnDestroy() {
      this.sub.unsubscribe();
  }

}
