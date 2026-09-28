'use client';

import { Fragment } from 'react';
import { Container } from '@/components/common/container';
import { PageNavbar } from '@/app/page-navbar';
import { CompanyCreateGuideContent } from './content';

export default function CompanyCreateGuidePage() {
  return (
    <Fragment>
      <PageNavbar />
      <Container>
        <CompanyCreateGuideContent />
      </Container>
    </Fragment>
  );
}
