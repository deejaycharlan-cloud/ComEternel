export const passwordHint = 'Au moins 6 caractères, avec une minuscule, une majuscule, un chiffre et un caractère spécial (ex. : ! @ # $ %).';
export function validPassword(value: string) {
  return value.length >= 6 && value.length <= 128 && /\p{Ll}/u.test(value) && /\p{Lu}/u.test(value) && /[0-9]/.test(value) && /[^\p{L}\p{N}\s]/u.test(value);
}
