export const config = { runtime: 'edge' };

const RESEND_KEY = process.env.RESEND_API_KEY;
const AUDIENCE_ID = 'aed503c8-e11f-446e-850f-614d533dc4a7';
const FROM = 'AURA Academia <hola@auranext.pa>';

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  let name, email;
  try {
    const body = await req.json();
    name = (body.name || '').trim();
    email = (body.email || '').trim().toLowerCase();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: 'Email inválido' }), { status: 400 });
  }

  const greeting = name ? name.split(' ')[0] : 'Hola';

  const emailHtml = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#09090E;font-family:'Helvetica Neue',Arial,sans-serif">
<div style="max-width:580px;margin:0 auto;padding:48px 32px">
  <div style="font-size:28px;font-weight:900;color:#00F5C8;letter-spacing:.06em;margin-bottom:32px">AURA</div>
  <h1 style="font-size:32px;font-weight:900;color:#fff;line-height:1.2;margin-bottom:16px">Día 1 · El mapa<br>de tu dinero</h1>
  <p style="font-size:16px;color:rgba(255,255,255,.6);line-height:1.7;margin-bottom:24px">Hola ${greeting},<br><br>Bienvenido a los 5 hábitos financieros que pueden cambiar cómo te relacionas con el dinero. Sin teoría. Sin tecnicismos. Solo lo que puedes aplicar hoy.</p>
  <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:28px 24px;margin-bottom:28px">
    <p style="font-size:13px;font-weight:700;color:#00F5C8;letter-spacing:.12em;text-transform:uppercase;margin:0 0 10px">Hábito 1 — 10 minutos de hoy</p>
    <h2 style="font-size:20px;font-weight:800;color:#fff;margin:0 0 12px">El mapa de tu dinero</h2>
    <p style="font-size:14px;color:rgba(255,255,255,.55);line-height:1.7;margin:0 0 14px">Toma papel y bolígrafo — o el bloc de notas del móvil — y escribe dos columnas:<br><br><strong style="color:#fff">Columna A · Lo que entra</strong><br>Todo ingreso del último mes: sueldo, freelance, transferencias, lo que sea.<br><br><strong style="color:#fff">Columna B · Lo que sale</strong><br>De memoria, anota los 10 gastos más frecuentes. No hace falta que sea exacto.<br><br>Suma ambas columnas. La diferencia entre A y B es tu punto de partida real.</p>
    <p style="font-size:13px;color:rgba(255,255,255,.35);font-style:italic;margin:0">La mayoría nunca ha hecho este ejercicio. El solo hecho de mirarlo cambia algo.</p>
  </div>
  <p style="font-size:14px;color:rgba(255,255,255,.45);line-height:1.7;margin-bottom:32px">Mañana llega el <strong style="color:#fff">Día 2 · La regla que cambia todo</strong>. Un porcentaje simple que reorganiza tus prioridades financieras.</p>
  <div style="border-top:1px solid rgba(255,255,255,.08);padding-top:24px;font-size:12px;color:rgba(255,255,255,.25);line-height:1.6">
    AURA Academia de Soberanía Financiera · Panamá<br>
    <a href="mailto:hola@auranext.pa" style="color:rgba(255,255,255,.35)">hola@auranext.pa</a> ·
    Para darte de baja responde a este correo con el asunto "Baja".
  </div>
</div></body></html>`;

  try {
    // 1. Enviar email Día 1
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_KEY}`,
      },
      body: JSON.stringify({
        from: FROM,
        to: email,
        subject: 'Día 1 · El mapa de tu dinero — AURA Academia',
        html: emailHtml,
      }),
    });

    if (!emailRes.ok) {
      const err = await emailRes.text();
      console.error('Resend email error:', err);
      return new Response(JSON.stringify({ error: 'Error al enviar email' }), {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    // 2. Registrar contacto en Audience (sin bloquear si falla)
    fetch(`https://api.resend.com/audiences/${AUDIENCE_ID}/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_KEY}`,
      },
      body: JSON.stringify({
        email: email,
        first_name: name.split(' ')[0] || '',
        last_name: name.split(' ').slice(1).join(' ') || '',
        unsubscribed: false,
      }),
    }).catch(e => console.error('Audience error:', e));

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (e) {
    console.error('Handler error:', e);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }
}
