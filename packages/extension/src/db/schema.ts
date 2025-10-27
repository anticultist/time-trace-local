import { int, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export type PropertyValue = string | number;

export enum PropertyType {
  Text = 0,
  Integer = 1,
  Real = 2,
}

export const dbProperties = sqliteTable("db_properties", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull().unique(),
  type: int("type").notNull().$type<PropertyType>(),
  value: text("value", { mode: "json" }).$type<PropertyValue>().notNull(),
});

export type DbProperty = typeof dbProperties.$inferSelect;
export type NewDbProperty = typeof dbProperties.$inferInsert;

export type EventName =
  | "boot"
  | "shutdown"
  | "logon"
  | "logoff"
  | "standby_enter"
  | "standby_exit";

export const events = sqliteTable(
  "events",
  {
    id: int().primaryKey({ autoIncrement: true }),
    time: int({ mode: "timestamp" }).notNull(),
    source: text().notNull(),
    name: text().notNull().$type<EventName>(),
    details: text().notNull(),
  },
  (table) => [unique().on(table.time, table.name)]
);
