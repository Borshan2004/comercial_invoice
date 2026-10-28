import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import ChallanForm from '@/components/ChallanForm';

export const dynamic = 'force-dynamic';

export default async function NewChallanPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // Both ADMIN and USER can create and save new invoices
  return <ChallanForm currentUserRole={session.role} />;
}
