import { redirect } from "next/navigation";

export default function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const token = searchParams.token as string | undefined;

  if (token) {
    redirect(`/license-renewal?token=${encodeURIComponent(token)}`);
  } else {
    redirect("/license-renewal");
  }
}
