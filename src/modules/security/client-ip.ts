import {isIP} from 'node:net';
// Only trust an address supplied by our configured hosting platform, never a
// client-supplied forwarding header on a directly exposed local server.
export function clientIp(headers:Headers,vercel=process.env.VERCEL==='1'){
 const candidate=vercel?(headers.get('x-vercel-forwarded-for')||headers.get('x-forwarded-for')||'').split(',')[0].trim():'';
 return isIP(candidate)?candidate:'127.0.0.1';
}
