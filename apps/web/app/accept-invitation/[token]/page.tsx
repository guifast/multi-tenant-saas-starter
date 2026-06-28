import { AcceptInvitation } from "../../../components/accept-invitation";

export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <AcceptInvitation token={token} />;
}
