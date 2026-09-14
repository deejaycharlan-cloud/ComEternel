import ContentPage from '../contenus/page';
export const dynamic='force-dynamic';
export const metadata={title:'Contenus et livrables'};
export default async function Deliverables({searchParams}:{searchParams:Promise<{organisation?:string;canal?:string;etat?:string;projet?:string}>}){
 return ContentPage({searchParams:Promise.resolve({...await searchParams,vue:'livrables'})});
}
