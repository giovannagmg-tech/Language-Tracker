/**
 * Não existe cadastro aberto. Só os e-mails desta lista recebem magic link.
 * Cada e-mail vira uma conta isolada por RLS — ninguém vê o dado de ninguém.
 */
export function emailsPermitidos(): string[] {
  return (process.env.EMAILS_PERMITIDOS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function emailPermitido(email: string): boolean {
  const permitidos = emailsPermitidos();
  if (permitidos.length === 0) return false;
  return permitidos.includes(email.trim().toLowerCase());
}
