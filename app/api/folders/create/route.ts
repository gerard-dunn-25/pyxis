import { db } from '@/lib/db'
import { files } from '@/lib/db/schema'
import { auth } from '@clerk/nextjs/server'
import { eq, and } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: ' Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const { name, userId: bodyUserId, parentId = null } = body

    if (bodyUserId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid folder name' },
        { status: 400 }
      )
    }

    // Check if parent folder exists if parentId is provided

    if (parentId) {
      const [parentFolder] = await db
        .select()
        .from(files)
        .where(
          and(
            eq(files.id, parentId),
            eq(files.userID, userId),
            eq(files.isFolder, true)
          )
        )

      if (!parentFolder) {
        return NextResponse.json(
          { error: 'Parent folder not found or unauthorized' },
          { status: 404 }
        )
      }
    }

    // Create the folder
    const folderData = {
      id: uuidv4(),
      name: name.trim(),
      path: `/folders/${userId}/${uuidv4()}`,
      size: 0,
      type: 'folder',
      fileURL: '',
      thumbnailUrl: null,
      userID: userId,
      parentId,
      isFolder: true,
      isStarred: false,
      isTrash: false,
    }

    const [newFolder] = await db.insert(files).values(folderData).returning()

    return NextResponse.json({
      success: true,
      message: 'Folder created successfully',
      folder: newFolder,
    })
  } catch (error) {
    console.error('Error creating folder:', error)
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    )
  }
}
