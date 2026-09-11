import { useState } from 'react';
import { Database, Copy, Check, ExternalLink, X, ShieldAlert, CheckCircle2, HardDrive, Layers, FileCode2 } from 'lucide-react';
import { SUPABASE_SQL_SCHEMA, SUPABASE_STORAGE_POLICIES_SQL, isConfigured } from '../lib/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupabaseModal({ isOpen, onClose }: SupabaseModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'tables' | 'storage'>('all');

  if (!isOpen) return null;

  const getActiveSql = () => {
    if (activeTab === 'all') return `${SUPABASE_SQL_SCHEMA}\n\n${SUPABASE_STORAGE_POLICIES_SQL}`;
    if (activeTab === 'tables') return SUPABASE_SQL_SCHEMA;
    return SUPABASE_STORAGE_POLICIES_SQL;
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(getActiveSql());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-100">Scripts SQL & Políticas Supabase</h2>
              <p className="text-xs text-stone-400">Banco de Dados PostgreSQL, Storage Buckets e RLS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto text-sm text-stone-300">
          {/* Status Box */}
          <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
            isConfigured
              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
              : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
          }`}>
            {isConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className="font-semibold text-base mb-1">
                {isConfigured ? 'Supabase Conectado!' : 'Modo Demonstração / Aguardando Configuração do Supabase'}
              </h3>
              <p className="text-xs leading-relaxed opacity-90">
                {isConfigured
                  ? 'Seu aplicativo está configurado com o banco de dados Supabase na nuvem.'
                  : 'O aplicativo funciona perfeitamente em modo local. Para persistir os agendamentos e ativar o armazenamento de fotos no Supabase, execute o SQL abaixo.'}
              </p>
            </div>
          </div>

          {/* Quick instructions */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-stone-200 uppercase tracking-wider">Como executar no Supabase:</h4>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800">
                <span className="text-[10px] uppercase font-bold text-amber-400">Passo 1</span>
                <p className="text-xs text-stone-300 mt-1">Acesse seu projeto no <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-amber-400 underline inline-flex items-center gap-0.5">supabase.com <ExternalLink className="w-2.5 h-2.5" /></a></p>
              </div>
              <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800">
                <span className="text-[10px] uppercase font-bold text-amber-400">Passo 2</span>
                <p className="text-xs text-stone-300 mt-1">Abra o menu <strong>SQL Editor</strong> e crie uma nova query.</p>
              </div>
              <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800">
                <span className="text-[10px] uppercase font-bold text-amber-400">Passo 3</span>
                <p className="text-xs text-stone-300 mt-1">Cole o SQL abaixo e clique no botão verde <strong>Run</strong>.</p>
              </div>
            </div>
          </div>

          {/* Buckets Highlights */}
          <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800/80 space-y-2">
            <span className="text-xs font-bold text-stone-200 uppercase tracking-wider block">
              Buckets de Armazenamento Configurados no SQL
            </span>
            <div className="grid sm:grid-cols-3 gap-2.5">
              <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800 text-xs">
                <strong className="text-amber-400 block font-mono">barbershop-avatars</strong>
                <span className="text-[11px] text-stone-400">Fotos dos barbeiros e clientes (Limite: 5MB)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800 text-xs">
                <strong className="text-amber-400 block font-mono">barbershop-cuts</strong>
                <span className="text-[11px] text-stone-400">Galeria de cortes e degradês (Limite: 10MB)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800 text-xs">
                <strong className="text-amber-400 block font-mono">barbershop-receipts</strong>
                <span className="text-[11px] text-stone-400">Recibos e comprovantes em PDF/Foto (Limite: 5MB)</span>
              </div>
            </div>
          </div>

          {/* SQL Code Box with Tabs */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              {/* Tab Selector */}
              <div className="flex items-center gap-1.5 p-1 bg-stone-950 border border-stone-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('storage')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'storage'
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Políticas de Armazenamento (Storage)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('tables')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'tables'
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Tabelas & RLS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'all'
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  <span>Script Completo (Tudo em 1)</span>
                </button>
              </div>

              {/* Copy Button */}
              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 text-stone-950 text-xs font-bold hover:bg-amber-400 transition-colors shadow-sm self-end sm:self-auto"
              >
                {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'SQL Copiado com Sucesso!' : 'Copiar este SQL'}</span>
              </button>
            </div>

            {/* SQL Code View */}
            <div className="relative rounded-xl border border-stone-800 bg-stone-950 p-4 font-mono text-xs text-stone-300 overflow-x-auto max-h-72 scrollbar-thin">
              <pre className="whitespace-pre">{getActiveSql()}</pre>
            </div>

            <p className="text-[11px] text-stone-400">
              {activeTab === 'storage' &&
                'Cria os buckets barbershop-avatars, barbershop-cuts e barbershop-receipts com Row Level Security (RLS) para SELECT, INSERT, UPDATE e DELETE.'}
              {activeTab === 'tables' &&
                'Cria as tabelas barbers, services e appointments com RLS e dados de seed.'}
              {activeTab === 'all' &&
                'Inclui criação de tabelas, dados iniciais, storage buckets e políticas de segurança completas.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between">
          <span className="text-[11px] text-stone-400">
            Compatível com Supabase Free & Pro (PostgreSQL 15+)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition-colors"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
}
