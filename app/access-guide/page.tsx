'use client';

import { Fragment } from 'react';
import { Container } from '@/components/common/container';
import { PageNavbar } from '@/app/page-navbar';
import { CompanyAccessGuideContent } from './content';

export default function CompanyAccessGuidePage() {
  return (
    <Fragment>
      <PageNavbar />
      <Container>
        <CompanyAccessGuideContent />
      </Container>
    </Fragment>
  );
}
