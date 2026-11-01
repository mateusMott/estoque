export type Product = {
  id: string;
  name: string;
  barcode: string;
  gemco: string;
};
export type Balance = {
  location: string;
  quantity: number;
  floor?: string | null;
};
export type ProductResult = {
  product: Product | null;
  balances: Balance[];
  total: number;
};
export type Destination = "mostruario" | "salao" | "estoque";
export type OperationKind = "entry" | "add" | "move" | "remove";
export type Operation = {
  requestId: string;
  kind: OperationKind;
  quantity: number;
  productId?: string;
  product?: Omit<Product, "id">;
  source?: string;
  destination?: string;
  reason?: string;
};
export function locationLabel(location: string, floor?: string | null) {
  if (location === "mostruario") return "Mostruário";
  if (location === "salao") return "Salão de Vendas";
  const name = location.replace(/^estoque:/, "");
  return `Estoque · ${/^RUA(?:\s|$)/i.test(name) ? name : `Rua ${name}`}${floor ? ` · ${floor}` : ""}`;
}
export function locationKey(destination: Destination, street: string) {
  return destination === "estoque"
    ? `estoque:${street.normalize("NFKC").trim().replace(/\s+/g, " ").toUpperCase()}`
    : destination;
}
export function units(quantity: number) {
  return `${quantity.toLocaleString("pt-BR")} ${quantity === 1 ? "unidade" : "unidades"}`;
}
