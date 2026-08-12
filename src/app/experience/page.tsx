import { redirect } from 'next/navigation';

export default function ExperiencePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const table = searchParams?.table || searchParams?.meja || '1';
  redirect(`/?table=${table}`);
}
