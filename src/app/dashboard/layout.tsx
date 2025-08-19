import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | Sakura',
  description: 'Manage your projects in the Sakura dashboard',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* The dashboard page will be rendered here */}
      {children}
    </div>
  );
}
