type Identity = { email: string; emailVerified: boolean };
// La création accorde des droits uniquement sur la nouvelle association.
export function canCreateTeam(user: Identity) {
  return user.emailVerified;
}
