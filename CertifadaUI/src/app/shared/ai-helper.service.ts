import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Context } from 'ag-grid-community';

@Injectable({ providedIn: 'root' })
export class AiHelperService {
  private apiUrl = 'https://api.openai.com/v1/chat/completions';
  private apiKey = '';
 

  constructor(private http: HttpClient) {}

  getCertificateTextSuggestion(promptText: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    });

    const body = {
      model: 'gpt-3.5-turbo', 
      messages: [
        { role: "system", 
          content: "You are a helpful assistant that returns Fabric.js JSON canvas objects only." },

        {
          role: 'user', 
          content: 'You are a JSON generator for Fabric.js canvas. Only output a single valid JSON object (no explanations or extra text). The JSON should:'+
                    '- Be compatible with Fabric.js (like output from canvas.toJSON()).'+
                    '- Only use these object types: "rect", "circle", "line", "polygon", "text", and "textbox".'+
                    '- No images, paths, SVGs, or custom objects.'+
                    '- always create a frame fit the certifcate subject. the frame using rect objects.'+
                    '- Define a certificate layout: background shape, a title, a recipient placeholder, a short message, date and a signature area.'+
                    '- Text should use plain characters, centered and styled where appropriate.'+
                    '- add suitable text or paragraph that fit the certifcate subject.' + 
                    '- Assume canvas size is 800x600 unless otherwise specified.'+
                    'Based on this user request: ' + promptText + '. Now output only the JSON canvas object.',
           
        }
      ],
      temperature: 0.5
    };

    return this.http.post(this.apiUrl, body, { headers });
  }
}
