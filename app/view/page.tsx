'use client';

import { Fragment } from 'react';
import { Container } from '@/components/common/container';
import { PageNavbar } from '@/app/page-navbar';
import { CompanyViewContent } from './content';

export default function CompanyViewPage() {
  return (
    <Fragment>
      <PageNavbar />
      <Container>
        <CompanyViewContent />
      </Container>
    </Fragment>
  );
}
