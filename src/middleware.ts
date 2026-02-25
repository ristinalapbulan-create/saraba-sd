import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith('/admin')) {
        const adminToken = request.cookies.get('adminAuth')?.value;

        // Check if the user is authorized (verified by /login)
        if (adminToken !== 'authorized' && adminToken !== 'tabalong2026') {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }
}

export const config = {
    matcher: '/admin/:path*',
};
