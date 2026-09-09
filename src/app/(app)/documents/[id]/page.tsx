import { redirect } from "next/navigation";

interface DocumentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentDetailPage({
  params
}: DocumentDetailPageProps) {
  const { id } = await params;

  redirect(`/documents/review/${id}`);
}
