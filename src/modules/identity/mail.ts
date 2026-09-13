import nodemailer from 'nodemailer';
import { mailConfig } from '../../config/deployment';
export async function sendMail(email: string, subject: string, text: string) {
  const { local, from, ...options } = mailConfig();
  const transport = nodemailer.createTransport({ ...options, logger: false, debug: false, connectionTimeout: 10000, socketTimeout: 15000, disableFileAccess: true, disableUrlAccess: true });
  try {
    await transport.sendMail({ from, to: email, subject: local ? `[ESSAI LOCAL] ${subject}` : subject,
      text: local ? `${text}\n\nMessage de test conservé sur cet ordinateur, aucun email réellement envoyé.` : text });
  } finally { transport.close(); }
}
