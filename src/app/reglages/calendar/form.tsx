'use client';
import {useActionState} from 'react';
import {calendarAction} from './actions';
export function CalendarForm({organizationId,operation}:{organizationId:string;operation:string}){const [state,action,pending]=useActionState(calendarAction,{message:''});return <form action={action}><input type="hidden" name="organizationId" value={organizationId}/><input type="hidden" name="operation" value={operation}/><button disabled={pending}>{operation==='disconnect'?'Arrêter la synchronisation':'Synchroniser maintenant'}</button><p role="status">{state.message}</p></form>;}
