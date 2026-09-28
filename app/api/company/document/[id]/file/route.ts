import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { listCompanyDocuments } from '@/services/company-api';
import { downloadFile } from '@/services/file-orchestrator-api';

// GET: Download a file by document id (bytes streamed through the orchestrator)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const companyId = request.nextUrl.searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ message: 'companyId query param is required' }, { status: 400 });
    }

    // Resolve document metadata (storageInstanceId + contentType) from Company API.
    const docs = await listCompanyDocuments(session.accessToken, companyId);
    const doc = Array.isArray(docs)
      ? docs.find((d) => d.id.toLowerCase() === id.toLowerCase())
      : null;

    if (!doc) {
      return NextResponse.json({ message: 'Document not found' }, { status: 404 });
    }

    // Download the bytes through the orchestrator (base64 → Buffer).
    const fileDataBase64 = await downloadFile(session.accessToken, id, doc.storageInstanceId);
    if (!fileDataBase64) {
      return NextResponse.json({ message: 'File not found' }, { status: 404 });
    }

    const buffer = Buffer.from(fileDataBase64, 'base64');

    // inline for browser-viewable types, attachment otherwise.
    const viewableTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf'];
    const disposition = viewableTypes.includes(doc.contentType)
      ? `inline; filename="${encodeURIComponent(doc.fileName)}"`
      : `attachment; filename="${encodeURIComponent(doc.fileName)}"`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': doc.contentType || 'application/octet-stream',
        'Content-Disposition': disposition,
        'Content-Length': String(buffer.length),
      },
    });
  } catch (error) {
    console.error('Error downloading company document file:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Something went wrong.' },
      { status: 500 },
    );
  }
}
