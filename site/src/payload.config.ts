import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import { Users } from './collections/Users'
import { Pages } from './collections/Pages'
import { News } from './collections/News'
import { CourtCases } from './collections/CourtCases'
const dirname = path.dirname(fileURLToPath(import.meta.url))
export default buildConfig({ secret: process.env.PAYLOAD_SECRET || '',
  admin: { user: Users.slug, importMap: { baseDir: dirname } },
  collections: [Users, Pages, News, CourtCases], editor: lexicalEditor(),
  db: postgresAdapter({ pool: { connectionString: process.env.DATABASE_URL || '' } }),
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') } })
