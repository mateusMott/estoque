"use client";
import { useEffect, useRef, useState, useId, type ReactNode } from "react";
import {
  ArrowRight,
  Check,
  LoaderCircle,
  Minus,
  Plus,
  Search,
  Store,
  Warehouse,
  X,
  Armchair,
} from "lucide-react";
import {
  locationLabel,
  type Destination,
  type Operation,
  type ProductResult,
} from "@/lib/inventory/types";

export async function lookup(
  code: string,
  entry = false,
): Promise<ProductResult> {
  let response: Response;
  try {
    response = await fetch(
      `/api/products?code=${encodeURIComponent(code.trim())}${entry ? "&mode=entry" : ""}`,
      { cache: "no-store" },
    );
  } catch {
    throw new Error("Sem conexão. Verifique sua internet e tente novamente.");
  }
  const data = (await response.json()) as ProductResult & { error?: string };
  if (!response.ok)
    throw new Error(data.error || "Não foi possível consultar.");
  return data;
}
export async function saveOperation(operation: Operation) {
  let response: Response;
  try {
    response = await fetch("/api/operations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(operation),
    });
  } catch {
    throw new Error(
      "A conexão foi interrompida. Tente confirmar novamente; a operação não será duplicada.",
    );
  }
  const data = (await response.json()) as { error?: string };
  if (!response.ok)
    throw new Error(data.error || "Não foi possível confirmar.");
}
function requestId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
// Retain the same id on a network retry, but generate a new one after edits.
export function useOperation() {
  const request = useRef<{ payload: string; id: string } | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const lock = useRef(false);
  async function submit(op: Omit<Operation, "requestId">, done: () => void) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    const payload = JSON.stringify(op);
    try {
      if (request.current?.payload !== payload)
        request.current = { payload, id: requestId() };
      await saveOperation({ ...op, requestId: request.current.id });
      request.current = null;
      done();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return { busy, error, setError, submit };
}
export function ErrorNotice({ children }: { children: ReactNode }) {
  return children ? (
    <div className="error-notice" role="alert">
      {children}
    </div>
  ) : null;
}
export function BusyLabel({
  busy,
  children,
}: {
  busy: boolean;
  children: ReactNode;
}) {
  return (
    <>
      {busy ? <LoaderCircle size={17} className="spin" /> : null}
      {busy ? "Confirmando…" : children}
    </>
  );
}
export function Modal({
  title,
  subtitle,
  children,
  onClose,
  busy = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  const titleId = useId();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    const active = document.activeElement as HTMLElement;
    d?.showModal();
    return () => {
      d?.close();
      active?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="modal-heading">
        <div>
          <div className="eyebrow">GERENCIAMENTO DO ESTOQUE</div>
          <h2 id={titleId}>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          disabled={busy}
          aria-label="Fechar"
        >
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Destinations({
  value,
  onChange,
}: {
  value: Destination | "";
  onChange: (v: Destination) => void;
}) {
  return (
    <div className="destinations" role="group" aria-label="Destino do produto">
      {(
        [
          ["mostruario", "Mostruário", "Produtos em exposição", Armchair],
          ["salao", "Salão de Vendas", "Prontos para a venda", Store],
          ["estoque", "Estoque", "Guardados em uma rua", Warehouse],
        ] as const
      ).map(([id, title, description, Icon]) => (
        <button
          type="button"
          key={id}
          className={`destination ${value === id ? "selected" : ""}`}
          aria-pressed={value === id}
          onClick={() => onChange(id)}
        >
          <span className="destination-icon">
            <Icon size={24} />
          </span>
          <strong>{title}</strong>
          <small>{description}</small>
          <span className="radio-dot">
            {value === id && <Check size={11} />}
          </span>
        </button>
      ))}
    </div>
  );
}
export function StreetInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="field">
      Rua do estoque
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ex.: A01, B02 ou Corredor 3"
        maxLength={60}
        required
        pattern="[^:]+"
        autoFocus
      />
      <small>Informe o corredor em que o produto será armazenado.</small>
    </label>
  );
}
export function Quantity({
  value,
  onChange,
  max = 1000000,
}: {
  value: string;
  onChange: (v: string) => void;
  max?: number;
}) {
  return (
    <label className="field">
      Quantidade
      <div className="quantity-control">
        <button
          type="button"
          onClick={() =>
            onChange(String(Math.max(1, (Number(value) || 1) - 1)))
          }
          disabled={Number(value) <= 1}
          aria-label="Diminuir quantidade"
        >
          <Minus size={18} />
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={max}
          step={1}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Quantidade"
        />
        <button
          type="button"
          onClick={() =>
            onChange(String(Math.min(max, (Number(value) || 0) + 1)))
          }
          disabled={Number(value) >= max}
          aria-label="Aumentar quantidade"
        >
          <Plus size={18} />
        </button>
      </div>
      <small>
        {max < 1000000
          ? `${max.toLocaleString("pt-BR")} disponíveis neste local`
          : "Informe o número de unidades."}
      </small>
    </label>
  );
}
export function ProductSummary({
  name,
  barcode,
  gemco,
  location,
}: {
  name: string;
  barcode: string;
  gemco: string;
  location?: string;
}) {
  return (
    <div className="product-summary">
      <span className="summary-icon">
        <Warehouse size={23} />
      </span>
      <div>
        <strong>{name}</strong>
        <p>
          Barras: {barcode}
          <span>·</span>Gemco: {gemco}
        </p>
        {location && <small>{locationLabel(location)}</small>}
      </div>
    </div>
  );
}
export function CodeInput({
  value,
  onChange,
  onSubmit,
  busy,
  entry = false,
  scanner,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  busy: boolean;
  entry?: boolean;
  scanner?: ReactNode;
}) {
  return (
    <form
      className="search-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="code-input">
        <Search size={21} />
        <input
          aria-label={entry ? "Código para armazenar" : "Pesquisar por código"}
          placeholder="Digite o código de barras ou Gemco"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={80}
          required
          autoComplete="off"
          disabled={busy}
        />
        {scanner}
      </div>
      <button
        type="submit"
        className="button primary"
        disabled={busy || !value.trim()}
      >
        {busy ? (
          <LoaderCircle size={18} className="spin" />
        ) : (
          <Search size={17} />
        )}
        <span>{busy ? "Buscando…" : entry ? "Identificar" : "Pesquisar"}</span>
      </button>
    </form>
  );
}
export function NextButton({
  disabled = false,
  children = "Continuar",
}: {
  disabled?: boolean;
  children?: ReactNode;
}) {
  return (
    <button type="submit" className="button primary" disabled={disabled}>
      {children}
      <ArrowRight size={17} />
    </button>
  );
}
