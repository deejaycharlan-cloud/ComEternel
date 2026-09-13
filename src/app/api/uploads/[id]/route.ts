import {boundedBody} from '../../../../modules/production/limits';
import {NextResponse} from 'next/server';
import {getDb} from '../../../../db/client';
import {mediaService} from '../../../../modules/production/media-service';
import {CHUNK} from '../../../../modules/production/storage';
import {who,failure} from '../../../../modules/production/http';
export async function PUT(request:Request,{params}:{params:Promise<{id:string}>}){try{const actor=await who(request);const length=Number(request.headers.get('content-length'));if(!length||length>CHUNK)throw new Error();const bytes=await boundedBody(request,CHUNK);if(bytes.length>CHUNK)throw new Error();const received=await mediaService(getDb()).chunk(actor,(await params).id,Number(request.headers.get('x-offset')),bytes);return NextResponse.json({received});}catch(e){return failure(e);}}
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){try{return NextResponse.json(await mediaService(getDb()).complete(await who(request),(await params).id));}catch(e){return failure(e);}}
