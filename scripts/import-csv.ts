import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { parse } from 'csv-parse/sync'
import { readFileSync } from 'fs'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface CsvRow {
  item_name: string
  date_deleted: string
  date_raw_hebrew: string
  category_emoji: string
}

async function importCsv() {
  const csvPath = resolve(__dirname, '../sally_grocery_history.csv')
  // Remove BOM if present
  const csvContent = readFileSync(csvPath, 'utf-8').replace(/^\uFEFF/, '')

  const records: CsvRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })

  console.log(`Parsed ${records.length} rows from CSV`)

  // Build unique items catalog
  const uniqueItems = new Map<string, string>()
  for (const row of records) {
    if (!uniqueItems.has(row.item_name)) {
      uniqueItems.set(row.item_name, row.category_emoji)
    }
  }

  console.log(`Found ${uniqueItems.size} unique items`)

  // Insert items catalog
  const catalogRows = Array.from(uniqueItems.entries()).map(([name, emoji]) => ({
    name,
    category_emoji: emoji,
  }))

  const { error: catalogError } = await supabase
    .from('items_catalog')
    .upsert(catalogRows, { onConflict: 'name' })

  if (catalogError) {
    console.error('Error inserting catalog:', catalogError)
    return
  }
  console.log(`Inserted ${catalogRows.length} items into catalog`)

  // Insert purchase history
  const historyRows = records.map(row => ({
    item_name: row.item_name,
    category_emoji: row.category_emoji,
    purchased_at: row.date_deleted,
    source: 'csv_import',
  }))

  // Insert in batches of 100
  for (let i = 0; i < historyRows.length; i += 100) {
    const batch = historyRows.slice(i, i + 100)
    const { error } = await supabase
      .from('purchase_history')
      .insert(batch)

    if (error) {
      console.error(`Error inserting batch ${i}:`, error)
      return
    }
  }

  console.log(`Inserted ${historyRows.length} purchase history records`)
  console.log('Import complete!')
}

importCsv().catch(console.error)
