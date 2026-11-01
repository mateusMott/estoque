"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, ScanLine } from "lucide-react";
import { ErrorNotice, Modal } from "./shared";

export function ScanButton({onResult,disabled=false}:{onResult:(code:string)=>void;disabled?:boolean}) {
  const [open,setOpen]=useState(false);
  return <><button type="button" className="scan-button" disabled={disabled} onClick={()=>setOpen(true)} aria-label="Escanear código com a câmera"><ScanLine size={19}/><span>Escanear</span></button>{open&&<Scanner onClose={()=>setOpen(false)} onResult={code=>{setOpen(false);onResult(code);}}/>}</>;
}
function Scanner({onClose,onResult}:{onClose:()=>void;onResult:(code:string)=>void}) {
  const video=useRef<HTMLVideoElement>(null),callback=useRef(onResult);
  callback.current=onResult;
  const [error,setError]=useState(""),[ready,setReady]=useState(false);
  useEffect(()=>{
    let disposed=false,stream:MediaStream|undefined,controls:{stop:()=>void}|undefined,detected=false;
    function stop(){controls?.stop();stream?.getTracks().forEach(track=>track.stop());}
    async function start(){
      try {
        if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia) throw new Error("UNAVAILABLE");
        stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}},audio:false});
        if(disposed){stop();return;}
        const {BrowserMultiFormatReader}=await import("@zxing/browser");
        if(disposed){stop();return;}
        const reader=new BrowserMultiFormatReader(undefined,{delayBetweenScanAttempts:180,delayBetweenScanSuccess:600});
        controls=await reader.decodeFromStream(stream,video.current!, (result,_error,scanner)=>{
          if(result&&!disposed&&!detected){
            const value=result.getText().trim();
            if(!value)return;detected=true;scanner.stop();stop();callback.current(value);
          }
        });
        if(disposed){stop();return;}setReady(true);
      } catch(e) {
        stop();if(disposed)return;
        const name=(e as Error).name;
        setError(name==="NotAllowedError"||name==="SecurityError"?"O acesso à câmera foi negado. Permita a câmera nas configurações do navegador ou digite o código manualmente.":name==="NotFoundError"?"Nenhuma câmera foi encontrada. Você pode digitar o código manualmente.":name==="NotReadableError"?"A câmera está em uso em outro aplicativo. Feche-o e tente novamente.":"Não foi possível abrir a câmera. Abra o site em uma aba HTTPS do navegador ou digite o código manualmente.");
      }
    }
    start();return()=>{disposed=true;stop();};
  },[]);
  return <Modal title="Escanear código" subtitle="Aponte a câmera para o código de barras do produto." onClose={onClose}><div className="scanner-viewport"><video ref={video} autoPlay muted playsInline aria-label="Prévia da câmera"/><div className="scanner-target"/>{!ready&&!error&&<div className="scanner-wait"><Camera size={32}/><span>Aguardando a câmera…</span></div>}</div><p className="scanner-help">Mantenha o código inteiro dentro da área marcada, com boa iluminação. A leitura é automática.</p><ErrorNotice>{error}</ErrorNotice><div className="form-footer"><span>EAN, UPC, Code 128, Code 39 e outros.</span><button type="button" className="button secondary" onClick={onClose}>Digitar manualmente</button></div></Modal>;
}
