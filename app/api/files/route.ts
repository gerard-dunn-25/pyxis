import { db } from '@/lib/db'
import { files } from '@/lib/db/schema'
import { auth } from '@clerk/nextjs/server'

import { eq, and, isNull } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Authenticate the user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: ' Unauthorized' }, { status: 401 })
    }

    // get query parameters
    const searchParams = request.nextUrl.searchParams
    const queryUserId = searchParams.get('userId')
    const parentId = searchParams.get('parentId')

    if (!queryUserId || queryUserId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // fetch files from database based on userId and parentId
    let userFiles
    if (parentId) {
      //fetch the files within a specific parent folder
      userFiles = await db
        .select()
        .from(files)
        .where(and(eq(files.userID, userId), eq(files.parentID, parentId)))
    } else {
      // fetch the files in the root folder
      userFiles = await db
        .select()
        .from(files)
        .where(and(eq(files.userID, userId), isNull(files.parentID)))
    }
    return NextResponse.json(userFiles, { status: 200 })
  } catch (error) {
    console.error('Error fetching files:', error)
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    )
  }
}
