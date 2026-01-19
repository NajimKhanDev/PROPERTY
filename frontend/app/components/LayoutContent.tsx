'use client';

import { usePathname } from 'next/navigation';
import SidebarLayout from './SidebarLayout';
import Header from './Header';

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  console.log(pathname)
  const isLoginPage = pathname === '/login/';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <>
    <SidebarLayout>
      <Header/>
      {children}
    </SidebarLayout>
    </>
  );
}