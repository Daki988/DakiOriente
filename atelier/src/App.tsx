import { useState } from "react";
import Home from "./Home";
import Editor from "./Editor";
import type { Doc } from "./types";

export default function App() {
  const [doc, setDoc] = useState<Doc | null>(null);
  return doc ? <Editor key={doc.id} initial={doc} onExit={() => setDoc(null)} /> : <Home onOpen={setDoc} />;
}
