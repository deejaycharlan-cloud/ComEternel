import {z} from 'zod';
export function actionComment(value:string,required:boolean,fallback:string) {
 const text=z.string().trim().max(1000).parse(value);
 if(required)return z.string().min(5,'Expliquez cette action en au moins 5 caractères.').parse(text);
 return text||fallback;
}
