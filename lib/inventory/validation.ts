import { z } from "zod";
const code = z.string().trim().min(1,"Informe o código.").max(80).regex(/^[A-Za-z0-9._/-]+$/,"Use letras, números, ponto, hífen, barra ou sublinhado no código.");
const location = z.string().refine(v => v === "mostruario" || v === "salao" || /^estoque:[^\x00-\x1f:]{1,60}$/.test(v), "Informe um local válido e a rua do estoque.");
export const operationSchema = z.object({
  requestId: z.string().uuid(), kind: z.enum(["entry", "add", "move", "remove"]),
  quantity: z.number().int().min(1,"A quantidade deve ser positiva.").max(1000000),
  productId: z.string().uuid().optional(), product: z.object({name: z.string().trim().min(2).max(160),barcode: code, gemco: code}).optional(),
  source: location.optional(), destination: location.optional(), reason: z.string().trim().max(500).optional(),
}).superRefine((v,ctx) => {
  const error = (message: string) => ctx.addIssue({code:"custom",message});
  if ((!!v.productId) === (!!v.product)) error("Informe um produto existente ou os dados do novo produto.");
  if (v.product && v.kind !== "entry") error("Novos produtos devem entrar pela caixa Armazenar.");
  if ((v.kind === "move" || v.kind === "remove") && !v.source) error("Selecione a origem.");
  if (v.kind !== "remove" && !v.destination) error("Selecione o destino.");
  if (v.kind === "move" && v.source === v.destination) error("Escolha um local diferente da origem.");
  if (v.kind === "remove" && (!v.reason || v.reason.length < 3)) error("Descreva o motivo da baixa com pelo menos 3 caracteres.");
});
export const codeSchema = code;
