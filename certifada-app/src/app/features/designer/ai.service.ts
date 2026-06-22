import { Injectable } from '@angular/core';
import { TemplateItem } from './fabric-canvas.service';

export type AiProvider = 'anthropic' | 'openai' | 'custom';

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  model: string;
  url: string;
}

/** A full design the AI produced, ready to hand to FabricCanvasService.applyTemplate(). */
export interface DesignSpec {
  name: string;
  width: number;
  height: number;
  bg: string;
  items: TemplateItem[];
}

const STORAGE_KEY = 'cf-ai-config';
const DEFAULTS: Record<AiProvider, string> = {
  anthropic: 'claude-sonnet-4-6',
  openai: 'gpt-4o',
  custom: '',
};

const SYSTEM_PROMPT = `You are a design generator for "Certifada", an app for certificates, cards, social posts, invoices and similar documents.
The user describes a design; you reply with ONLY a JSON object (no prose, no markdown code fences) describing the layout.

Coordinate system: (0,0) is the TOP-LEFT of the canvas. Every element is positioned by its CENTER point (x, y) in pixels.

JSON schema:
{
  "name": string,                       // short title for the design
  "width": number, "height": number,    // canvas size in px (e.g. 1123x794 = A4 landscape, 1080x1080 = Instagram, 794x1123 = A4 portrait, 1050x600 = business card)
  "bg": string,                         // background colour as hex, e.g. "#ffffff"
  "items": [
    {
      "kind": "text" | "field" | "line" | "rect",
      "text": string,                   // kind "text": literal text. Use \\n for line breaks.
      "key": string,                    // kind "field": a variable name using letters/digits/underscore only (e.g. name, date, course, signature1, email). Rendered as {{key}} and filled per recipient. Do NOT include braces.
      "x": number, "y": number,         // CENTER position in px
      "w": number, "h": number,         // width (text wrap / rect width / line length) and height (rect)
      "fontSize": number,
      "fill": string,                   // hex colour
      "fontFamily": "Inter" | "Playfair Display",
      "fontWeight": "400" | "600" | "700" | "800",
      "align": "left" | "center" | "right",
      "stroke": string,                 // hex, for rect borders and lines
      "strokeWidth": number,
      "rx": number                      // corner radius for rounded rects
    }
  ]
}

Rules:
- Output ONLY the JSON object — no explanation and no \`\`\` fences.
- Use "field" items (with a "key") for any value that changes per recipient: name, date, course, signature1, email, etc.
- Keep every element fully inside the canvas bounds, with comfortable margins.
- Use a rect with only "stroke" (no fill) for borders; a rect with "fill" for colour bands or buttons. List filled rects BEFORE the text that sits on top of them.
- Choose tasteful colours, clear hierarchy and good spacing. Headings large and bold; body text smaller and muted.
- For certificates include: a title, a recipient name field, supporting line(s), and date + signature areas with labels.`;

@Injectable({ providedIn: 'root' })
export class AiService {
  getConfig(): AiConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const c = JSON.parse(raw) as Partial<AiConfig>;
        const provider = (c.provider as AiProvider) || 'anthropic';
        return {
          provider,
          apiKey: c.apiKey || '',
          model: c.model || DEFAULTS[provider],
          url: c.url || '',
        };
      }
    } catch {
      /* ignore corrupt config */
    }
    return { provider: 'anthropic', apiKey: '', model: DEFAULTS.anthropic, url: '' };
  }

  setConfig(c: AiConfig): void {
    const model = c.model?.trim() || DEFAULTS[c.provider];
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...c, model }));
  }

  /** Ask the configured LLM for a design and return a validated DesignSpec. */
  async generateTemplate(prompt: string, width?: number, height?: number): Promise<DesignSpec> {
    const cfg = this.getConfig();
    const user =
      `Design request: ${prompt}\n\n` +
      `Current canvas is ${width || 1123}x${height || 794} px — keep this size unless the request implies a more suitable one.`;

    let raw = '';
    if (cfg.provider === 'anthropic') {
      if (!cfg.apiKey) throw new Error('Add your Anthropic API key in AI settings.');
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': cfg.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: cfg.model || DEFAULTS.anthropic,
          max_tokens: 3000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: user }],
        }),
      });
      if (!res.ok) throw new Error(await this.errText(res));
      const j = await res.json();
      raw = j?.content?.[0]?.text ?? '';
    } else if (cfg.provider === 'openai') {
      if (!cfg.apiKey) throw new Error('Add your OpenAI API key in AI settings.');
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${cfg.apiKey}` },
        body: JSON.stringify({
          model: cfg.model || DEFAULTS.openai,
          temperature: 0.7,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: user },
          ],
        }),
      });
      if (!res.ok) throw new Error(await this.errText(res));
      const j = await res.json();
      raw = j?.choices?.[0]?.message?.content ?? '';
    } else {
      if (!cfg.url) throw new Error('Set your endpoint URL in AI settings.');
      const res = await fetch(cfg.url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(cfg.apiKey ? { authorization: `Bearer ${cfg.apiKey}` } : {}) },
        body: JSON.stringify({ prompt, width, height, system: SYSTEM_PROMPT }),
      });
      if (!res.ok) throw new Error(await this.errText(res));
      const j = await res.json();
      raw = typeof j === 'string' ? j : j?.text ?? JSON.stringify(j);
    }

    return this.toSpec(this.extractJson(raw));
  }

  private extractJson(s: string): any {
    let t = (s || '').trim();
    t = t.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    const a = t.indexOf('{');
    const b = t.lastIndexOf('}');
    if (a >= 0 && b > a) t = t.slice(a, b + 1);
    try {
      return JSON.parse(t);
    } catch {
      throw new Error('The AI reply was not valid JSON. Try rephrasing your request.');
    }
  }

  private toSpec(o: any): DesignSpec {
    if (!o || !Array.isArray(o.items)) throw new Error('The AI did not return a valid design.');
    const items: TemplateItem[] = o.items.filter(
      (it: any) =>
        it &&
        typeof it.x === 'number' &&
        typeof it.y === 'number' &&
        ['text', 'field', 'line', 'rect'].includes(it.kind),
    );
    if (!items.length) throw new Error('The AI returned no usable elements. Try again.');
    const width = Math.max(50, Math.min(5000, Math.round(o.width) || 1123));
    const height = Math.max(50, Math.min(5000, Math.round(o.height) || 794));
    return {
      name: typeof o.name === 'string' && o.name.trim() ? o.name.trim() : 'AI design',
      width,
      height,
      bg: typeof o.bg === 'string' ? o.bg : '#ffffff',
      items,
    };
  }

  private async errText(res: Response): Promise<string> {
    let m = '';
    try {
      const j = await res.json();
      m = j?.error?.message || j?.message || JSON.stringify(j);
    } catch {
      try {
        m = await res.text();
      } catch {
        /* ignore */
      }
    }
    return `AI request failed (${res.status}). ${m || ''}`.trim();
  }
}
