/* global HTMLRewriter */
/**
 * Vista previa de la página pública del médico (/dr/:slug) - CITAMED.VE
 *
 * WhatsApp, Facebook y otras apps no ejecutan JavaScript: leen las etiquetas <meta> del HTML.
 * Esta función de Cloudflare Pages entrega la misma página de siempre, pero con el nombre,
 * la especialidad y la foto del médico en esas etiquetas, para que el enlace se vea como una tarjeta.
 * Si el servidor no responde a tiempo, se entrega una vista previa genérica de CitaMed.
 */

const DEFAULT_IMAGE_PATH = '/icons/icon-512.png';

function apiBase(env, url) {
  if (env.VITE_API_URL) return env.VITE_API_URL.replace(/\/$/, '');
  if (url.hostname.endsWith('citamedve.app')) return 'https://api.citamedve.app/api';
  return 'https://citamed-api.onrender.com/api';
}

function escapeAttr(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function fetchDoctor(env, url, slug) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(`${apiBase(env, url)}/public/doctors/${encodeURIComponent(slug)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.success ? body.data : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function buildMeta(doctor, pageUrl, origin) {
  if (!doctor) {
    return {
      title: 'CitaMed | Agenda tu cita médica',
      description: 'Encuentra a tu médico y agenda tu cita en línea con CitaMed.',
      image: origin + DEFAULT_IMAGE_PATH,
      url: pageUrl
    };
  }
  const specialty = doctor.specialty?.name;
  const place = [doctor.clinicName, doctor.city].filter(Boolean).join(', ');
  const title = specialty ? `${doctor.name} | ${specialty}` : doctor.name;
  const description = [
    specialty ? `${specialty}.` : null,
    place ? `${place}.` : null,
    'Agenda tu cita en línea con CitaMed.'
  ].filter(Boolean).join(' ');
  return {
    title,
    description,
    image: doctor.profilePhoto || origin + DEFAULT_IMAGE_PATH,
    url: pageUrl
  };
}

export async function onRequest(context) {
  const { request, env, params, next } = context;
  const url = new URL(request.url);
  const page = await next();
  const contentType = page.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return page;

  const doctor = await fetchDoctor(env, url, params.slug);
  const meta = buildMeta(doctor, url.origin + url.pathname, url.origin);
  const tags = [
    ['property', 'og:type', 'profile'],
    ['property', 'og:site_name', 'CitaMed'],
    ['property', 'og:title', meta.title],
    ['property', 'og:description', meta.description],
    ['property', 'og:image', meta.image],
    ['property', 'og:url', meta.url],
    ['name', 'description', meta.description],
    ['name', 'twitter:card', 'summary']
  ].map(([attr, key, value]) => `<meta ${attr}="${key}" content="${escapeAttr(value)}">`).join('');

  return new HTMLRewriter()
    .on('title', { element(el) { el.setInnerContent(meta.title); } })
    .on('head', { element(el) { el.append(tags, { html: true }); } })
    .transform(page);
}
