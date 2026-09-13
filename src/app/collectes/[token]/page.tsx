import {GuestUpload} from '../../../components/guest-upload';
export const metadata={title:'Dépôt invité',robots:{index:false,follow:false},referrer:'no-referrer' as const};
export default async function Page({params}:{params:Promise<{token:string}>}){return <GuestUpload token={(await params).token}/>;}
