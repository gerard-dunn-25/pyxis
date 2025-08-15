# Droply - Step by Step Guide

This guide will walk you through recreating the Droply project, a file storage application built with Next.js, Clerk, Neon PostgreSQL, Drizzle ORM, and HeroUI.

## Prerequisites

Before starting, make sure you have the following:

- Node.js 18+ and npm
- A Clerk account for authentication
- A Neon PostgreSQL database
- An ImageKit account for file storage

## Step 1: Project Setup

1. Create a new Next.js project:

```bash
npx create-next-app@latest droply
cd droply
```

2. When prompted, choose the following options:
   - TypeScript: Yes
   - ESLint: Yes
   - Tailwind CSS: Yes
   - App Router: Yes
   - Import alias: Yes (default: @/*)

## Step 2: Install Dependencies

Install the required dependencies:

```bash
npm install @clerk/nextjs @heroui/avatar @heroui/badge @heroui/button @heroui/card @heroui/code @heroui/divider @heroui/dropdown @heroui/input @heroui/kbd @heroui/link @heroui/listbox @heroui/modal @heroui/navbar @heroui/progress @heroui/snippet @heroui/spinner @heroui/switch @heroui/system @heroui/table @heroui/tabs @heroui/theme @heroui/toast @heroui/tooltip @hookform/resolvers @neondatabase/serverless @react-aria/ssr @react-aria/visually-hidden axios clsx date-fns dotenv drizzle-orm framer-motion imagekit imagekitio-next intl-messageformat lucide-react next-themes react-hook-form uuid
```

Install dev dependencies:

```bash
npm install -D @next/eslint-plugin-next @react-types/shared @tailwindcss/postcss @types/node @types/react @types/react-dom @types/uuid @typescript-eslint/eslint-plugin @typescript-eslint/parser autoprefixer drizzle-kit eslint eslint-config-next eslint-config-prettier eslint-plugin-import eslint-plugin-jsx-a11y eslint-plugin-node eslint-plugin-prettier eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-unused-imports postcss prettier tailwind-variants tailwindcss tsx typescript
```

## Step 3: Configure Environment Variables

1. Create a `.env.example` file in the root directory:

```
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# ImageKit
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Fallback URLs
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database - Neon PostgreSQL
DATABASE_URL=your_neon_database_url
```

2. Create a `.env.local` file with your actual credentials.

## Step 4: Configure Tailwind CSS

Update `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

## Step 5: Set Up Database Schema with Drizzle

1. Create `drizzle.config.ts` in the root directory:

```typescript
import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || "",
  },
  verbose: true,
  strict: true,
} satisfies Config;
```

2. Create database schema in `lib/db/schema.ts`:

```typescript
/**
 * Database Schema for Droply
 *
 * This file defines the database structure for our Droply application.
 * We're using Drizzle ORM with PostgreSQL (via Neon) for our database.
 */

import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Files Table
 *
 * This table stores all files and folders in our Droply.
 * - Both files and folders are stored in the same table
 * - Folders are identified by the isFolder flag
 * - Files/folders can be nested using the parentId (creating a tree structure)
 */
export const files = pgTable("files", {
  // Unique identifier for each file/folder
  id: uuid("id").defaultRandom().primaryKey(),

  // Basic file/folder information
  name: text("name").notNull(),
  path: text("path").notNull(), // Full path to the file/folder
  size: integer("size").notNull(), // Size in bytes (0 for folders)
  type: text("type").notNull(), // MIME type for files, "folder" for folders

  // Storage information
  fileUrl: text("file_url").notNull(), // URL to access the file
  thumbnailUrl: text("thumbnail_url"), // Optional thumbnail for images/documents

  // Ownership and hierarchy
  userId: text("user_id").notNull(), // Owner of the file/folder
  parentId: uuid("parent_id"), // Parent folder ID (null for root items)

  // File/folder flags
  isFolder: boolean("is_folder").default(false).notNull(), // Whether this is a folder
  isStarred: boolean("is_starred").default(false).notNull(), // Starred/favorite items
  isTrash: boolean("is_trash").default(false).notNull(), // Items in trash

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * File Relations
 *
 * This defines the relationships between records in our files table:
 * 1. parent - Each file/folder can have one parent folder
 * 2. children - Each folder can have many child files/folders
 *
 * This creates a hierarchical file structure similar to a real filesystem.
 */
export const filesRelations = relations(files, ({ one, many }) => ({
  // Relationship to parent folder
  parent: one(files, {
    fields: [files.parentId], // The foreign key in this table
    references: [files.id], // The primary key in the parent table
  }),

  // Relationship to child files/folders
  children: many(files),
}));

/**
 * Type Definitions
 *
 * These types help with TypeScript integration:
 * - File: Type for retrieving file data from the database
 * - NewFile: Type for inserting new file data into the database
 */
export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
```

3. Create database connection in `lib/db/index.ts`:

```typescript
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Configure Neon to use WebSockets
neonConfig.fetchConnectionCache = true;

// Create a SQL client with the connection string
const sql = neon(process.env.DATABASE_URL!);

// Create a Drizzle client with the SQL client and schema
export const db = drizzle(sql, { schema });
```

4. Create migration script in `lib/db/migrate.ts`:

```typescript
import { migrate } from "drizzle-orm/neon-http/migrator";
import { db } from "./index";

// This script will run all migrations in the drizzle directory
async function main() {
  console.log("Running migrations...");
  
  try {
    await migrate(db, { migrationsFolder: "drizzle" });
    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();
```

5. Add utility functions in `lib/utils.ts`:

```typescript
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
```

## Step 6: Configure Clerk Authentication

1. Create a middleware.ts file in the root directory:

```typescript
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: [
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/imagekit-auth",
  ],
  
  // Routes that can be accessed by authenticated users or via an API key
  ignoredRoutes: [
    "/api/webhooks(.*)",
  ],
});

export const config = {
  // Protects all routes, including api/trpc.
  // See https://clerk.com/docs/references/nextjs/auth-middleware
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

## Step 7: Create App Layout and Providers

1. Create `app/providers.tsx`:

```tsx
"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { ToastProvider } from "@heroui/toast";
import { SSRProvider } from "@react-aria/ssr";
import { VisuallyHidden } from "@react-aria/visually-hidden";
import { useRouter } from "next/navigation";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  const router = useRouter();

  return (
    <SSRProvider>
      <ClerkProvider
        appearance={{
          variables: {
            colorPrimary: "#0070f3",
          },
        }}
        navigate={(to) => router.push(to)}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={true}
          themes={["light", "dark"]}
        >
          <ToastProvider>
            <VisuallyHidden>
              <h1>Droply - Simple File Storage</h1>
            </VisuallyHidden>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </ClerkProvider>
    </SSRProvider>
  );
}
```

2. Create `app/layout.tsx`:

```tsx
import "./globals.css";
import type { Metadata } from "next";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Droply - Simple File Storage",
  description: "A simple file storage application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

## Step 8: Create Components

Create the following components in the `components` directory:

1. Navbar.tsx
2. DashboardContent.tsx
3. FileUploadForm.tsx
4. FileList.tsx
5. FileIcon.tsx
6. FileActions.tsx
7. FileActionButtons.tsx
8. FileEmptyState.tsx
9. FileLoadingState.tsx
10. FileTabs.tsx
11. FolderNavigation.tsx
12. UserProfile.tsx
13. ConfirmationModal.tsx (in components/ui directory)

## Step 9: Create API Routes

Create the following API routes:

1. `app/api/files/upload/route.ts` - For file uploads
2. `app/api/files/route.ts` - For fetching files
3. `app/api/files/[id]/star/route.ts` - For starring/unstarring files
4. `app/api/files/[id]/trash/route.ts` - For moving files to trash
5. `app/api/files/[id]/delete/route.ts` - For permanently deleting files
6. `app/api/folders/create/route.ts` - For creating folders
7. `app/api/imagekit-auth/route.ts` - For ImageKit authentication

## Step 10: Create Pages

1. Create `app/page.tsx` - Landing page
2. Create `app/dashboard/page.tsx` - Dashboard page
3. Create `app/sign-in/[[...sign-in]]/page.tsx` - Sign in page
4. Create `app/sign-up/[[...sign-up]]/page.tsx` - Sign up page
5. Create `app/error.tsx` - Error page

## Step 11: Initialize the Database

Run the database migrations:

```bash
npm run db:generate
npm run db:push
```

## Step 12: Run the Application

Start the development server:

```bash
npm run dev
```

Visit http://localhost:3000 to see your application.

## Step 13: Build for Production

When you're ready to deploy:

```bash
npm run build
npm start
```

## Additional Notes

- Make sure to set up your Clerk, Neon, and ImageKit accounts properly
- Update the environment variables with your actual credentials
- The application uses HeroUI components for the UI
- File uploads are handled by ImageKit
- Authentication is handled by Clerk
- Database operations are handled by Drizzle ORM with Neon PostgreSQL