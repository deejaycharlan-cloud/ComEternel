import {boundedBody,requestLimit} from '../../../modules/production/limits';
import {NextResponse} from 'next/server';
import {getDb} from '../../../db/client';
import {mediaService} from '../../../modules/production/media-service';
export async function POST(r:Request){try{await requestLimit(r,'collection-access',20);if(r.headers.get('origin')&&r.headers.get('origin')!==new URL(r.url).origin)throw new Error();const {token,code}=JSON.parse((await boundedBody(r,2000)).toString());return NextResponse.json(await mediaService(getDb()).guest(String(token),String(code||'')),{headers:{'Cache-Control':'no-store'}});}catch{return NextResponse.json({error:'Lien expiré, révoqué ou code incorrect.'},{status:403});}}
