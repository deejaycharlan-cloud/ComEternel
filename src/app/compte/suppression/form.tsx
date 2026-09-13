'use client';
import {useActionState} from 'react';
import {deletionAction} from './actions';
export function DeletionForm({children,operation,org}:{children:React.ReactNode;operation:string;org?:string}){const [state,action,pending]=useActionState(deletionAction,{message:''});return <form action={action}><input type="hidden" name="operation" value={operation}/>{org&&<input type="hidden" name="organizationId" value={org}/>}<fieldset className="form-body" disabled={pending}>{children}</fieldset><p role="status">{pending?'Enregistrement…':state.message}</p></form>;}
