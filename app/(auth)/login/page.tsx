import { FormularioLogin } from "./formulario";

const MENSAGENS: Record<string, string> = {
  link_invalido: "O link não veio completo. Peça outro.",
  link_expirado: "Esse link já foi usado ou expirou. Peça outro.",
  sem_acesso: "Esse e-mail não tem acesso a este app.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  return <FormularioLogin erroInicial={erro ? MENSAGENS[erro] : undefined} />;
}
