import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

export const prizes = pgTable('prizes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  totalQty: integer('total_qty').notNull(),
  remainingQty: integer('remaining_qty').notNull(),
  weight: integer('weight').notNull().default(1),
  color: text('color').notNull(),
  isWinning: boolean('is_winning').notNull().default(true),
});

export const spinLogs = pgTable(
  'spin_logs',
  {
    id: serial('id').primaryKey(),
    macAddress: text('mac_address').notNull().unique(),
    ipAddress: text('ip_address').notNull(),
    deviceToken: text('device_token').notNull(),
    prizeId: integer('prize_id')
      .notNull()
      .references(() => prizes.id),
    redeemCode: text('redeem_code').notNull().unique(),
    isRedeemed: boolean('is_redeemed').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_spin_logs_mac').on(table.macAddress),
    index('idx_spin_logs_device_token').on(table.deviceToken),
  ]
);

// Types
export type Prize = typeof prizes.$inferSelect;
export type SpinLog = typeof spinLogs.$inferSelect;
