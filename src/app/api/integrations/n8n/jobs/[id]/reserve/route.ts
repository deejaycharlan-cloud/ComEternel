import {workerRequest} from '../../../../../../../modules/integrations/worker-http';
export const runtime='nodejs';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){return workerRequest(request,'reserve',(await params).id);}
