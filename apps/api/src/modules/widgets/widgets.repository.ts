import { eq } from "drizzle-orm";
import type { Database } from "../../db/client.js";
import { widgets } from "../../db/schema.js";

export type WidgetRow = typeof widgets.$inferSelect;
export type NewWidgetRow = typeof widgets.$inferInsert;
export type WidgetPatch = Partial<
  Pick<WidgetRow, "title" | "content" | "chartConfig" | "datasetId">
>;

export interface WidgetRepository {
  listWidgets(): Promise<WidgetRow[]>;
  getWidget(id: string): Promise<WidgetRow | null>;
  createWidget(input: NewWidgetRow): Promise<WidgetRow>;
  updateWidget(id: string, patch: WidgetPatch): Promise<WidgetRow | null>;
  deleteWidget(id: string): Promise<boolean>;
}

export function createWidgetRepository(db: Database): WidgetRepository {
  return {
    listWidgets: () => db.select().from(widgets).orderBy(widgets.position),
    getWidget: async (id) => {
      const [widget] = await db
        .select()
        .from(widgets)
        .where(eq(widgets.id, id))
        .limit(1);
      return widget ?? null;
    },
    createWidget: async (input) => {
      const [widget] = await db.insert(widgets).values(input).returning();
      if (!widget) throw new Error("Widget insert returned no row");
      return widget;
    },
    updateWidget: async (id, patch) => {
      const [widget] = await db
        .update(widgets)
        .set(patch)
        .where(eq(widgets.id, id))
        .returning();
      return widget ?? null;
    },
    deleteWidget: async (id) => {
      const deleted = await db
        .delete(widgets)
        .where(eq(widgets.id, id))
        .returning({ id: widgets.id });
      return deleted.length > 0;
    },
  };
}