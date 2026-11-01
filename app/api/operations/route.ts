import { database, json } from "@/lib/inventory/server";
import { operationSchema } from "@/lib/inventory/validation";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get("sec-fetch-site") === "cross-site") return json({error:"Origem não permitida."},403);
  if (!request.headers.get("content-type")?.includes("application/json")) return json({error:"Envie JSON."},415);
  const raw = await request.text();
  if (raw.length > 5000) return json({error:"Solicitação muito grande."},413);
  let input; try { input = JSON.parse(raw); } catch { return json({error:"Solicitação inválida."},400); }
  const parsed = operationSchema.safeParse(input);
  if (!parsed.success) return json({error:parsed.error.issues[0].message},400);
  const op = parsed.data;
  const payload = JSON.stringify(op);
  try {
    const db = database();
    const previous = await db.prepare("SELECT payload FROM operations WHERE id = ?").bind(op.requestId).first<{payload:string}>();
    if (previous) return previous.payload === payload ? json({ok:true,replayed:true}) : json({error:"Esta confirmação já foi usada. Reabra a operação."},409);
    const productId = op.productId || crypto.randomUUID();
    const statements: D1PreparedStatement[] = [];
    if (op.product) {
      statements.push(db.prepare("INSERT INTO products (id,name,barcode,gemco) VALUES (?,?,?,?)").bind(productId,op.product.name,op.product.barcode,op.product.gemco));
      for (const code of new Set([op.product.barcode,op.product.gemco])) statements.push(db.prepare("INSERT INTO codes (code,product_id) VALUES (?,?)").bind(code,productId));
    } else if (!await db.prepare("SELECT id FROM products WHERE id = ?").bind(productId).first()) return json({error:"Produto não encontrado. Use Armazenar."},404);
    statements.push(db.prepare("INSERT INTO operations (id,product_id,kind,quantity,source,destination,reason,payload) VALUES (?,?,?,?,?,?,?,?)").bind(op.requestId,productId,op.kind,op.quantity,op.source??null,op.destination??null,op.reason??null,payload));
    // D1 batch + triggers: the journal and all balance changes commit atomically.
    await db.batch(statements);
    return json({ok:true},201);
  } catch (error) {
    const message = String(error);
    // A concurrent retry may have succeeded while the second request was waiting.
    try { const existing = await database().prepare("SELECT payload FROM operations WHERE id = ?").bind(op.requestId).first<{payload:string}>(); if(existing?.payload === payload) return json({ok:true,replayed:true}); } catch {}
    if (message.includes("INSUFFICIENT_STOCK")) return json({error:"Quantidade indisponível neste local. Atualize a pesquisa e tente novamente."},409);
    if (message.includes("ZERO_STOCK")) return json({error:"O estoque deste produto zerou. Registre a nova entrada pela caixa Armazenar."},409);
    if (message.includes("UNIQUE constraint")) return json({error:"Um dos códigos já pertence a um produto. Volte à identificação e consulte o código cadastrado."},409);
    if (message.includes("CHECK constraint")) return json({error:"A quantidade excede o limite permitido."},400);
    return json({error:"Não foi possível confirmar. Tente novamente; a mesma confirmação não duplica o estoque."},503);
  }
}
