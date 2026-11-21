import fs from 'fs'
import path from 'path'
import { beforeAll } from 'vitest'

beforeAll(() => {
  const testDbPath = path.resolve(__dirname, '../data/siwarga_test.db')
  const templateDbPath = path.resolve(__dirname, '../data/siwarga_template.db')

  if (fs.existsSync(templateDbPath)) {
    fs.copyFileSync(templateDbPath, testDbPath)
  }
})
