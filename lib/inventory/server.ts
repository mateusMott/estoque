import { env } from "cloudflare:workers";
import type { Product, Balance } from "./types";
export function database() { if (!env.DB) throw new Error("DATABASE_UNAVAILABLE"); return env.DB; }
export async function findProduct(code: string): Promise<Product | null> {
  return database().prepare("SELECT p.* FROM products p JOIN codes c ON c.product_id = p.id WHERE c.code = ?").bind(code).first<Product>();
}
export async function productBalances(id: string) {
  const { results } = await database().prepare("SELECT location, quantity FROM balances WHERE product_id = ? AND quantity > 0 ORDER BY CASE WHEN location = 'mostruario' THEN 0 WHEN location = 'salao' THEN 1 ELSE 2 END, location").bind(id).all<Balance>();
  return results;
}
export function json(data: unknown, status = 200) { return Response.json(data,{status,headers:{"Cache-Control":"no-store"}}); }
