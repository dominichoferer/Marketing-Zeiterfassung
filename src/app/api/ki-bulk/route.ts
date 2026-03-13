import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { COMPANIES } from '@/lib/config';

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY ist nicht konfiguriert.' },
      { status: 503 }
    );
  }

  const body = await req.json();
  const client = new Anthropic({ apiKey });

  const companiesList = COMPANIES.map((c) => `- ${c.name} (ID: ${c.id})`).join('\n');

  const systemPrompt = `Du bist ein Assistent für ein Marketing-Zeiterfassungstool.
Extrahiere aus dem Text oder Bild mehrere Zeiteinträge und gib sie als JSON-Array zurück.

Verfügbare Firmen:
${companiesList}

Antworte NUR mit einem validen JSON-Array in diesem Format:
[
  {
    "description": "Professionelle Tätigkeitsbeschreibung (1 Satz, Deutsch)",
    "company_id": "Firmen-ID (z.B. SEI, ROB, HIF) oder null wenn unklar",
    "duration_minutes": <Zahl in Minuten oder null>,
    "date": null
  }
]

Regeln:
- Jede erkennbare Aufgabe / Zeile = ein separater Eintrag
- duration_minutes: "2h"=120, "30min"=30, "1,5h"=90, "45'"=45, "1:30"=90
- Firma aus Kontext oder Name erkennen (z.B. "ROB" oder "Robotunits" → company_id: "ROB")
- description: klar, professionell, auf Deutsch
- date: nur setzen wenn explizit erkennbar (z.B. "13.3." → "2026-03-13"), sonst null`;

  try {
    let message;

    if (body.imageBase64) {
      const mimeType = body.mimeType || 'image/png';
      message = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp',
                  data: body.imageBase64,
                },
              },
              {
                type: 'text',
                text: 'Extrahiere alle Zeiteinträge aus diesem Screenshot. Erkenne Firma, Dauer und Tätigkeit.',
              },
            ],
          },
        ],
      });
    } else {
      if (!body.text || typeof body.text !== 'string' || body.text.trim().length < 3) {
        return NextResponse.json({ error: 'Bitte mindestens 3 Zeichen eingeben.' }, { status: 400 });
      }
      message = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: body.text.trim() }],
      });
    }

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Kein JSON-Array in der Antwort gefunden');

    const entries = JSON.parse(jsonMatch[0]);

    const validated = entries.map((e: Record<string, unknown>) => ({
      ...e,
      company_id: COMPANIES.find((c) => c.id === e.company_id) ? e.company_id : null,
    }));

    return NextResponse.json({ entries: validated });
  } catch (err) {
    console.error('KI-Bulk Fehler:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `KI-Verarbeitung fehlgeschlagen: ${msg}` }, { status: 500 });
  }
}
