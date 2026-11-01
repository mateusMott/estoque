import { findProduct, productBalances, json } from "@/lib/inventory/server";
import { codeSchema } from "@/lib/inventory/validation";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = codeSchema.safeParse(url.searchParams.get("code"));
  if (!parsed.success) return json({ error: "Informe um código válido." }, 400);
  try {
    const product = await findProduct(parsed.data);
    if (!product) return json({ product: null, balances: [], total: 0 });
    const balances = await productBalances(product.id);
    const total = balances.reduce((sum, b) => sum + b.quantity, 0);
    // Only the entry flow can identify a registered product with zero stock.
    if (total === 0 && url.searchParams.get("mode") !== "entry")
      return json({ product: null, balances: [], total: 0 });
    return json({ product, balances, total });
  } catch {
    return json(
      { error: "Não foi possível consultar o estoque. Tente novamente." },
      503,
    );
  }
}
