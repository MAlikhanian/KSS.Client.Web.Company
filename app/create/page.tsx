'use client';

import { Fragment } from 'react';
import { Container } from '@/components/common/container';
import { PageNavbar } from '@/app/page-navbar';
import { CreateCompanyContent } from './content';

export default function CreateCompanyPage() {
  return (
    <Fragment>
      <PageNavbar />
      <Container>
        <CreateCompanyContent />
      </Container>
    </Fragment>
  );
}
