import { ResetForm } from './reset-form';
export default async function Page({searchParams}:{searchParams:Promise<{token?:string}>}){return <ResetForm token={(await searchParams).token||''}/>;}
