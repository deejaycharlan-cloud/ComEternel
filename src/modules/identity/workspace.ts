import {cache} from 'react';
import {getDb} from '../../db/client';
import {currentSession} from './session';
import {workspaceSummary} from '../team/workspace-summary';
// React cache is scoped to this server render, never shared between accounts or requests.
export const currentWorkspace=cache(async()=>{
 const actor=await currentSession();
 return actor?.user.emailVerified ? workspaceSummary(getDb(),actor) : [];
});
