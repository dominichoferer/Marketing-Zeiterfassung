import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { COMPANIES } from '@/lib/config';

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY ist nicht konfiguriert. Bitte in den Umgebungsvariablen eintragen.' },
      { status: 503 }
    );
  }

  const { input } = await req.json();

  if (!input || typeof input !== 'string' || input.trim().length < 3) {
    return NextResponse.json({ error: 'Bitte mindestens 3 Zeichen eingeben.' }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const companiesList = COMPANIES.map((c) => `- ${c.name} (ID: ${c.id})`).join('\n');

  const systemPrompt = `Du bist ein Assistent für ein Marketing-Zeiterfassungstool.
Deine Aufgabe: Wandle Stichworte eines Mitarbeiters in einen strukturierten Zeiteintrag um.

Verfügbare Firmen:
${companiesList}

Antworte NUR mit validem JSON in diesem Format:
{
  "description": "Klare, professionelle Beschreibung der Tätigkeit (1 Satz, Deutsch)",
  "company_id": "Die Firmen-ID (z.B. SEI, ROB, HIF, CNC, VEG, EIH, SCH)",
  "duration_minutes": <Zahl: Dauer in Minuten>,
  "confidence": <Zahl 0-1: wie sicher du dir bei der Firmenzuordnung bist>
}

Regeln:
- description: Professionell formuliert, klare Tätigkeitsbeschreibung
- company_id: Basierend auf Firmennamen oder Kontext erkennen
- duration_minutes: Aus Zeitangaben extrahieren (z.B. "2h" = 120, "30min" = 30, "1,5h" = 90)
- Falls keine Dauer angegeben: duration_minutes = null
- Falls Firma unklar: confidence = 0.3 oder niedriger`;

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: input.trim() }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    // JSON aus der Antwort extrahieren
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Kein JSON in der Antwort');

    const result = JSON.parse(jsonMatch[0]);

    // Validierung
    if (!COMPANIES.find((c) => c.id === result.company_id)) {
      result.company_id = null;
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('KI-Eingabe Fehler:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `KI-Verarbeitung fehlgeschlagen: ${message}` },
      { status: 500 }
    );
  }
}
