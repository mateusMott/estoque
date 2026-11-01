import { env } from "cloudflare:workers";
import type { Product, Balance } from "./types";
export function database() {
  if (!env.DB) throw new Error("DATABASE_UNAVAILABLE");
  return env.DB;
}
export async function findProduct(code: string): Promise<Product | null> {
  return database()
    .prepare(
      "SELECT p.* FROM products p JOIN codes c ON c.product_id = p.id WHERE c.code = ?",
    )
    .bind(code)
    .first<Product>();
}
export async function productBalances(id: string) {
  const { results } = await database()
    .prepare(
      "SELECT b.location, b.quantity, s.floor FROM balances b LEFT JOIN streets s ON b.location = 'estoque:' || s.name WHERE b.product_id = ? AND b.quantity > 0 ORDER BY CASE WHEN b.location = 'mostruario' THEN 0 WHEN b.location = 'salao' THEN 1 ELSE 2 END, b.location",
    )
    .bind(id)
    .all<Balance>();
  return results;
}
export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
