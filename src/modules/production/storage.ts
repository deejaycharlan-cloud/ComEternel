import {S3Client,PutObjectCommand,GetObjectCommand,DeleteObjectCommand} from '@aws-sdk/client-s3';
import { mkdir,readFile,writeFile,rename,rm } from 'node:fs/promises';
import path from 'node:path';
import {ProductionError} from './access';
import {randomUUID,createHash} from 'node:crypto';
export function hash(data:string|Uint8Array){return createHash('sha256').update(data).digest('hex');}
export function storageRoot(){return path.resolve(/* turbopackIgnore: true */ process.env.PRIVATE_STORAGE_PATH||'.private-media');}
function target(key:string){if(!/^[a-zA-Z0-9/_-]+$/.test(key)||key.includes('..'))throw new Error('Clé de stockage invalide');return path.join(/* turbopackIgnore: true */ storageRoot(),key);}
function s3(){return new S3Client({region:process.env.S3_REGION||'us-east-1',endpoint:process.env.S3_ENDPOINT||undefined,forcePathStyle:process.env.S3_FORCE_PATH_STYLE==='true'});}
export function assertUploadStorage(){if(process.env.VERCEL&&process.env.STORAGE_DRIVER!=='s3')throw new ProductionError('Le stockage des fichiers n’est pas encore connecté sur le serveur. Contactez l’administrateur ; votre fichier reste sur votre appareil.');if(process.env.STORAGE_DRIVER==='s3'&&!process.env.S3_BUCKET)throw new ProductionError('Le dossier de stockage des fichiers n’est pas configuré sur le serveur. Contactez l’administrateur.');}
export async function store(key:string,bytes:Uint8Array){assertUploadStorage();if(process.env.STORAGE_DRIVER==='s3'){target(key);if(!process.env.S3_BUCKET)throw new Error('Stockage S3 non configuré');await s3().send(new PutObjectCommand({Bucket:process.env.S3_BUCKET,Key:key,Body:bytes,ContentType:'application/octet-stream'}));return;}const p=target(key);await mkdir(path.dirname(p),{recursive:true,mode:0o700});const temp=`${p}-${randomUUID()}`;await writeFile(temp,bytes,{mode:0o600,flag:'wx'});await rename(temp,p);}
export async function read(key:string){if(process.env.STORAGE_DRIVER==='s3'){target(key);if(!process.env.S3_BUCKET)throw new Error('Stockage S3 non configuré');const object=await s3().send(new GetObjectCommand({Bucket:process.env.S3_BUCKET,Key:key}));if(!object.Body)throw new Error('Fichier manquant');return Buffer.from(await object.Body.transformToByteArray());}return readFile(/* turbopackIgnore: true */ target(key));}
export const MAX_FILE=100*1024*1024,CHUNK=2*1024*1024;
export function detected(bytes:Buffer){if(bytes.subarray(0,3).equals(Buffer.from([255,216,255])))return 'image/jpeg';if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'image/png';if(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP')return 'image/webp';if(bytes.toString('ascii',4,8)==='ftyp')return 'video/mp4';if(bytes.toString('ascii',0,5)==='%PDF-')return 'application/pdf';return null;}

export async function removeStored(key:string){const p=target(key);if(process.env.STORAGE_DRIVER==='s3'){if(!process.env.S3_BUCKET)throw new Error('Stockage absent');await s3().send(new DeleteObjectCommand({Bucket:process.env.S3_BUCKET,Key:key}));}else await rm(p,{force:true});}
