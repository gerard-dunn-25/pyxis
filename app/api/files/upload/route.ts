import { db } from '@/lib/db'
import { files } from '@/lib/db/schema'
import { auth } from '@clerk/nextjs/server'
import { eq, and } from 'drizzle-orm'
import ImageKit from 'imagekit'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

// Imagekit credentials
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: ' Unauthorized' }, { status: 401 })
    }

    // Parse the form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const formUserId = formData.get('userId') as string
    const parentId = (formData.get('parentId') as string) || null

    // Verify the user is uploading their own file
    if (formUserId !== userId) {
      return NextResponse.json({ error: ' Unauthorized' }, { status: 401 })
    }

    if (!file) {
      return NextResponse.json({ error: ' No file uploaded' }, { status: 400 })
    }

    // Check to see if the parentId is provided
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
          { error: 'Parent folder not found' },
          { status: 404 }
        )
      }
    }

    // Only allow image uploads
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only image files & PDF are supported' },
        { status: 400 }
      )
    }

    const buffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(buffer)

    const originalFileName = file.name
    const fileExtension = originalFileName.split('.').pop() || ''
    const uniqueFilename = `${uuidv4()}.${fileExtension}`

    const folderPath = parentId
      ? `/folders/${userId}/${parentId}`
      : `/root/${userId}`

    const uploadResponse = await imagekit.upload({
      file: fileBuffer,
      fileName: uniqueFilename,
      folder: folderPath,
      useUniqueFileName: false,
    })

    const fileData = {
      name: originalFileName,
      path: uploadResponse.filePath,
      size: file.size || 0,
      type: file.type || 'image',
      fileURL: uploadResponse.url,
      thumbnail: uploadResponse.thumbnailUrl || null,
      userID: userId,
      parentId: null, // root level by default
      isFolder: false,
      isStarred: false,
      isTrash: false,
    }

    const [newFile] = await db.insert(files).values(fileData).returning()

    return NextResponse.json(newFile, { status: 201 })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
