'use client';

import { Fragment } from 'react';
import { Container } from '@/components/common/container';
import { PageNavbar } from '@/app/page-navbar';
import { CompanyAccessContent } from './content';

export default function CompanyAccessPage() {
  return (
    <Fragment>
      <PageNavbar />
      <Container>
        <CompanyAccessContent />
      </Container>
    </Fragment>
  );
}
