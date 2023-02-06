import type { SessionStorage } from "@shopify/shopify-app-session-storage";
import prisma from "database";
import { Session } from "@shopify/shopify-api";

const sessionTableName = "shopify_app_starter.sessions";

class SupabaseSessionStorage implements SessionStorage {
  public async storeSession(session: Session): Promise<boolean> {
    const entries = session
      .toPropertyArray()
      .map(([key, value]) =>
        key === "expires"
          ? [key, Math.floor((value as number) / 1000)]
          : [key, value]
      );

    console.log("entries: ", entries);
    return Boolean(
      await prisma.$executeRawUnsafe(
        `
        INSERT INTO ${sessionTableName}
        (${entries.map(([key]) => key).join(", ")})
        VALUES (${entries.map((_, i) => `$${i + 1}`).join(", ")})
        ON CONFLICT (id) DO UPDATE SET ${entries
          .map(([key]) => `${key} = Excluded.${key}`)
          .join(", ")};
      `,
        ...entries.map(([_key, value]) => value)
      )
    );
  }

  public async loadSession(id: string): Promise<Session | undefined> {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM ${sessionTableName} WHERE id = '${id}';`
    );
    if (!Array.isArray(rows) || rows?.length !== 1) return undefined;
    const rawResult = rows[0] as any;
    return this.databaseRowToSession(rawResult);
  }

  public async deleteSession(id: string): Promise<boolean> {
    return Boolean(
      await prisma.$executeRawUnsafe(
        `DELETE FROM ${sessionTableName} WHERE id = '${id}';`
      )
    );
  }

  public async deleteSessions(ids: string[]): Promise<boolean> {
    return Boolean(
      await prisma.$executeRawUnsafe(`DELETE FROM ${sessionTableName} WHERE id IN (${ids
        .map((id) => `'${id}'`)
        .join(", ")});
  `)
    );
  }

  public async findSessionsByShop(shop: string): Promise<Session[]> {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM ${sessionTableName} WHERE shop = '${shop}';`
    );

    if (!Array.isArray(rows) || rows?.length === 0) return [];

    const results: Session[] = rows.map((row: any) => {
      return this.databaseRowToSession(row);
    });

    return results;
  }

  private databaseRowToSession(row: any): Session {
    // convert seconds to milliseconds prior to creating Session object
    if (row.expires) row.expires *= 1000;
    return Session.fromPropertyArray(Object.entries(row));
  }
}

export default SupabaseSessionStorage;
