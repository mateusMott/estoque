import { database, json } from "@/lib/inventory/server";
import { streetSchema } from "@/lib/inventory/streets";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const { results } = await database()
      .prepare("SELECT name, floor FROM streets ORDER BY name COLLATE NOCASE")
      .all();
    return json({ streets: results });
  } catch {
    return json(
      { error: "Não foi possível carregar as ruas. Tente novamente." },
      503,
    );
  }
}
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (
    (origin && origin !== new URL(request.url).origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return json({ error: "Origem não permitida." }, 403);
  if (!request.headers.get("content-type")?.includes("application/json"))
    return json({ error: "Envie JSON." }, 415);
  const raw = await request.text();
  if (raw.length > 2000)
    return json({ error: "Solicitação muito grande." }, 413);
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    return json({ error: "Solicitação inválida." }, 400);
  }
  const parsed = streetSchema.safeParse(value);
  if (!parsed.success)
    return json({ error: parsed.error.issues[0].message }, 400);
  try {
    await database()
      .prepare("INSERT INTO streets (name,floor) VALUES (?,?)")
      .bind(parsed.data.name, parsed.data.floor || null)
      .run();
    return json(
      { street: { name: parsed.data.name, floor: parsed.data.floor || null } },
      201,
    );
  } catch (error) {
    if (String(error).includes("UNIQUE constraint"))
      return json(
        {
          error:
            "Esta rua já está cadastrada. Use outro nome para identificar uma rua diferente.",
        },
        409,
      );
    return json(
      { error: "Não foi possível cadastrar a rua. Tente novamente." },
      503,
    );
  }
}
