import {boundedBody} from '../../../modules/production/limits';
import {NextResponse} from 'next/server';
import {currentSession} from '../../../modules/identity/session';
import {getDb} from '../../../db/client';
import {mediaService,type UploadActor} from '../../../modules/production/media-service';
import {AccessError} from '../../../modules/team/service';
import {ProductionError} from '../../../modules/production/access';
import {who,failure} from '../../../modules/production/http';
export async function POST(request:Request){try{const actor=await who(request);if(Number(request.headers.get('content-length')||0)>10000)throw new Error();const data=JSON.parse((await boundedBody(request,10000)).toString());return NextResponse.json(await mediaService(getDb()).begin(actor,data));}catch(e){return failure(e);}}
