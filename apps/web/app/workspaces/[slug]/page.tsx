import { SaasConsole } from "../../../features/saas-console";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <SaasConsole initialSlug={slug} />;
}
