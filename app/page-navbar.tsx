'use client';

import { Navbar } from '@/partials/navbar/navbar';
import { NavbarMenu } from '@/partials/navbar/navbar-menu';
import { useSettings } from '@/providers/settings-provider';
import { Container } from '@/components/common/container';
import { useTranslatedMenu } from '@/lib/use-translated-menu';

// Sub-nav for the Companies section. Lists the same children the sidebar
// shows under `Companies` (Company Information, Access Management).
const PageNavbar = () => {
  const { settings } = useSettings();
  const { menuSidebar } = useTranslatedMenu();

  // MENU_SIDEBAR order: Dashboards(0), Systems heading(1), Members Information(2),
  //   Credit Rating(3), Persons(4), Companies(5), Market(6), …
  const companyMenuConfig = menuSidebar?.find((m) => m.title === 'شرکت‌ها' || m.title === 'Companies')?.children;

  if (companyMenuConfig && settings?.layout === 'demo1') {
    return (
      <Navbar>
        <Container>
          <NavbarMenu items={companyMenuConfig} />
        </Container>
      </Navbar>
    );
  } else {
    return <></>;
  }
};

export { PageNavbar };
