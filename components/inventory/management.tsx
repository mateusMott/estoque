"use client";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  Boxes,
  Info,
  MapPin,
  PackageMinus,
  PackagePlus,
  Search,
  CheckCircle2,
} from "lucide-react";
import type {
  Balance,
  OperationKind,
  Product,
  ProductResult,
} from "@/lib/inventory/types";
import { locationLabel, units } from "@/lib/inventory/types";
import { CodeInput, ErrorNotice, lookup } from "./shared";
import { ScanButton } from "./scanner";
import { StreetsCard } from "./streets";

export type ActionSelection = {
  kind: Exclude<OperationKind, "entry">;
  product: Product;
  balance: Balance;
};
export function Management({
  onBack,
  onEntry,
  renderAction,
}: {
  onBack: () => void;
  onEntry: () => void;
  renderAction?: (
    selection: ActionSelection,
    close: () => void,
    saved: () => void,
  ) => React.ReactNode;
}) {
  const [code, setCode] = useState(""),
    [result, setResult] = useState<ProductResult | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [action, setAction] = useState<ActionSelection | null>(null);
  const sequence = useRef(0);
  async function search(value = code) {
    const seq = ++sequence.current;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const data = await lookup(value);
      if (seq === sequence.current) setResult(data);
    } catch (e) {
      if (seq === sequence.current) setError((e as Error).message);
    } finally {
      if (seq === sequence.current) setBusy(false);
    }
  }
  function saved() {
    setAction(null);
    setNotice("Estoque atualizado com sucesso.");
    search();
  }
  return (
    <>
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={16} />
        Voltar ao armazenamento
      </button>
      <div className="page-intro">
        <div className="eyebrow">CONTROLE DE PRODUTOS</div>
        <h1>
          Gerenciamento do Estoque<span className="title-dot">.</span>
        </h1>
        <p>Consulte seus produtos ou registre uma nova entrada.</p>
      </div>
      <section className="search-panel" aria-label="Consulta de produtos">
        <label className="search-label">Encontre um produto</label>
        <CodeInput
          value={code}
          onChange={(v) => {
            setCode(v);
            sequence.current++;
            setResult(null);
            setBusy(false);
            setError("");
            setNotice("");
          }}
          onSubmit={() => {
            setNotice("");
            search();
          }}
          busy={busy}
          scanner={
            <ScanButton
              disabled={busy}
              onResult={(value) => {
                setCode(value);
                setNotice("");
                search(value);
              }}
            />
          }
        />
        <div className="search-hint">
          <Info size={13} />A pesquisa mostra somente produtos com unidades
          disponíveis.
        </div>
      </section>
      <button className="entry-card" onClick={onEntry}>
        <span className="entry-card-icon">
          <PackagePlus size={26} />
        </span>
        <span>
          <strong>Armazenar</strong>
          <small>
            Registre a chegada de um produto novo ou reponha um estoque zerado.
          </small>
        </span>
        <span className="entry-card-arrow">
          <ArrowRight size={21} />
        </span>
      </button>
      <StreetsCard />
      {notice && (
        <div className="success-notice" role="status">
          <CheckCircle2 size={17} />
          {notice}
        </div>
      )}
      <ErrorNotice>{error}</ErrorNotice>
      <section className="results" aria-live="polite" aria-busy={busy}>
        {busy ? (
          <div className="empty-state">
            <span className="empty-icon">
              <Search size={29} />
            </span>
            <h2>Consultando o estoque…</h2>
            <p>Buscando o produto e suas localizações.</p>
          </div>
        ) : !result ? (
          <div className="empty-state">
            <span className="empty-icon">
              <Boxes size={30} strokeWidth={1.5} />
            </span>
            <h2>Cada produto, em cada lugar.</h2>
            <p>
              Pesquise pelo código para ver as quantidades
              <br />
              no mostruário, no salão de vendas e no estoque.
            </p>
          </div>
        ) : !result.product ? (
          <div className="empty-state">
            <span className="empty-icon">
              <Search size={29} />
            </span>
            <h2>Nenhum produto disponível</h2>
            <p>
              Este código não possui unidades armazenadas.
              <br />
              Para registrar uma entrada, use a caixa <strong>Armazenar</strong>
              .
            </p>
          </div>
        ) : (
          <>
            <div className="results-heading">
              <h2>
                Produto encontrado{" "}
                <span>
                  {result.balances.length}{" "}
                  {result.balances.length === 1 ? "local" : "locais"}
                </span>
              </h2>
              <p>
                Total: <strong>{units(result.total)}</strong>
              </p>
            </div>
            <div className="product-list">
              {result.balances.map((balance) => (
                <article className="product-card" key={balance.location}>
                  <div className="product-card-main">
                    <span className="product-card-icon">
                      <Boxes size={27} strokeWidth={1.5} />
                    </span>
                    <div className="product-card-info">
                      <h3>{result.product!.name}</h3>
                      <div className="product-codes">
                        <span>
                          <small>CÓDIGO DE BARRAS</small>
                          {result.product!.barcode}
                        </span>
                        <span>
                          <small>CÓDIGO GEMCO</small>
                          {result.product!.gemco}
                        </span>
                      </div>
                    </div>
                    <div className="product-quantity">
                      <strong>
                        {balance.quantity.toLocaleString("pt-BR")}
                      </strong>
                      <span>
                        {balance.quantity === 1 ? "unidade" : "unidades"}
                      </span>
                    </div>
                  </div>
                  <div className="product-card-bottom">
                    <div className="location-badge">
                      <MapPin size={15} />
                      {locationLabel(balance.location)}
                    </div>
                    <div className="product-actions">
                      <button
                        disabled={!renderAction}
                        onClick={() =>
                          setAction({
                            kind: "add",
                            product: result.product!,
                            balance,
                          })
                        }
                      >
                        <PackagePlus size={15} />
                        Armazenar mais
                      </button>
                      <button
                        disabled={!renderAction}
                        onClick={() =>
                          setAction({
                            kind: "move",
                            product: result.product!,
                            balance,
                          })
                        }
                      >
                        <ArrowRightLeft size={15} />
                        Movimentar
                      </button>
                      <button
                        disabled={!renderAction}
                        className="remove-action"
                        onClick={() =>
                          setAction({
                            kind: "remove",
                            product: result.product!,
                            balance,
                          })
                        }
                      >
                        <PackageMinus size={15} />
                        Dar baixa
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
      {action && renderAction?.(action, () => setAction(null), saved)}
    </>
  );
}
