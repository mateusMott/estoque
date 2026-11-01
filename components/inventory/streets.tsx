"use client";
import { useRef, useState } from "react";
import { ArrowRight, Check, MapPinPlus } from "lucide-react";
import { BusyLabel, ErrorNotice, Modal } from "./shared";
import { streetSchema } from "@/lib/inventory/streets";
import { useStreets } from "@/lib/inventory/streets-client";

export function StreetsCard() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="entry-card streets-card" onClick={() => setOpen(true)}>
        <span className="entry-card-icon">
          <MapPinPlus size={26} />
        </span>
        <span>
          <strong>Criar rua</strong>
          <small>
            Cadastre as ruas do estoque e informe o andar, se houver.
          </small>
        </span>
        <span className="entry-card-arrow">
          <ArrowRight size={21} />
        </span>
      </button>
      {open && <StreetRegistration onClose={() => setOpen(false)} />}
    </>
  );
}
function StreetRegistration({ onClose }: { onClose: () => void }) {
  const { streets, loading, error: loadError, reload } = useStreets();
  const [name, setName] = useState(""),
    [floor, setFloor] = useState(""),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (lock.current) return;
    setError("");
    setSuccess("");
    const parsed = streetSchema.safeParse({ name, floor });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    lock.current = true;
    setBusy(true);
    try {
      const response = await fetch("/api/streets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(data.error || "Não foi possível cadastrar a rua.");
      setSuccess(`${parsed.data.name} cadastrada com sucesso.`);
      setName("");
      setFloor("");
      await reload();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Verifique a conexão e tente novamente.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Criar rua"
      subtitle="Organize os locais que poderão receber produtos no estoque."
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={submit}>
        <fieldset disabled={busy}>
          <label className="field">
            Nome da rua
            <input
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSuccess("");
              }}
              required
              maxLength={60}
              placeholder="Ex.: Rua 1, Rua 2 ou A01"
            />
          </label>
          <label className="field reason-field">
            Andar <span className="optional-label">Opcional</span>
            <input
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              maxLength={60}
              placeholder="Ex.: Térreo ou 2º andar"
            />
          </label>
        </fieldset>
        <ErrorNotice>{error}</ErrorNotice>
        {success && (
          <div className="success-notice" role="status">
            <Check size={17} />
            {success}
          </div>
        )}
        <div className="form-footer">
          <button
            type="button"
            className="button secondary"
            onClick={onClose}
            disabled={busy}
          >
            Fechar
          </button>
          <button
            className="button primary"
            type="submit"
            disabled={busy || !name.trim()}
          >
            <BusyLabel busy={busy}>
              Cadastrar rua
              <Check size={16} />
            </BusyLabel>
          </button>
        </div>
      </form>
      <section className="registered-streets" aria-label="Ruas cadastradas">
        <h3>Ruas cadastradas</h3>
        {loading ? (
          <p>Carregando ruas…</p>
        ) : loadError ? (
          <>
            <ErrorNotice>{loadError}</ErrorNotice>
            <button className="button secondary" onClick={reload}>
              Tentar novamente
            </button>
          </>
        ) : streets.length ? (
          <ul>
            {streets.map((street) => (
              <li key={street.name}>
                <strong>{street.name}</strong>
                <span>{street.floor || "Andar não informado"}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            Nenhuma rua cadastrada. Crie a primeira rua para armazenar produtos
            no estoque.
          </p>
        )}
      </section>
    </Modal>
  );
}
