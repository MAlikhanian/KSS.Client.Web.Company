'use client';

import { Fragment } from 'react';
import { Container } from '@/components/common/container';
import { PageNavbar } from '@/app/page-navbar';
import { CompanyViewGuideContent } from './content';

export default function CompanyViewGuidePage() {
  return (
    <Fragment>
      <PageNavbar />
      <Container>
        <CompanyViewGuideContent />
      </Container>
    </Fragment>
  );
}
