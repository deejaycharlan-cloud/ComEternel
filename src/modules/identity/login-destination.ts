/** Only invitation acceptance may interrupt the normal return to the home page. */
export function loginDestination(value:string) {
 if(/^\/invitations\?token=[\w-]{43}$/.test(value)||value==='/invitations')return value;
 const workspace=/^\/(?:equipe|reglages)\?organisation=([a-f0-9-]{36})$/.exec(value);
 return workspace?`/?organisation=${workspace[1]}`:'/';
}
