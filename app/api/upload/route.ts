import { db } from '@/lib/db'
import { files } from '@/lib/db/schema'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Parse the request body as JSON
    const body = await request.json()
    const { imagekit, userId: bodyUserId } = body

    if (bodyUserId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!imagekit || !imagekit.url) {
      return NextResponse.json(
        { error: 'Invalid file upload data' },
        { status: 400 }
      )
    }

    const fileData = {
      name: imagekit.name || 'Untitled',
      path: imagekit.filePath || `/dropbox-clone/${userId}/${imagekit.name}`,
      size: imagekit.size || 0,
      type: imagekit.fileType || 'image',
      fileURL: imagekit.url,
      thumbnail: imagekit.thumbnailUrl || null,
      userID: userId,
      parentId: null, // root level by default
      isFolder: false,
      isStarred: false,
      isTrash: false,
    }

    const [newFile] = await db.insert(files).values(fileData).returning()
    return NextResponse.json(newFile, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
