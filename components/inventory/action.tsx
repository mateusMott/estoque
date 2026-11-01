"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import type { Destination } from "@/lib/inventory/types";
import { locationKey, units } from "@/lib/inventory/types";
import type { ActionSelection } from "./management";
import {
  BusyLabel,
  Destinations,
  ErrorNotice,
  Modal,
  ProductSummary,
  Quantity,
  StreetInput,
  useOperation,
} from "./shared";

export function ProductAction({
  selection,
  onClose,
  onSaved,
}: {
  selection: ActionSelection;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { product, balance, kind } = selection;
  const [destination, setDestination] = useState<Destination | "">(""),
    [street, setStreet] = useState(""),
    [quantity, setQuantity] = useState("1"),
    [reason, setReason] = useState("");
  const operation = useOperation();
  const key = destination ? locationKey(destination, street) : "";
  const sameLocation = kind === "move" && key === balance.location;
  const title = {
    add: "Armazenar mais",
    move: "Movimentar produto",
    remove: "Dar baixa",
  }[kind];
  const valid =
    kind === "remove"
      ? reason.trim().length >= 3
      : !!destination &&
        (destination !== "estoque" || !!street.trim()) &&
        !sameLocation;
  return (
    <Modal
      title={title}
      subtitle={
        {
          add: "Escolha onde as novas unidades serão armazenadas.",
          move: "Selecione o destino das unidades deste local.",
          remove: "Informe a quantidade e o motivo da retirada.",
        }[kind]
      }
      onClose={onClose}
      busy={operation.busy}
    >
      <ProductSummary
        name={product.name}
        barcode={product.barcode}
        gemco={product.gemco}
        location={balance.location}
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          operation.submit(
            {
              kind,
              quantity: Number(quantity),
              productId: product.id,
              ...(kind === "remove"
                ? { source: balance.location, reason: reason.trim() }
                : kind === "move"
                  ? { source: balance.location, destination: key }
                  : { destination: key }),
            },
            onSaved,
          );
        }}
      >
        <fieldset disabled={operation.busy}>
          {kind !== "remove" && (
            <>
              <label className="field">Local de destino</label>
              <Destinations value={destination} onChange={setDestination} />
              {destination === "estoque" && (
                <div className="action-street">
                  <StreetInput value={street} onChange={setStreet} />
                </div>
              )}
              {sameLocation && (
                <ErrorNotice>
                  Escolha um local ou uma rua diferente da origem.
                </ErrorNotice>
              )}
            </>
          )}
          <Quantity
            value={quantity}
            onChange={setQuantity}
            max={kind === "add" ? 1000000 : balance.quantity}
          />
          {kind === "remove" && (
            <label className="field reason-field">
              Motivo da baixa
              <textarea
                placeholder="Ex.: venda, avaria, devolução…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                minLength={3}
                maxLength={500}
              />
              <small>
                A baixa de {units(Number(quantity) || 0)} será registrada com
                este motivo.
              </small>
            </label>
          )}
        </fieldset>
        <ErrorNotice>{operation.error}</ErrorNotice>
        <div className="form-footer">
          <button
            className="button secondary"
            type="button"
            disabled={operation.busy}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className={`button primary ${kind === "remove" ? "danger" : ""}`}
            type="submit"
            disabled={operation.busy || !valid}
          >
            <BusyLabel busy={operation.busy}>
              {kind === "remove"
                ? "Confirmar baixa"
                : kind === "move"
                  ? "Confirmar movimentação"
                  : "Confirmar armazenamento"}
              <Check size={16} />
            </BusyLabel>
          </button>
        </div>
      </form>
    </Modal>
  );
}
