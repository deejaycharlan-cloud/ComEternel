import {worker} from '../../../../../../modules/integrations/direct-drive/worker';
export async function POST(request:Request){return worker(request,'claim');}
