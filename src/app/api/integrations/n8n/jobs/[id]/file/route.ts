import {workerRequest} from '../../../../../../../modules/integrations/worker-http';
export const runtime='nodejs';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){return workerRequest(request,'file',(await params).id);}
