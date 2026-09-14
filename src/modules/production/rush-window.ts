export type CaptureWindow={startDate:string;startAt:Date|null;status:string};
/** A capture can be deposited from its start onward, including after its end. */
export function rushWindowOpen(event:CaptureWindow,timezone:string,now=new Date()) {
 return event.status!=='cancelled' && (event.startAt ? now.getTime()>=event.startAt.getTime() : new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now)>=event.startDate);
}
