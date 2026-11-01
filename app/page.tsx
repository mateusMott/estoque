"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Boxes, ChevronRight, CircleHelp, Layers3, LockKeyhole, Package, Warehouse } from "lucide-react";
import { Entry } from "@/components/inventory/entry";
import { Management } from "@/components/inventory/management";

export type Screen = "armazenamento" | "estoque" | "armazenar";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("armazenamento");
  useEffect(() => {
    const sync = () => setScreen(["estoque", "armazenar"].includes(location.hash.slice(1)) ? location.hash.slice(1) as Screen : "armazenamento");
    sync(); window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  function navigate(next: Screen) { location.hash = next; setScreen(next); }
  return <div className="app-shell">
    <aside className="sidebar">
      <a href="#armazenamento" className="brand" aria-label="Magazine — início"><span className="brand-mark"><Boxes size={25}/></span><span>magazine<span className="brand-sub">CONTROLE DE ESTOQUE</span></span></a>
      <div className="nav-caption">ESPAÇO DE TRABALHO</div>
      <nav aria-label="Menu principal"><a href="#armazenamento" className="nav-link" aria-current="page"><Warehouse size={20}/><span>Armazenamento</span><ChevronRight size={16}/></a></nav>
      <div className="sidebar-bottom"><span className="version-dot"/>Primeira etapa<span className="version-number">v1.0</span></div>
    </aside>
    <div className="workspace">
      <header className="topbar"><div className="breadcrumbs"><Warehouse size={17}/><a href="#armazenamento">Armazenamento</a>{screen !== "armazenamento" && <><ChevronRight size={14}/><a href="#estoque">Estoque</a></>}{screen === "armazenar" && <><ChevronRight size={14}/><span>Armazenar</span></>}</div><div className="workspace-label"><span className="workspace-dot"/>Operação da loja</div></header>
      <main id="main-content" className="content">
        {screen === "armazenamento" ? <>
          <div className="page-intro"><div className="eyebrow">ORGANIZAÇÃO QUE FAZ A DIFERENÇA</div><h1>Armazenamento<span className="title-dot">.</span></h1><p>Seu estoque organizado. Cada produto no lugar certo.</p></div>
          <div className="section-line"><h2>O que vamos fazer hoje?</h2><span>Selecione uma área para começar</span></div>
          <div className="module-grid">
            <button className="module-card active-module" onClick={() => navigate("estoque")}><div className="module-top"><span className="module-icon"><Boxes size={30}/></span><span className="status-pill"><span/>Disponível</span></div><div className="warehouse-art" aria-hidden="true"><span className="art-grid"/><Warehouse size={116} strokeWidth={1.05}/><div className="art-box"><Package size={31} strokeWidth={1.3}/></div></div><div className="module-copy"><span className="module-kicker">CONTROLE DE PRODUTOS</span><h3>Gerenciamento<br/>do Estoque</h3><p>Consulte, armazene e movimente seus produtos com facilidade.</p></div><div className="module-footer">Acessar gerenciamento<span className="circle-arrow"><ArrowRight size={19}/></span></div></button>
            <div className="module-card upcoming-module" aria-disabled="true"><div className="module-top"><span className="module-icon"><Layers3 size={29}/></span><span className="soon-pill"><LockKeyhole size={12}/>Em breve</span></div><div className="upcoming-orbit" aria-hidden="true"><Layers3 size={60} strokeWidth={1}/></div><div className="module-copy"><span className="module-kicker">NOVAS POSSIBILIDADES</span><h3>Mais espaço<br/>para evoluir.</h3><p>Uma nova área chega aqui nas próximas etapas do sistema.</p></div><div className="module-footer">Em breve<span className="muted-arrow"><ArrowRight size={19}/></span></div></div>
          </div>
          <div className="help-strip"><CircleHelp size={20}/><p><strong>Tudo começa pelo armazenamento.</strong> Acesse o gerenciamento para consultar um produto ou registrar uma nova entrada.</p></div>
        </> : screen === "armazenar" ? <Entry onBack={()=>navigate("estoque")}/> : <Management onBack={()=>navigate("armazenamento")} onEntry={()=>navigate("armazenar")}/>}
      </main>
      <footer className="page-footer"><span>magazine<span className="footer-divider">/</span>Controle de estoque</span><span>Um lugar para cada produto.</span></footer>
    </div>
  </div>;
}
