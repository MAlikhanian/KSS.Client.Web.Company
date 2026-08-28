import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import {
  getCompanyContact,
  addCompanyEmail,
  updateCompanyEmail,
  deleteCompanyEmail,
  addCompanyPhone,
  updateCompanyPhone,
  deleteCompanyPhone,
  addCompanyAddress,
  updateCompanyAddress,
  deleteCompanyAddress,
  addCompanyWebsite,
  updateCompanyWebsite,
  deleteCompanyWebsite,
} from '@/services/company-api';
import { apiErrorResponse } from '@/lib/api-error';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const contacts = await getCompanyContact(session.accessToken, id);
    return NextResponse.json(contacts);
  } catch (error: unknown) {
    console.error('Error fetching contacts:', error);
    return apiErrorResponse(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { type, ...data } = body;

    let result;
    switch (type) {
      case 'email':
        result = await addCompanyEmail(session.accessToken, id, data);
        break;
      case 'phone':
        result = await addCompanyPhone(session.accessToken, id, data);
        break;
      case 'address':
        result = await addCompanyAddress(session.accessToken, id, data);
        break;
      case 'website':
        result = await addCompanyWebsite(session.accessToken, id, data);
        break;
      default:
        return NextResponse.json({ message: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error('Error adding contact:', error);
    return apiErrorResponse(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await params;
    const body = await req.json();
    const { type, itemId, ...data } = body;

    if (!type || !itemId) {
      return NextResponse.json({ message: 'type and itemId required' }, { status: 400 });
    }

    let result;
    switch (type) {
      case 'email':
        result = await updateCompanyEmail(session.accessToken, itemId, data);
        break;
      case 'phone':
        result = await updateCompanyPhone(session.accessToken, itemId, data);
        break;
      case 'address':
        result = await updateCompanyAddress(session.accessToken, itemId, data);
        break;
      case 'website':
        result = await updateCompanyWebsite(session.accessToken, itemId, data);
        break;
      default:
        return NextResponse.json({ message: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error updating contact:', error);
    return apiErrorResponse(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await params;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const itemId = searchParams.get('itemId');

    if (!type || !itemId) {
      return NextResponse.json({ message: 'type and itemId required' }, { status: 400 });
    }

    switch (type) {
      case 'email':
        await deleteCompanyEmail(session.accessToken, itemId);
        break;
      case 'phone':
        await deleteCompanyPhone(session.accessToken, itemId);
        break;
      case 'address':
        await deleteCompanyAddress(session.accessToken, itemId);
        break;
      case 'website':
        await deleteCompanyWebsite(session.accessToken, itemId);
        break;
      default:
        return NextResponse.json({ message: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting contact:', error);
    return apiErrorResponse(error);
  }
}
