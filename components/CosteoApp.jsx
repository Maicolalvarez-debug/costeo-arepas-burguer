"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Plus, X, Trash2, Pencil, ChevronLeft, Search, Settings2,
  Package, ClipboardList, LayoutGrid, Check, AlertTriangle,
  RotateCcw, TrendingUp, ChevronRight, Save, LogOut, WifiOff,
  Sun, Moon,
} from "lucide-react";
const UNIDADES = ["UNI", "KG", "GR", "LT", "ML"];
/* ============================================================
   HELPERS
   ============================================================ */
function formatCOP(n) {
  if (n === null || n === undefined || isNaN(n)) return "$0";
  return "$" + Math.round(n).toLocaleString("es-CO");
}
function uid(prefix) {
  return prefix + Math.random().toString(36).slice(2, 9);
}
function unitCost(ing) {
  if (!ing) return 0;
  const peso = ing.pesoVol || 1;
  return ing.costoTotal / peso;
}
function computeCosto(recipe, ingredientsById) {
  let total = 0;
  for (const item of recipe.items) {
    const ing = ingredientsById[item.ingredientId];
    if (!ing) continue;
    total += unitCost(ing) * (Number(item.cantidad) || 0);
  }
  return total;
}
function computePricing(costo, margen, comision) {
  const precioLocal = costo * (1 + (Number(margen) || 0) / 100);
  const c = Number(comision) || 0;
  const precioRappi = c < 1 ? precioLocal / (1 - c) : precioLocal;
  const utilidad = precioLocal - costo;
  const utilidadPct = precioLocal > 0 ? utilidad / precioLocal : 0;
  return { precioLocal, precioRappi, utilidad, utilidadPct };
}

/* ============================================================
   BASE STYLES
   ============================================================ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');

.ca-app {
  --bg: #FAF3E6;
  --surface: #FFFFFF;
  --surface-alt: #FFF9EE;
  --ink: #2B2018;
  --ink-soft: #8A7B68;
  --ink-faint: #B7A98F;
  --line: #EAE0CC;
  --line-strong: #D8C9A8;
  --accent: #A6472A;
  --accent-deep: #8A3A22;
  --mustard: #E0A106;
  --mustard-ink: #5C3E00;
  --mustard-bg: #FDEFD9;
  --mustard-border: #F0D9A0;
  --positive: #4F7942;
  --positive-bg: #E9F0E3;
  --negative: #B23A2E;
  --negative-bg: #FBEAE7;
  --backdrop: rgba(43,32,24,0.45);
  --accent-shadow: rgba(166,71,42,0.35);
  --card-shadow: rgba(43,32,24,0.10);
  --radius: 16px;
  --radius-sm: 10px;
  color-scheme: light;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: var(--bg);
  color: var(--ink);
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  justify-content: center;
  -webkit-font-smoothing: antialiased;
  transition: background .2s ease, color .2s ease;
}
.ca-app[data-theme="dark"] {
  color-scheme: dark;
  --bg: #17130E;
  --surface: #221B14;
  --surface-alt: #271F16;
  --ink: #F1E8D9;
  --ink-soft: #B3A288;
  --ink-faint: #6E6149;
  --line: #362B1F;
  --line-strong: #473A29;
  --accent: #E17A46;
  --accent-deep: #C7642F;
  --mustard: #F0B92E;
  --mustard-ink: #FBE6AF;
  --mustard-bg: #3A2C14;
  --mustard-border: #59451E;
  --positive: #8AC46F;
  --positive-bg: #22301B;
  --negative: #E2897C;
  --negative-bg: #3B2320;
  --backdrop: rgba(0,0,0,0.6);
  --accent-shadow: rgba(225,122,70,0.3);
  --card-shadow: rgba(0,0,0,0.28);
}
.ca-app * { box-sizing: border-box; }
.ca-shell {
  width: 100%;
  max-width: 480px;
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  position: relative;
  overflow: hidden;
}
.ca-display { font-family: 'Oswald', 'Inter', sans-serif; letter-spacing: 0.01em; }
.ca-mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }

/* Header */
.ca-header {
  padding: 22px 20px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid var(--line);
  background: var(--bg);
  position: sticky;
  top: 0;
  z-index: 5;
}
.ca-header-back {
  width: 34px; height: 34px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: var(--surface); border: 1px solid var(--line);
  color: var(--ink); flex-shrink: 0; cursor: pointer;
}
.ca-header-titles { flex: 1; min-width: 0; }
.ca-header-eyebrow {
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em;
  color: var(--accent); font-weight: 600; margin: 0 0 2px;
}
.ca-header-title {
  font-size: 22px; font-weight: 600; margin: 0; line-height: 1.1;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.ca-save-pill {
  font-size: 10px; padding: 3px 8px; border-radius: 20px;
  color: var(--ink-soft); background: var(--surface); border: 1px solid var(--line);
  display: flex; align-items: center; gap: 4px; flex-shrink: 0;
}
.ca-theme-btn {
  width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--surface); border: 1px solid var(--line); color: var(--ink);
  cursor: pointer;
}

/* Main scroll area */
.ca-main {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 16px 100px;
}

/* Bottom nav (mobile) / sidebar nav (desktop, see breakpoint below) */
.ca-nav {
  position: sticky;
  bottom: 0;
  display: flex;
  background: var(--surface);
  border-top: 1px solid var(--line);
  padding: 8px 6px calc(8px + env(safe-area-inset-bottom, 0px));
  z-index: 10;
  flex-shrink: 0;
}
.ca-nav-btn {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
  padding: 6px 2px; border-radius: 12px; cursor: pointer; border: none; background: none;
  color: var(--ink-faint); font-size: 10.5px; font-weight: 600; font-family: 'Inter', sans-serif;
}
.ca-nav-btn.active { color: var(--accent); }
.ca-nav-btn .dot { width: 4px; height: 4px; border-radius: 50%; background: var(--accent); margin-top: -1px; opacity: 0; }
.ca-nav-btn.active .dot { opacity: 1; }

/* Search input */
.ca-search {
  display: flex; align-items: center; gap: 8px;
  background: var(--surface); border: 1px solid var(--line);
  border-radius: var(--radius-sm); padding: 10px 12px; margin-bottom: 14px;
}
.ca-search input { border: none; outline: none; background: none; flex: 1; font-size: 14px; color: var(--ink); font-family: 'Inter', sans-serif; }
.ca-search input::placeholder { color: var(--ink-faint); }

/* Cards / rows */
.ca-card-list { display: flex; flex-direction: column; }
.ca-card {
  background: var(--surface); border: 1px solid var(--line);
  border-radius: var(--radius); padding: 14px 16px; margin-bottom: 10px;
  cursor: pointer; display: flex; align-items: center; gap: 12px;
  transition: border-color .15s ease;
}
.ca-card:active { border-color: var(--line-strong); }
.ca-card-main { flex: 1; min-width: 0; }
.ca-card-title { font-size: 15px; font-weight: 600; margin: 0 0 3px; color: var(--ink); }
.ca-card-sub { font-size: 12.5px; color: var(--ink-soft); margin: 0; }
.ca-card-value { font-family: 'IBM Plex Mono', monospace; font-weight: 600; font-size: 15px; color: var(--ink); white-space: nowrap; }
.ca-chev { color: var(--ink-faint); flex-shrink: 0; }

.ca-price-row { display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap; }
.ca-badge { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 20px; font-family: 'IBM Plex Mono', monospace; }
.ca-badge.local { background: var(--surface-alt); color: var(--ink-soft); border: 1px solid var(--line); }
.ca-badge.rappi { background: var(--mustard-bg); color: var(--mustard-ink); border: 1px solid var(--mustard-border); }
.ca-badge.margin-good { background: var(--positive-bg); color: var(--positive); }
.ca-badge.margin-bad { background: var(--negative-bg); color: var(--negative); }

/* Section label */
.ca-section-label {
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;
  color: var(--ink-soft); margin: 4px 0 10px;
}

/* FAB */
.ca-fab {
  position: absolute; z-index: 8; right: 20px; bottom: 88px;
  width: 54px; height: 54px; border-radius: 50%;
  background: var(--accent); color: #fff; border: none;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 20px var(--accent-shadow);
  cursor: pointer;
}

/* Sheet / modal */
.ca-backdrop {
  position: fixed; inset: 0; background: var(--backdrop);
  display: flex; align-items: flex-end; justify-content: center; z-index: 30;
}
.ca-sheet {
  width: 100%; max-width: 480px; background: var(--bg);
  border-radius: 20px 20px 0 0; max-height: 88vh; overflow-y: auto;
  padding: 18px 20px calc(20px + env(safe-area-inset-bottom, 0px));
  animation: ca-slide-up .22s ease;
}
@keyframes ca-slide-up { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.ca-sheet-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.ca-sheet-title { font-size: 18px; font-weight: 600; margin: 0; }
.ca-sheet-close { width: 30px; height: 30px; border-radius: 50%; background: var(--surface); border: 1px solid var(--line); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--ink); }

/* Form fields */
.ca-field { margin-bottom: 14px; }
.ca-label { font-size: 12px; font-weight: 600; color: var(--ink-soft); margin: 0 0 6px; display: block; }
.ca-input, .ca-select {
  width: 100%; border: 1px solid var(--line-strong); border-radius: var(--radius-sm);
  padding: 11px 12px; font-size: 15px; background: var(--surface); color: var(--ink);
  font-family: 'Inter', sans-serif; outline: none;
}
.ca-input:focus, .ca-select:focus { border-color: var(--accent); }
.ca-row2 { display: flex; gap: 10px; }
.ca-row2 > * { flex: 1; }

.ca-btn {
  width: 100%; padding: 13px; border-radius: var(--radius-sm); border: none;
  font-size: 15px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif;
  display: flex; align-items: center; justify-content: center; gap: 6px;
}
.ca-btn.primary { background: var(--accent); color: #fff; }
.ca-btn.ghost { background: var(--surface); color: var(--ink); border: 1px solid var(--line-strong); }
.ca-btn.danger { background: var(--negative-bg); color: var(--negative); }
.ca-btn-row { display: flex; gap: 10px; margin-top: 18px; }
.ca-btn-row > * { flex: 1; }

/* Empty state */
.ca-empty { text-align: center; padding: 50px 20px; color: var(--ink-soft); }
.ca-empty svg { color: var(--ink-faint); margin-bottom: 10px; }
.ca-empty p { font-size: 13.5px; margin: 4px 0 0; }

/* Recipe detail ticket */
.ca-ticket {
  background: var(--surface-alt); border: 1px solid var(--line);
  border-radius: var(--radius); padding: 18px; position: relative; margin-top: 18px;
}
.ca-ticket::before, .ca-ticket::after {
  content: ""; position: absolute; top: -8px; width: 16px; height: 16px;
  border-radius: 50%; background: var(--bg); border: 1px solid var(--line);
}
.ca-ticket::before { left: -9px; }
.ca-ticket::after { right: -9px; }
.ca-ticket-row { display: flex; justify-content: space-between; align-items: baseline; padding: 5px 0; font-size: 13.5px; color: var(--ink-soft); }
.ca-ticket-row .v { font-family: 'IBM Plex Mono', monospace; color: var(--ink); font-weight: 500; }
.ca-ticket-divider { border-top: 1.5px dashed var(--line-strong); margin: 10px 0; }
.ca-ticket-row.big { font-size: 15.5px; font-weight: 700; color: var(--ink); }
.ca-ticket-row.big .v { font-size: 17px; }
.ca-ticket-row.rappi .v { color: var(--accent-deep); }
.ca-ticket-row.profit .v { color: var(--positive); }

/* Recipe items */
.ca-item-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--line); }
.ca-item-row:last-child { border-bottom: none; }
.ca-item-name { flex: 1; min-width: 0; font-size: 14px; font-weight: 500; }
.ca-item-unit { font-size: 11.5px; color: var(--ink-faint); }
.ca-item-qty { width: 64px; text-align: right; border: 1px solid var(--line-strong); border-radius: 8px; padding: 7px 8px; font-family: 'IBM Plex Mono', monospace; font-size: 13.5px; background: var(--surface); color: var(--ink); }
.ca-item-sub { width: 74px; text-align: right; font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: var(--ink-soft); }
.ca-item-del { color: var(--ink-faint); cursor: pointer; flex-shrink: 0; }

.ca-add-item-btn {
  width: 100%; padding: 12px; border-radius: var(--radius-sm); border: 1.5px dashed var(--line-strong);
  background: none; color: var(--accent); font-weight: 600; font-size: 13.5px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 10px;
}

.ca-title-input {
  font-family: 'Oswald', sans-serif; font-size: 22px; font-weight: 600; border: none;
  border-bottom: 2px solid var(--line-strong); background: none; width: 100%; padding: 4px 0;
  outline: none; color: var(--ink);
}
.ca-title-input:focus { border-color: var(--accent); }

/* Stat cards on resumen */
.ca-stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 18px; }
.ca-stat { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); padding: 14px; }
.ca-stat-label { font-size: 11px; color: var(--ink-soft); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 4px; }
.ca-stat-value { font-family: 'IBM Plex Mono', monospace; font-size: 19px; font-weight: 600; color: var(--ink); }

.ca-sort-tabs { display: flex; gap: 8px; margin-bottom: 14px; }
.ca-sort-tab { padding: 7px 12px; border-radius: 20px; font-size: 12.5px; font-weight: 600; background: var(--surface); border: 1px solid var(--line); color: var(--ink-soft); cursor: pointer; }
.ca-sort-tab.active { background: var(--ink); color: var(--bg); border-color: var(--ink); }

.ca-list-row { display: flex; align-items: center; gap: 10px; padding: 12px 0; border-bottom: 1px solid var(--line); }
.ca-list-row:last-child { border-bottom: none; }
.ca-list-rank { width: 20px; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--ink-faint); flex-shrink: 0; }
.ca-list-name { flex: 1; min-width: 0; font-size: 13.5px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ca-list-price { font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: var(--ink-soft); width: 76px; text-align: right; flex-shrink: 0; }
.ca-list-pct { width: 52px; text-align: right; font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; font-weight: 600; flex-shrink: 0; }

/* Confirm dialog */
.ca-confirm-box { background: var(--surface); border-radius: var(--radius); padding: 20px; max-width: 340px; width: 90%; }
.ca-confirm-icon { width: 42px; height: 42px; border-radius: 50%; background: var(--negative-bg); color: var(--negative); display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
.ca-confirm-title { font-size: 16px; font-weight: 700; margin: 0 0 6px; }
.ca-confirm-msg { font-size: 13.5px; color: var(--ink-soft); margin: 0; line-height: 1.5; }

.ca-toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 4px 0; }
.ca-loading { display: flex; align-items: center; justify-content: center; min-height: 100vh; min-height: 100dvh; color: var(--ink-soft); font-size: 13px; }

/* ===================== Desktop layout ===================== */
@media (min-width: 860px) {
  .ca-app { padding: 28px; align-items: center; }
  .ca-shell {
    max-width: 1040px;
    width: 100%;
    height: min(100dvh - 56px, 840px);
    min-height: 560px;
    display: grid;
    grid-template-columns: 224px 1fr;
    grid-template-rows: auto 1fr;
    grid-template-areas: "nav header" "nav main";
    border-radius: 24px;
    border: 1px solid var(--line);
    box-shadow: 0 24px 60px var(--card-shadow);
  }
  .ca-header { grid-area: header; }
  .ca-main { grid-area: main; padding: 26px 36px 90px; }
  .ca-nav {
    grid-area: nav; position: static; flex-direction: column; align-items: stretch;
    justify-content: flex-start; gap: 3px; padding: 22px 12px; border-top: none;
    border-right: 1px solid var(--line); background: var(--surface-alt);
  }
  .ca-nav-btn {
    flex-direction: row; justify-content: flex-start; gap: 11px;
    padding: 10px 12px; border-radius: 10px; font-size: 13px;
  }
  .ca-nav-btn .dot { display: none; }
  .ca-nav-btn.active { background: var(--surface); color: var(--accent); }
  .ca-backdrop { align-items: center; }
  .ca-sheet { border-radius: 20px; max-height: 82vh; }
  .ca-stat-grid { grid-template-columns: repeat(4, 1fr); }
  .ca-card-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px; }
  .ca-card { margin-bottom: 0; }
  .ca-fab { bottom: 28px; }
}
`;

/* ============================================================
   PRIMITIVES
   ============================================================ */
function Sheet({ title, onClose, children }) {
  return (
    <div className="ca-backdrop" onClick={onClose}>
      <div className="ca-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="ca-sheet-head">
          <h3 className="ca-sheet-title">{title}</h3>
          <button className="ca-sheet-close" onClick={onClose} aria-label="Cerrar"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ConfirmDialog({ title, message, confirmLabel = "Eliminar", onConfirm, onCancel }) {
  return (
    <div className="ca-backdrop" onClick={onCancel}>
      <div className="ca-confirm-box" onClick={(e) => e.stopPropagation()}>
        <div className="ca-confirm-icon"><AlertTriangle size={20} /></div>
        <p className="ca-confirm-title">{title}</p>
        <p className="ca-confirm-msg">{message}</p>
        <div className="ca-btn-row">
          <button className="ca-btn ghost" onClick={onCancel}>Cancelar</button>
          <button className="ca-btn danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   INGREDIENTES
   ============================================================ */
function IngredientesView({ ingredients, usageCount, onEdit, onNew }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = !term ? ingredients : ingredients.filter((i) => i.nombre.toLowerCase().includes(term));
    return [...list].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [ingredients, q]);

  return (
    <div>
      <div className="ca-search">
        <Search size={16} color="var(--ink-faint)" />
        <input placeholder="Buscar ingrediente" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <p className="ca-section-label">{ingredients.length} ingredientes</p>

      {filtered.length === 0 ? (
        <div className="ca-empty">
          <Package size={30} />
          <p>No hay ingredientes que coincidan.<br />Toca “+” para agregar uno nuevo.</p>
        </div>
      ) : (
        <div className="ca-card-list">
          {filtered.map((ing) => (
            <div className="ca-card" key={ing.id} onClick={() => onEdit(ing)}>
              <div className="ca-card-main">
                <p className="ca-card-title">{ing.nombre}</p>
                <p className="ca-card-sub">
                  {ing.unidad} · compra {ing.pesoVol} por {formatCOP(ing.costoTotal)}
                  {usageCount[ing.id] ? ` · usado en ${usageCount[ing.id]} receta${usageCount[ing.id] > 1 ? "s" : ""}` : ""}
                </p>
              </div>
              <span className="ca-card-value">{formatCOP(unitCost(ing))}</span>
              <ChevronRight size={16} className="ca-chev" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IngredientForm({ initial, onSave, onDelete, onClose, usageCount }) {
  const isNew = !initial;
  const [nombre, setNombre] = useState(initial?.nombre || "");
  const [unidad, setUnidad] = useState(initial?.unidad || "UNI");
  const [pesoVol, setPesoVol] = useState(initial?.pesoVol ?? 1);
  const [costoTotal, setCostoTotal] = useState(initial?.costoTotal ?? 0);
  const [confirmDel, setConfirmDel] = useState(false);

  const preview = pesoVol > 0 ? costoTotal / pesoVol : 0;
  const canSave = nombre.trim().length > 0 && pesoVol > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      id: initial?.id || uid("ing"),
      nombre: nombre.trim(),
      unidad,
      pesoVol: Number(pesoVol),
      costoTotal: Number(costoTotal),
    });
  };

  return (
    <Sheet title={isNew ? "Nuevo ingrediente" : "Editar ingrediente"} onClose={onClose}>
      <div className="ca-field">
        <label className="ca-label">Nombre</label>
        <input className="ca-input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Queso Tajado" />
      </div>
      <div className="ca-row2 ca-field">
        <div>
          <label className="ca-label">Unidad</label>
          <select className="ca-select" value={unidad} onChange={(e) => setUnidad(e.target.value)}>
            {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="ca-label">Peso/Volumen comprado</label>
          <input className="ca-input" type="number" min="0" value={pesoVol} onChange={(e) => setPesoVol(e.target.value)} />
        </div>
      </div>
      <div className="ca-field">
        <label className="ca-label">Costo total de esa compra</label>
        <input className="ca-input" type="number" min="0" value={costoTotal} onChange={(e) => setCostoTotal(e.target.value)} />
      </div>

      <div className="ca-ticket-row" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 14px" }}>
        <span>Costo por {unidad.toLowerCase()}</span>
        <span className="v" style={{ fontSize: 16 }}>{formatCOP(preview)}</span>
      </div>

      <div className="ca-btn-row">
        <button className="ca-btn ghost" onClick={onClose}>Cancelar</button>
        <button className="ca-btn primary" disabled={!canSave} onClick={handleSave} style={!canSave ? { opacity: 0.5 } : undefined}>
          <Check size={16} /> Guardar
        </button>
      </div>
      {!isNew && (
        <button className="ca-btn danger" style={{ marginTop: 10 }} onClick={() => setConfirmDel(true)}>
          <Trash2 size={16} /> Eliminar ingrediente
        </button>
      )}

      {confirmDel && (
        <ConfirmDialog
          title="¿Eliminar este ingrediente?"
          message={
            usageCount[initial.id]
              ? `Se usa en ${usageCount[initial.id]} receta${usageCount[initial.id] > 1 ? "s" : ""}. Esas recetas quedarán con esta línea en $0 hasta que la reemplaces.`
              : "No se usa en ninguna receta todavía."
          }
          onCancel={() => setConfirmDel(false)}
          onConfirm={() => { onDelete(initial.id); setConfirmDel(false); }}
        />
      )}
    </Sheet>
  );
}

/* ============================================================
   RECETAS — lista
   ============================================================ */
function RecetasView({ recipes, ingredientsById, params, onOpen, onNew }) {
  const [q, setQ] = useState("");
  const enriched = useMemo(() => {
    return recipes.map((r) => {
      const costo = computeCosto(r, ingredientsById);
      const pricing = computePricing(costo, r.margen, params.comisionRappi);
      return { ...r, costo, ...pricing };
    });
  }, [recipes, ingredientsById, params.comisionRappi]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = !term ? enriched : enriched.filter((r) => r.nombre.toLowerCase().includes(term));
    return [...list].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [enriched, q]);

  return (
    <div>
      <div className="ca-search">
        <Search size={16} color="var(--ink-faint)" />
        <input placeholder="Buscar receta" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <p className="ca-section-label">{recipes.length} productos en el menú</p>

      {filtered.length === 0 ? (
        <div className="ca-empty">
          <ClipboardList size={30} />
          <p>No hay recetas que coincidan.<br />Toca “+” para crear una.</p>
        </div>
      ) : (
        <div className="ca-card-list">
          {filtered.map((r) => (
            <div className="ca-card" key={r.id} onClick={() => onOpen(r.id)} style={{ alignItems: "flex-start" }}>
              <div className="ca-card-main">
                <p className="ca-card-title">{r.nombre}</p>
                <p className="ca-card-sub">Costo {formatCOP(r.costo)} · {r.items.length} ingrediente{r.items.length !== 1 ? "s" : ""}</p>
                <div className="ca-price-row">
                  <span className="ca-badge local">Local {formatCOP(r.precioLocal)}</span>
                  <span className="ca-badge rappi">Rappi {formatCOP(r.precioRappi)}</span>
                </div>
              </div>
              <ChevronRight size={16} className="ca-chev" style={{ marginTop: 4 }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   RECETA — detalle (estilo ticket)
   ============================================================ */
function RecipeDetail({ recipe, ingredients, ingredientsById, params, onChange, onDelete, onBack }) {
  const [picking, setPicking] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const costo = computeCosto(recipe, ingredientsById);
  const { precioLocal, precioRappi, utilidad, utilidadPct } = computePricing(costo, recipe.margen, params.comisionRappi);

  const setField = (patch) => onChange({ ...recipe, ...patch });
  const setQty = (ingredientId, cantidad) => {
    onChange({
      ...recipe,
      items: recipe.items.map((it) => (it.ingredientId === ingredientId ? { ...it, cantidad } : it)),
    });
  };
  const removeItem = (ingredientId) => {
    onChange({ ...recipe, items: recipe.items.filter((it) => it.ingredientId !== ingredientId) });
  };
  const addItem = (ingredientId) => {
    if (recipe.items.some((it) => it.ingredientId === ingredientId)) { setPicking(false); return; }
    onChange({ ...recipe, items: [...recipe.items, { ingredientId, cantidad: 1 }] });
    setPicking(false);
  };

  return (
    <div>
      <input
        className="ca-title-input"
        value={recipe.nombre}
        onChange={(e) => setField({ nombre: e.target.value })}
        placeholder="Nombre del producto"
      />

      <div className="ca-field" style={{ marginTop: 18 }}>
        <label className="ca-label">Margen de ganancia (%)</label>
        <input
          className="ca-input"
          type="number"
          value={recipe.margen}
          onChange={(e) => setField({ margen: Number(e.target.value) })}
        />
      </div>

      <p className="ca-section-label" style={{ marginTop: 6 }}>Ingredientes</p>
      {recipe.items.length === 0 && (
        <div className="ca-empty" style={{ padding: "24px 10px" }}>
          <p>Todavía no tiene ingredientes.</p>
        </div>
      )}
      {recipe.items.map((it) => {
        const ing = ingredientsById[it.ingredientId];
        if (!ing) return null;
        const sub = unitCost(ing) * (Number(it.cantidad) || 0);
        return (
          <div className="ca-item-row" key={it.ingredientId}>
            <div className="ca-item-name">
              {ing.nombre}
              <div className="ca-item-unit">{formatCOP(unitCost(ing))} / {ing.unidad}</div>
            </div>
            <input
              className="ca-item-qty"
              type="number"
              value={it.cantidad}
              onChange={(e) => setQty(it.ingredientId, e.target.value)}
            />
            <span className="ca-item-sub">{formatCOP(sub)}</span>
            <Trash2 size={16} className="ca-item-del" onClick={() => removeItem(it.ingredientId)} />
          </div>
        );
      })}
      <button className="ca-add-item-btn" onClick={() => setPicking(true)}>
        <Plus size={15} /> Agregar ingrediente
      </button>

      <div className="ca-ticket">
        <div className="ca-ticket-row">
          <span>Costo ingredientes</span>
          <span className="v">{formatCOP(costo)}</span>
        </div>
        <div className="ca-ticket-row">
          <span>Margen aplicado</span>
          <span className="v">{recipe.margen}%</span>
        </div>
        <div className="ca-ticket-divider" />
        <div className="ca-ticket-row big">
          <span>Precio en local</span>
          <span className="v">{formatCOP(precioLocal)}</span>
        </div>
        <div className="ca-ticket-row big rappi">
          <span>Precio en Rappi (-{Math.round(params.comisionRappi * 100)}%)</span>
          <span className="v">{formatCOP(precioRappi)}</span>
        </div>
        <div className="ca-ticket-divider" />
        <div className="ca-ticket-row profit">
          <span>Utilidad por unidad</span>
          <span className="v">{formatCOP(utilidad)} · {(utilidadPct * 100).toFixed(0)}%</span>
        </div>
      </div>

      <button className="ca-btn danger" style={{ marginTop: 18 }} onClick={() => setConfirmDel(true)}>
        <Trash2 size={16} /> Eliminar esta receta
      </button>

      {picking && (
        <IngredientPicker
          ingredients={ingredients}
          excludeIds={recipe.items.map((it) => it.ingredientId)}
          onPick={addItem}
          onClose={() => setPicking(false)}
        />
      )}
      {confirmDel && (
        <ConfirmDialog
          title="¿Eliminar esta receta?"
          message={`“${recipe.nombre}” se eliminará del menú. Esta acción no se puede deshacer.`}
          onCancel={() => setConfirmDel(false)}
          onConfirm={() => { onDelete(recipe.id); setConfirmDel(false); }}
        />
      )}
    </div>
  );
}

function IngredientPicker({ ingredients, excludeIds, onPick, onClose }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return ingredients
      .filter((i) => !excludeIds.includes(i.id))
      .filter((i) => !term || i.nombre.toLowerCase().includes(term))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [ingredients, excludeIds, q]);

  return (
    <Sheet title="Agregar ingrediente" onClose={onClose}>
      <div className="ca-search">
        <Search size={16} color="var(--ink-faint)" />
        <input autoFocus placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
        {filtered.length === 0 ? (
          <div className="ca-empty"><p>Sin resultados.</p></div>
        ) : (
          filtered.map((ing) => (
            <div className="ca-card" key={ing.id} onClick={() => onPick(ing.id)}>
              <div className="ca-card-main">
                <p className="ca-card-title">{ing.nombre}</p>
                <p className="ca-card-sub">{formatCOP(unitCost(ing))} / {ing.unidad}</p>
              </div>
              <Plus size={16} color="var(--accent)" />
            </div>
          ))
        )}
      </div>
    </Sheet>
  );
}

/* ============================================================
   RESUMEN
   ============================================================ */
function ResumenView({ recipes, ingredientsById, params }) {
  const [sortBy, setSortBy] = useState("utilidad");
  const enriched = useMemo(() => {
    return recipes.map((r) => {
      const costo = computeCosto(r, ingredientsById);
      const pricing = computePricing(costo, r.margen, params.comisionRappi);
      return { ...r, costo, ...pricing };
    });
  }, [recipes, ingredientsById, params.comisionRappi]);

  const sorted = useMemo(() => {
    const list = [...enriched];
    if (sortBy === "utilidad") list.sort((a, b) => b.utilidadPct - a.utilidadPct);
    else if (sortBy === "precio") list.sort((a, b) => b.precioLocal - a.precioLocal);
    else list.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return list;
  }, [enriched, sortBy]);

  const avgCosto = enriched.length ? enriched.reduce((s, r) => s + r.costo, 0) / enriched.length : 0;
  const avgMargin = enriched.length ? enriched.reduce((s, r) => s + r.utilidadPct, 0) / enriched.length : 0;

  return (
    <div>
      <div className="ca-stat-grid">
        <div className="ca-stat">
          <p className="ca-stat-label">Productos</p>
          <p className="ca-stat-value">{recipes.length}</p>
        </div>
        <div className="ca-stat">
          <p className="ca-stat-label">Costo promedio</p>
          <p className="ca-stat-value">{formatCOP(avgCosto)}</p>
        </div>
        <div className="ca-stat">
          <p className="ca-stat-label">Utilidad prom. (local)</p>
          <p className="ca-stat-value">{(avgMargin * 100).toFixed(0)}%</p>
        </div>
        <div className="ca-stat">
          <p className="ca-stat-label">Comisión Rappi</p>
          <p className="ca-stat-value">{Math.round(params.comisionRappi * 100)}%</p>
        </div>
      </div>

      <div className="ca-sort-tabs">
        <button className={"ca-sort-tab" + (sortBy === "utilidad" ? " active" : "")} onClick={() => setSortBy("utilidad")}>Más rentables</button>
        <button className={"ca-sort-tab" + (sortBy === "precio" ? " active" : "")} onClick={() => setSortBy("precio")}>Precio</button>
        <button className={"ca-sort-tab" + (sortBy === "nombre" ? " active" : "")} onClick={() => setSortBy("nombre")}>A-Z</button>
      </div>

      {sorted.length === 0 ? (
        <div className="ca-empty">
          <TrendingUp size={30} />
          <p>Crea una receta para ver su rentabilidad aquí.</p>
        </div>
      ) : (
        <div className="ca-card" style={{ cursor: "default", flexDirection: "column", alignItems: "stretch" }}>
          {sorted.map((r, i) => (
            <div className="ca-list-row" key={r.id}>
              <span className="ca-list-rank">{i + 1}</span>
              <span className="ca-list-name">{r.nombre}</span>
              <span className="ca-list-price">{formatCOP(r.precioLocal)}</span>
              <span className="ca-list-pct" style={{ color: r.utilidadPct >= 0.4 ? "var(--positive)" : r.utilidadPct >= 0.2 ? "var(--mustard-ink)" : "var(--negative)" }}>
                {(r.utilidadPct * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   PARAMETROS
   ============================================================ */
function ParametrosView({ params, onChange, onClearAll, onLogout }) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <div>
      <p className="ca-section-label">Comisiones y márgenes</p>
      <div className="ca-field">
        <label className="ca-label">Comisión Rappi (%)</label>
        <input
          className="ca-input"
          type="number"
          value={Math.round(params.comisionRappi * 100)}
          onChange={(e) => onChange({ ...params, comisionRappi: Number(e.target.value) / 100 })}
        />
      </div>
      <div className="ca-field">
        <label className="ca-label">Margen sugerido para recetas nuevas (%)</label>
        <input
          className="ca-input"
          type="number"
          value={params.margenDefault}
          onChange={(e) => onChange({ ...params, margenDefault: Number(e.target.value) })}
        />
      </div>

      <p className="ca-section-label" style={{ marginTop: 24 }}>Cuenta</p>
      <button className="ca-btn ghost" onClick={() => setConfirmLogout(true)}>
        <LogOut size={16} /> Cerrar sesión
      </button>

      <p className="ca-section-label" style={{ marginTop: 24 }}>Zona de riesgo</p>
      <button className="ca-btn danger" onClick={() => setConfirmClear(true)}>
        <Trash2 size={16} /> Borrar todos mis datos
      </button>
      <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 8, lineHeight: 1.5 }}>
        Para volver a cargar los datos de ejemplo originales, corre <code>sql/seed.sql</code> desde
        el editor SQL de Neon.
      </p>

      {confirmClear && (
        <ConfirmDialog
          title="¿Borrar todos los datos?"
          message="Se eliminarán todos tus ingredientes y recetas de la base de datos. Esta acción no se puede deshacer."
          confirmLabel="Borrar todo"
          onCancel={() => setConfirmClear(false)}
          onConfirm={() => { onClearAll(); setConfirmClear(false); }}
        />
      )}
      {confirmLogout && (
        <ConfirmDialog
          title="¿Cerrar sesión?"
          message="Tendrás que ingresar la contraseña de nuevo la próxima vez."
          confirmLabel="Cerrar sesión"
          onCancel={() => setConfirmLogout(false)}
          onConfirm={() => { onLogout(); setConfirmLogout(false); }}
        />
      )}
    </div>
  );
}

/* ============================================================
   HEADER + NAV
   ============================================================ */
const VIEW_META = {
  recetas: { eyebrow: "Menú", title: "Recetas" },
  ingredientes: { eyebrow: "Insumos", title: "Ingredientes" },
  resumen: { eyebrow: "Rentabilidad", title: "Resumen" },
  parametros: { eyebrow: "Ajustes", title: "Parámetros" },
};

function Header({ view, onBackTitle, onBack, saveState, theme, onToggleTheme }) {
  const meta = onBackTitle ? null : VIEW_META[view];
  return (
    <div className="ca-header">
      {onBack && (
        <button className="ca-header-back" onClick={onBack} aria-label="Volver"><ChevronLeft size={18} /></button>
      )}
      <div className="ca-header-titles">
        {meta && <p className="ca-header-eyebrow">{meta.eyebrow}</p>}
        <h1 className="ca-header-title ca-display">{onBackTitle || meta.title}</h1>
      </div>
      <button className="ca-theme-btn" onClick={onToggleTheme} aria-label="Cambiar tema">
        {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
      </button>
      <span className="ca-save-pill">
        <span
          style={{
            width: 6, height: 6, borderRadius: "50%", display: "inline-block",
            background: saveState === "saving" ? "var(--mustard)" : saveState === "error" ? "var(--negative)" : "var(--positive)",
          }}
        />
        {saveState === "saving" ? "Guardando" : saveState === "error" ? "Sin conexión" : "Guardado"}
      </span>
    </div>
  );
}

function BottomNav({ view, setView }) {
  const items = [
    { id: "recetas", label: "Recetas", icon: ClipboardList },
    { id: "ingredientes", label: "Ingredientes", icon: Package },
    { id: "resumen", label: "Resumen", icon: LayoutGrid },
    { id: "parametros", label: "Ajustes", icon: Settings2 },
  ];
  return (
    <div className="ca-nav">
      {items.map(({ id, label, icon: Icon }) => (
        <button key={id} className={"ca-nav-btn" + (view === id ? " active" : "")} onClick={() => setView(id)}>
          <Icon size={20} strokeWidth={view === id ? 2.4 : 2} />
          {label}
          <span className="dot" />
        </button>
      ))}
    </div>
  );
}

/* ============================================================
   APP
   ============================================================ */
export default function App() {
  const [data, setData] = useState(null); // {ingredients, recipes, params}
  const [loadState, setLoadState] = useState("loading"); // loading | ready | error
  const [errorMsg, setErrorMsg] = useState("");
  const [view, setView] = useState("recetas");
  const [openRecipeId, setOpenRecipeId] = useState(null);
  const [editingIngredient, setEditingIngredient] = useState(undefined); // undefined=closed, null=new, obj=edit
  const [saveState, setSaveState] = useState("saved"); // saved | saving | error
  const [theme, setTheme] = useState("light");

  const recipeSaveTimer = useRef(null);
  const paramsSaveTimer = useRef(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("ca-theme");
      if (stored === "light" || stored === "dark") {
        setTheme(stored);
      } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setTheme("dark");
      }
    } catch (e) {
      // localStorage no disponible; se queda en "light"
    }
  }, []);

  const toggleTheme = () => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem("ca-theme", next);
      } catch (e) {
        // ignore
      }
      return next;
    });
  };

  const loadData = async () => {
    setLoadState("loading");
    try {
      const res = await fetch("/api/data");
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error("request failed");
      const json = await res.json();
      setData(json);
      setLoadState("ready");
    } catch (e) {
      setErrorMsg("No se pudo conectar con la base de datos. Revisa que DATABASE_URL esté bien configurada y que hayas corrido sql/schema.sql en Neon.");
      setLoadState("error");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const ingredientsById = useMemo(() => {
    if (!data) return {};
    const map = {};
    for (const ing of data.ingredients) map[ing.id] = ing;
    return map;
  }, [data]);

  const usageCount = useMemo(() => {
    if (!data) return {};
    const map = {};
    for (const r of data.recipes) {
      for (const it of r.items) map[it.ingredientId] = (map[it.ingredientId] || 0) + 1;
    }
    return map;
  }, [data]);

  if (loadState === "loading") {
    return (
      <div className="ca-app" data-theme={theme}>
        <style>{CSS}</style>
        <div className="ca-loading">Cargando tu menú…</div>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="ca-app" data-theme={theme}>
        <style>{CSS}</style>
        <div className="ca-loading" style={{ flexDirection: "column", gap: 14, padding: 30, textAlign: "center" }}>
          <WifiOff size={28} color="var(--negative)" />
          <p style={{ maxWidth: 280, color: "var(--ink-soft)" }}>{errorMsg}</p>
          <button className="ca-btn primary" style={{ width: "auto", padding: "10px 22px" }} onClick={loadData}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const saveIngredient = async (ing) => {
    const exists = data.ingredients.some((i) => i.id === ing.id);
    setData((d) => ({
      ...d,
      ingredients: exists ? d.ingredients.map((i) => (i.id === ing.id ? ing : i)) : [...d.ingredients, ing],
    }));
    setEditingIngredient(undefined);
    setSaveState("saving");
    try {
      const res = await fetch("/api/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ing),
      });
      if (!res.ok) throw new Error();
      setSaveState("saved");
    } catch (e) {
      setSaveState("error");
    }
  };

  const deleteIngredient = async (id) => {
    setData((d) => ({ ...d, ingredients: d.ingredients.filter((i) => i.id !== id) }));
    setEditingIngredient(undefined);
    setSaveState("saving");
    try {
      const res = await fetch(`/api/ingredients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setSaveState("saved");
    } catch (e) {
      setSaveState("error");
    }
  };

  const persistRecipe = (recipe) => {
    if (recipeSaveTimer.current) clearTimeout(recipeSaveTimer.current);
    setSaveState("saving");
    recipeSaveTimer.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/recipes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(recipe),
        });
        if (!res.ok) throw new Error();
        setSaveState("saved");
      } catch (e) {
        setSaveState("error");
      }
    }, 500);
  };

  const createRecipe = () => {
    const r = { id: uid("rec"), nombre: "Nuevo producto", margen: data.params.margenDefault, items: [] };
    setData((d) => ({ ...d, recipes: [...d.recipes, r] }));
    setOpenRecipeId(r.id);
    setView("recetas");
    persistRecipe(r);
  };
  const updateRecipe = (updated) => {
    setData((d) => ({ ...d, recipes: d.recipes.map((r) => (r.id === updated.id ? updated : r)) }));
    persistRecipe(updated);
  };
  const deleteRecipe = async (id) => {
    if (recipeSaveTimer.current) clearTimeout(recipeSaveTimer.current);
    setData((d) => ({ ...d, recipes: d.recipes.filter((r) => r.id !== id) }));
    setOpenRecipeId(null);
    setSaveState("saving");
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setSaveState("saved");
    } catch (e) {
      setSaveState("error");
    }
  };

  const updateParams = (params) => {
    setData((d) => ({ ...d, params }));
    if (paramsSaveTimer.current) clearTimeout(paramsSaveTimer.current);
    setSaveState("saving");
    paramsSaveTimer.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/params", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });
        if (!res.ok) throw new Error();
        setSaveState("saved");
      } catch (e) {
        setSaveState("error");
      }
    }, 500);
  };

  const clearAll = async () => {
    setData((d) => ({ ingredients: [], recipes: [], params: d.params }));
    setOpenRecipeId(null);
    setSaveState("saving");
    try {
      const res = await fetch("/api/clear-all", { method: "POST" });
      if (!res.ok) throw new Error();
      setSaveState("saved");
    } catch (e) {
      setSaveState("error");
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (e) {
      // ignore
    }
    window.location.href = "/login";
  };

  const openRecipe = openRecipeId ? data.recipes.find((r) => r.id === openRecipeId) : null;

  return (
    <div className="ca-app" data-theme={theme}>
      <style>{CSS}</style>
      <div className="ca-shell">
        {openRecipe ? (
          <Header onBackTitle={openRecipe.nombre || "Receta"} onBack={() => setOpenRecipeId(null)} saveState={saveState} theme={theme} onToggleTheme={toggleTheme} />
        ) : (
          <Header view={view} saveState={saveState} theme={theme} onToggleTheme={toggleTheme} />
        )}

        <div className="ca-main">
          {openRecipe ? (
            <RecipeDetail
              recipe={openRecipe}
              ingredients={data.ingredients}
              ingredientsById={ingredientsById}
              params={data.params}
              onChange={updateRecipe}
              onDelete={deleteRecipe}
            />
          ) : view === "recetas" ? (
            <RecetasView recipes={data.recipes} ingredientsById={ingredientsById} params={data.params} onOpen={setOpenRecipeId} onNew={createRecipe} />
          ) : view === "ingredientes" ? (
            <IngredientesView ingredients={data.ingredients} usageCount={usageCount} onEdit={setEditingIngredient} onNew={() => setEditingIngredient(null)} />
          ) : view === "resumen" ? (
            <ResumenView recipes={data.recipes} ingredientsById={ingredientsById} params={data.params} />
          ) : (
            <ParametrosView params={data.params} onChange={updateParams} onClearAll={clearAll} onLogout={logout} />
          )}
        </div>

        {!openRecipe && <BottomNav view={view} setView={setView} />}

        {!openRecipe && view === "recetas" && (
          <button className="ca-fab" onClick={createRecipe} aria-label="Nueva receta">
            <Plus size={24} />
          </button>
        )}
        {!openRecipe && view === "ingredientes" && (
          <button className="ca-fab" onClick={() => setEditingIngredient(null)} aria-label="Nuevo ingrediente">
            <Plus size={24} />
          </button>
        )}
      </div>

      {editingIngredient !== undefined && (
        <IngredientForm
          initial={editingIngredient}
          usageCount={usageCount}
          onSave={saveIngredient}
          onDelete={deleteIngredient}
          onClose={() => setEditingIngredient(undefined)}
        />
      )}
    </div>
  );
}
