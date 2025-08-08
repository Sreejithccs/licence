import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const token = params.token as string | undefined;

  if (token) {
    redirect(`/license-renewal?token=${encodeURIComponent(token)}`);
  } else {
    redirect("/license-renewal");
  }
}
