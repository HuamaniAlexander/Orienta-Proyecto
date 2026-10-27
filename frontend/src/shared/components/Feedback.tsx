import { AlertCircle, LoaderCircle } from 'lucide-react';
export function Loading({ text = 'Consultando opciones académicas…' }: { text?: string }) {
  return <div className="feedback" role="status"><LoaderCircle className="spin" size={24} /><p>{text}</p></div>;
}
export function Failure({ message, retry }: { message: string; retry?: () => void }) {
  return <div className="feedback error" role="alert"><AlertCircle /><h2>No pudimos cargar la información</h2><p>{message}</p>{retry && <button className="button secondary" onClick={retry}>Volver a intentar</button>}</div>;
}
