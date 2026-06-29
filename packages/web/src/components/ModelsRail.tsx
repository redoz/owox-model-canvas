import { useEffect, useState } from "react";
import { Files, History, Plus, Pencil, Trash2, RotateCcw, GitCompare, ChevronsLeft } from "lucide-react";
import type { ModelGraph } from "@mc/okf";
import {
  listModels, loadModel, updateModel, deleteModel,
  listVersions, loadVersion, type SavedModel, type ModelVersion,
} from "../lib/models";
import { DiffDialog } from "./DiffDialog";

type Section = "models" | "history";

interface ModelsRailProps {
  signedIn: boolean;
  currentModelId: string | null;
  versionsBump: number;
  onOpenModel: (graph: ModelGraph, id: string, name: string) => void;
  onNew: () => void;
  onRestore: (graph: ModelGraph) => void;
  getCurrentGraph: () => ModelGraph;
  onSignIn: () => void;
}

// Left rail: your saved models + the current model's version history. Collapsed
// by default so the canvas stays the hero; replaces the My-models modal.
export function ModelsRail(props: ModelsRailProps) {
  const { signedIn, currentModelId, versionsBump, onOpenModel, onNew, onRestore, getCurrentGraph, onSignIn } = props;
  const [collapsed, setCollapsed] = useState(true);
  const [section, setSection] = useState<Section>("models");
  const open = (s: Section) => { setSection(s); setCollapsed(false); };

  if (collapsed) {
    return (
      <div className="flex w-12 flex-shrink-0 flex-col items-center gap-1 border-r border-[#d8dee8] bg-white py-2">
        <RailIcon title="My models" onClick={() => open("models")}><Files size={18} /></RailIcon>
        <RailIcon title="Version history" onClick={() => open("history")}><History size={18} /></RailIcon>
      </div>
    );
  }

  return (
    <div className="flex w-64 flex-shrink-0 flex-col border-r border-[#d8dee8] bg-white">
      <div className="flex items-center gap-1 border-b border-[#eef1f5] px-2 py-1.5">
        <Tab active={section === "models"} onClick={() => setSection("models")}><Files size={14} /> Models</Tab>
        <Tab active={section === "history"} onClick={() => setSection("history")}><History size={14} /> History</Tab>
        <div className="flex-1" />
        <button title="Collapse" onClick={() => setCollapsed(true)} className="rounded-md p-1.5 text-slate-400 hover:bg-[#f1f3f7] hover:text-slate-700 cursor-pointer"><ChevronsLeft size={16} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {!signedIn ? (
          <SignInCTA onSignIn={onSignIn} />
        ) : section === "models" ? (
          <ModelsSection currentModelId={currentModelId} versionsBump={versionsBump} onOpenModel={onOpenModel} onNew={onNew} />
        ) : (
          <HistorySection currentModelId={currentModelId} versionsBump={versionsBump} onRestore={onRestore} getCurrentGraph={getCurrentGraph} />
        )}
      </div>
    </div>
  );
}

function RailIcon({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button title={title} onClick={onClick} className="rounded-lg p-2 text-slate-500 hover:bg-[#f1f3f7] hover:text-[#1e88e5] cursor-pointer">{children}</button>
  );
}
function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[12.5px] font-[550] cursor-pointer ${active ? "bg-[#e6f1fb] text-[#1e88e5]" : "text-slate-500 hover:bg-[#f1f3f7]"}`}>{children}</button>
  );
}
function SignInCTA({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="px-2 py-6 text-center">
      <p className="text-[13px] text-slate-500">Sign in to save and version your models.</p>
      <button onClick={onSignIn} className="mt-3 rounded-lg bg-[#1e88e5] px-3 py-1.5 text-[13px] font-[550] text-white hover:bg-[#1976d2] cursor-pointer">Sign in to save</button>
    </div>
  );
}

function ModelsSection({ currentModelId, versionsBump, onOpenModel, onNew }: { currentModelId: string | null; versionsBump: number; onOpenModel: ModelsRailProps["onOpenModel"]; onNew: () => void }) {
  const [models, setModels] = useState<SavedModel[] | null>(null);
  const [err, setErr] = useState("");
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);

  const refresh = () => listModels().then(setModels).catch(e => setErr((e as Error).message));
  // Reload on mount and after every Save (versionsBump) so a freshly-saved model
  // shows up without reopening the rail.
  useEffect(() => { void refresh(); }, [versionsBump]);

  async function openModel(m: SavedModel) {
    try { onOpenModel(await loadModel(m.id), m.id, m.name); }
    catch (e) { setErr((e as Error).message); }
  }
  async function remove(id: string) {
    try { await deleteModel(id); await refresh(); } catch (e) { setErr((e as Error).message); }
  }
  async function commitRename() {
    if (!renaming) return;
    const { id, name } = renaming; setRenaming(null);
    try { await updateModel(id, { name: name.trim() || "Untitled model" }); await refresh(); } catch (e) { setErr((e as Error).message); }
  }

  return (
    <>
      <button onClick={onNew} className="mb-2 flex w-full items-center gap-2 rounded-lg border border-dashed border-[#d8dee8] px-3 py-2 text-[13px] font-[550] text-slate-600 hover:border-[#1e88e5] hover:text-[#1e88e5] cursor-pointer">
        <Plus size={15} /> New model
      </button>
      {err && <p className="px-1 py-1 text-[12px] text-red-600">{err}</p>}
      {models === null && <p className="px-1 py-4 text-center text-[12px] text-slate-400">Loading…</p>}
      {models?.length === 0 && <p className="px-1 py-4 text-center text-[12px] text-slate-400">No saved models yet.</p>}
      {models?.map(m => (
        <div key={m.id} className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 ${m.id === currentModelId ? "bg-[#e6f1fb]" : "hover:bg-[#f7f8fa]"}`}>
          {renaming?.id === m.id ? (
            <input autoFocus value={renaming.name} onChange={e => setRenaming({ id: m.id, name: e.target.value })} onBlur={commitRename}
              onKeyDown={e => { if (e.key === "Enter") void commitRename(); if (e.key === "Escape") setRenaming(null); }}
              className="flex-1 rounded-md border border-[#1e88e5] px-1.5 py-0.5 text-[13px] outline-none" />
          ) : (
            <button onClick={() => openModel(m)} className="min-w-0 flex-1 text-left cursor-pointer">
              <div className="truncate text-[13px] font-[550] text-slate-900">{m.name}</div>
              <div className="text-[11px] text-slate-400">{new Date(m.updated_at).toLocaleDateString()}</div>
            </button>
          )}
          <button title="Rename" onClick={() => setRenaming({ id: m.id, name: m.name })} className="rounded p-1 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-slate-700 cursor-pointer"><Pencil size={13} /></button>
          <button title="Delete" onClick={() => remove(m.id)} className="rounded p-1 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-600 cursor-pointer"><Trash2 size={13} /></button>
        </div>
      ))}
    </>
  );
}

function HistorySection({ currentModelId, versionsBump, onRestore, getCurrentGraph }: { currentModelId: string | null; versionsBump: number; onRestore: (g: ModelGraph) => void; getCurrentGraph: () => ModelGraph }) {
  const [versions, setVersions] = useState<ModelVersion[] | null>(null);
  const [err, setErr] = useState("");
  const [diff, setDiff] = useState<{ prev: ModelGraph; label: string } | null>(null);

  useEffect(() => {
    if (!currentModelId) { setVersions([]); return; }
    listVersions(currentModelId).then(setVersions).catch(e => setErr((e as Error).message));
  }, [currentModelId, versionsBump]);

  async function restore(v: ModelVersion) {
    try { onRestore(await loadVersion(v.id)); } catch (e) { setErr((e as Error).message); }
  }
  async function compare(v: ModelVersion, label: string) {
    try { setDiff({ prev: await loadVersion(v.id), label }); } catch (e) { setErr((e as Error).message); }
  }

  if (!currentModelId) return <p className="px-2 py-6 text-center text-[12.5px] text-slate-400">Save this model to start its version history.</p>;

  return (
    <>
      {err && <p className="px-1 py-1 text-[12px] text-red-600">{err}</p>}
      {versions === null && <p className="px-1 py-4 text-center text-[12px] text-slate-400">Loading…</p>}
      {versions?.length === 0 && <p className="px-1 py-4 text-center text-[12px] text-slate-400">No versions yet — Save to snapshot one.</p>}
      {versions?.map((v, i) => {
        const label = i === 0 ? "the latest save" : new Date(v.created_at).toLocaleString();
        return (
          <div key={v.id} className="group rounded-lg px-2 py-1.5 hover:bg-[#f7f8fa]">
            <div className="text-[13px] font-[550] text-slate-800">{i === 0 ? "Latest" : `Version ${versions.length - i}`}</div>
            <div className="text-[11px] text-slate-400">{new Date(v.created_at).toLocaleString()}</div>
            <div className="mt-1 flex gap-2 opacity-0 group-hover:opacity-100">
              <button onClick={() => compare(v, label)} title="Compare with current canvas" className="flex items-center gap-1 text-[11.5px] text-slate-500 hover:text-[#1e88e5] cursor-pointer"><GitCompare size={13} /> Compare</button>
              <button onClick={() => restore(v)} title="Load this version onto the canvas" className="flex items-center gap-1 text-[11.5px] text-slate-500 hover:text-[#1e88e5] cursor-pointer"><RotateCcw size={13} /> Restore</button>
            </div>
          </div>
        );
      })}
      {diff && <DiffDialog prev={diff.prev} next={getCurrentGraph()} label={diff.label} onClose={() => setDiff(null)} />}
    </>
  );
}
