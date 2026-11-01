import { z } from "zod";

export function normalizeStreet(name: string) {
  return name.normalize("NFKC").trim().replace(/\s+/g, " ").toUpperCase();
}
export const streetSchema = z.object({
  name: z
    .string()
    .transform(normalizeStreet)
    .pipe(
      z
        .string()
        .min(1, "Informe o nome da rua.")
        .max(60, "O nome deve ter até 60 caracteres.")
        .regex(
          /^[^\x00-\x1f:]+$/,
          "O nome da rua não pode conter dois-pontos ou caracteres de controle.",
        ),
    ),
  floor: z
    .string()
    .trim()
    .max(60, "O andar deve ter até 60 caracteres.")
    .optional(),
});
export type Street = { name: string; floor: string | null };
