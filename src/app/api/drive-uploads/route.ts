export const maxDuration=60;
import {getDb} from '../../../db/client';
import {who,failure} from '../../../modules/production/http';
import {boundedBody} from '../../../modules/production/limits';
import {directDriveService} from '../../../modules/integrations/direct-drive/service';
export async function POST(request:Request){try{const actor=await who(request);const input=JSON.parse((await boundedBody(request,12000)).toString());return Response.json(await directDriveService(getDb()).begin(actor,input),{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
