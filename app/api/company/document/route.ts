import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import {
  listCompanyDocuments,
  addCompanyDocument,
  updateCompanyDocument,
  removeCompanyDocument,
} from '@/services/company-api';
import { getAvailableInstance, uploadFile, deleteFile } from '@/services/file-orchestrator-api';
import { apiErrorResponse } from '@/lib/api-error';

const CATEGORY = 'CompanyDocument';

// GET: List documents for a company (metadata from Company API)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const companyId = request.nextUrl.searchParams.get('companyId');
    if (!companyId) {
      return NextResponse.json({ message: 'companyId is required' }, { status: 400 });
    }

    const documents = await listCompanyDocuments(session.accessToken, companyId);
    return NextResponse.json(documents);
  } catch (error) {
    return apiErrorResponse(error, 'company/document GET');
  }
}

// POST: Upload a new document (metadata → Company API, bytes → orchestrator)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const companyId = formData.get('companyId') as string;
    const companyDocumentTypeId = Number(formData.get('companyDocumentTypeId'));
    const file = formData.get('file') as File | null;

    if (!companyId || !companyDocumentTypeId || !file) {
      return NextResponse.json(
        { message: 'companyId, companyDocumentTypeId, and file are required' },
        { status: 400 },
      );
    }

    // Step 1: reserve a storage instance for this category
    const instance = await getAvailableInstance(session.accessToken, CATEGORY);

    // Step 2: create the metadata row in Company API (returns the new GUID id)
    const docResult = await addCompanyDocument(session.accessToken, {
      companyId,
      companyDocumentTypeId,
      storageInstanceId: instance.id,
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type || 'application/octet-stream',
    });

    // Step 3: push the file bytes through the orchestrator, keyed by the new id
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await uploadFile(session.accessToken, docResult.id, CATEGORY, buffer);

    return NextResponse.json(docResult);
  } catch (error) {
    return apiErrorResponse(error, 'company/document POST');
  }
}

// PUT: Update document metadata (and optionally replace the file blob)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const id = formData.get('id') as string;
    const companyId = formData.get('companyId') as string;
    const companyDocumentTypeId = Number(formData.get('companyDocumentTypeId'));
    const file = formData.get('file') as File | null;

    if (!id || !companyId) {
      return NextResponse.json({ message: 'id and companyId are required' }, { status: 400 });
    }

    // Update metadata. FileName is sent only when a new file is uploaded — null
    // tells the backend to keep the existing name (no blanking on a type-only edit).
    await updateCompanyDocument(session.accessToken, {
      id,
      companyDocumentTypeId,
      fileName: file ? file.name : null,
    });

    // If a new file was provided, replace the blob through the orchestrator.
    if (file) {
      const docs = await listCompanyDocuments(session.accessToken, companyId);
      const doc = Array.isArray(docs)
        ? docs.find((d) => d.id.toLowerCase() === id.toLowerCase())
        : null;
      if (doc) {
        await deleteFile(session.accessToken, id, doc.storageInstanceId);
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await uploadFile(session.accessToken, id, CATEGORY, buffer);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error, 'company/document PUT');
  }
}

// DELETE: Delete a document (blob via orchestrator + metadata via Company API)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id, companyId } = await request.json();
    if (!id || !companyId) {
      return NextResponse.json({ message: 'id and companyId are required' }, { status: 400 });
    }

    // Find the row to get its storageInstanceId (needed to delete the blob).
    const docs = await listCompanyDocuments(session.accessToken, companyId);
    const doc = Array.isArray(docs)
      ? docs.find((d) => d.id.toLowerCase() === id.toLowerCase())
      : null;

    if (doc) {
      await deleteFile(session.accessToken, id, doc.storageInstanceId);
    }
    // Delete the metadata row by key (works even if the blob lookup missed).
    await removeCompanyDocument(session.accessToken, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error, 'company/document DELETE');
  }
}
