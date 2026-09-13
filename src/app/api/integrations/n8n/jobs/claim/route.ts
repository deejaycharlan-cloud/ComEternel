import {workerRequest} from '../../../../../../modules/integrations/worker-http';
export const runtime='nodejs';
export async function POST(request:Request){return workerRequest(request,'claim');}
