import {
  pgTable,
  text,
  uuid,
  integer,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const files = pgTable('files', {
  id: uuid('id').primaryKey().defaultRandom(),

  //basic file / folder info
  name: text('name').notNull(),
  path: text('path').notNull(), // /document/project/file.txt
  size: integer('size').notNull(),
  type: text('type').notNull(), // file or folder

  // storage info
  fileURL: text('file_url').notNull(), // url to access the file
  thumbnailURL: text('thumbnail_url'), // url to access the thumbnail

  // Ownership info
  userID: text('user_id').notNull(), // user who uploaded the file
  parentID: uuid('parent_id'), // parent folder id (null if root folder)

  // Boolean flags (file / folder flags)
  isFolder: boolean('is_folder').notNull().default(false), // true if folder
  isStarred: boolean('is_starred').notNull().default(false), // true if starred
  isTrash: boolean('is_trash').notNull().default(false), // true if in trash

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(), // timestamp of creation
  updatedAt: timestamp('updated_at').notNull().defaultNow(), // timestamp of last update
})

export const filesRelations = relations(files, ({ one, many }) => ({
  // Each file can have one parent folder
  parent: one(files, {
    fields: [files.parentID],
    references: [files.id],
  }),
  // Each file can have many children files
  children: many(files),
}))

// Type definitions
export const File = typeof files.$inferSelect
export const NewFile = typeof files.$inferInsert
