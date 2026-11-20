import { sql } from 'drizzle-orm'
import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
  index,
} from 'drizzle-orm/sqlite-core'

// 1. users
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  fullName: text('full_name').notNull(),
  username: text('username').notNull().unique(),
  email: text('email').unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['ADMIN', 'BENDAHARA', 'KETUA'] }).notNull(),
  isActive: integer('is_active').notNull().default(1),
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
})

// 2. households
export const households = sqliteTable(
  'households',
  {
    id: text('id').primaryKey(),
    blockNumber: text('block_number').notNull(),
    headName: text('head_name').notNull(),
    phoneWa: text('phone_wa').notNull(),
    occupancyStatus: text('occupancy_status', {
      enum: ['TETAP', 'KONTRAK', 'KOSONG'],
    })
      .notNull()
      .default('TETAP'),
    isBillingActive: integer('is_billing_active').notNull().default(1),
    customRateOverride: text('custom_rate_override'),
    notes: text('notes'),
    deletedAt: text('deleted_at'),
    createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
    updatedAt: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
  },
  (table) => [
    index('idx_households_search').on(table.isBillingActive, table.occupancyStatus),
  ]
)

// 3. fee_rates
export const feeRates = sqliteTable('fee_rates', {
  id: text('id').primaryKey(),
  feeType: text('fee_type', {
    enum: ['IURAN_WAJIB', 'IURAN_KEAMANAN', 'DENDA_RONDA'],
  }).notNull(),
  amount: integer('amount').notNull(),
  effectiveFrom: text('effective_from').notNull(),
  isActive: integer('is_active').notNull().default(1),
  changeReason: text('change_reason').notNull(),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
})

// 4. app_settings
export const appSettings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedBy: text('updated_by').references(() => users.id),
  updatedAt: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
})

// 5. bills
export const bills = sqliteTable(
  'bills',
  {
    id: text('id').primaryKey(),
    householdId: text('household_id')
      .notNull()
      .references(() => households.id),
    periodYear: integer('period_year').notNull(),
    periodMonth: integer('period_month').notNull(),
    status: text('status', { enum: ['UNPAID', 'PARTIAL', 'PAID'] })
      .notNull()
      .default('UNPAID'),
    dueDate: text('due_date').notNull(),
    generatedBy: text('generated_by')
      .notNull()
      .references(() => users.id),
    createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
    updatedAt: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
  },
  (table) => [
    uniqueIndex('ux_bills_household_period').on(
      table.householdId,
      table.periodYear,
      table.periodMonth
    ),
    index('idx_bills_period_status').on(
      table.periodYear,
      table.periodMonth,
      table.status
    ),
  ]
)

// 6. bill_items
export const billItems = sqliteTable(
  'bill_items',
  {
    id: text('id').primaryKey(),
    billId: text('bill_id')
      .notNull()
      .references(() => bills.id, { onDelete: 'cascade' }),
    itemType: text('item_type', {
      enum: ['IURAN_WAJIB', 'IURAN_KEAMANAN', 'DENDA_RONDA'],
    }).notNull(),
    amountDue: integer('amount_due').notNull(),
    amountPaid: integer('amount_paid').notNull().default(0),
    status: text('status', { enum: ['UNPAID', 'PARTIAL', 'PAID'] })
      .notNull()
      .default('UNPAID'),
    overrideReason: text('override_reason'),
    fineDate: text('fine_date'),
    fineNote: text('fine_note'),
    createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
    updatedAt: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
  },
  (table) => [
    index('idx_bill_items_bill_type').on(table.billId, table.itemType, table.status),
  ]
)

// 7. cash_books
export const cashBooks = sqliteTable('cash_books', {
  id: text('id').primaryKey(),
  bookType: text('book_type', { enum: ['KAS_UMUM', 'KAS_KEAMANAN'] })
    .notNull()
    .unique(),
  name: text('name').notNull(),
  bankName: text('bank_name'),
  accountNumber: text('account_number'),
  isActive: integer('is_active').notNull().default(1),
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
})

// 8. cash_categories
export const cashCategories = sqliteTable('cash_categories', {
  id: text('id').primaryKey(),
  cashBookId: text('cash_book_id')
    .notNull()
    .references(() => cashBooks.id),
  name: text('name').notNull(),
  transactionType: text('transaction_type', { enum: ['INCOME', 'EXPENSE'] }).notNull(),
  isDefault: integer('is_default').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
})

// 9. payments
export const payments = sqliteTable('payments', {
  id: text('id').primaryKey(),
  billId: text('bill_id')
    .notNull()
    .references(() => bills.id),
  paidAmount: integer('paid_amount').notNull(),
  paymentMethod: text('payment_method', { enum: ['TUNAI', 'TRANSFER'] }).notNull(),
  receiptFileKey: text('receipt_file_key'),
  notes: text('notes'),
  isVoided: integer('is_voided').notNull().default(0),
  voidReason: text('void_reason'),
  voidedBy: text('voided_by').references(() => users.id),
  voidedAt: text('voided_at'),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
})

// 10. cash_transactions
export const cashTransactions = sqliteTable(
  'cash_transactions',
  {
    id: text('id').primaryKey(),
    cashBookId: text('cash_book_id')
      .notNull()
      .references(() => cashBooks.id),
    categoryId: text('category_id').references(() => cashCategories.id),
    transactionType: text('transaction_type', { enum: ['INCOME', 'EXPENSE'] }).notNull(),
    amount: integer('amount').notNull(),
    description: text('description').notNull(),
    transactionDate: text('transaction_date').notNull(),
    paymentId: text('payment_id').references(() => payments.id),
    receiptFileKey: text('receipt_file_key'),
    isLocked: integer('is_locked').notNull().default(0),
    status: text('status', { enum: ['POSTED', 'VOIDED'] })
      .notNull()
      .default('POSTED'),
    voidReason: text('void_reason'),
    voidedBy: text('voided_by').references(() => users.id),
    voidedAt: text('voided_at'),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
    updatedAt: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
  },
  (table) => [
    index('idx_cash_tx_book_date_status').on(
      table.cashBookId,
      table.status,
      table.transactionDate
    ),
    index('idx_cash_tx_payment_id').on(table.paymentId),
  ]
)

// 11. payment_allocations
export const paymentAllocations = sqliteTable('payment_allocations', {
  id: text('id').primaryKey(),
  paymentId: text('payment_id')
    .notNull()
    .references(() => payments.id),
  billItemId: text('bill_item_id')
    .notNull()
    .references(() => billItems.id),
  allocatedAmount: integer('allocated_amount').notNull(),
  cashBookId: text('cash_book_id')
    .notNull()
    .references(() => cashBooks.id),
  cashTransactionId: text('cash_transaction_id')
    .notNull()
    .references(() => cashTransactions.id),
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
})

// 12. audit_logs — append-only, NO updatedAt
export const auditLogs = sqliteTable(
  'audit_logs',
  {
    id: text('id').primaryKey(),
    actorUserId: text('actor_user_id')
      .notNull()
      .references(() => users.id),
    actorRole: text('actor_role').notNull(),
    module: text('module').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    action: text('action', {
      enum: ['CREATE', 'UPDATE', 'RATE_CHANGE', 'OVERRIDE', 'VOID', 'SOFT_DELETE'],
    }).notNull(),
    oldValues: text('old_values'),
    newValues: text('new_values'),
    reason: text('reason'),
    ipAddress: text('ip_address'),
    createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
  },
  (table) => [
    index('idx_audit_logs_created_module').on(
      table.createdAt,
      table.module,
      table.actorUserId
    ),
  ]
)
