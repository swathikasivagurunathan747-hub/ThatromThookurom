import { useState, useMemo } from 'react';
import { Database, Search, ArrowRight, X, Sparkles, Info } from 'lucide-react';
import { AerospaceBackground } from '../../components/ui/AerospaceBackground';

export interface DatasetItem {
  id: string;
  name: string;
  description: string;
  domain: string;
  capability: string;
  usedFor: string;
  category: 'Single Image' | 'Bi-Temporal' | 'Domain Adaptation';
}

export const PROJECT_DATASETS: DatasetItem[] = [
  {
    id: 'bigearthnet',
    name: 'BigEarthNet.txt',
    description: 'Remote-sensing domain adaptation / multisensor image-text representation',
    domain: 'Remote Sensing',
    capability: 'Domain Adaptation · Image-Text',
    usedFor: 'Remote-sensing domain adaptation and multisensor image-text representation.',
    category: 'Domain Adaptation',
  },
  {
    id: 'vrsbench',
    name: 'VRSBench',
    description: 'Single-image captioning, grounding, and VQA',
    domain: 'Remote Sensing',
    capability: 'Captioning · Grounding · VQA',
    usedFor: 'Single-image captioning, grounding, and visual question answering.',
    category: 'Single Image',
  },
  {
    id: 'rsvqa',
    name: 'RSVQA',
    description: 'Single-image remote-sensing VQA',
    domain: 'Remote Sensing',
    capability: 'Single-Image VQA',
    usedFor: 'Question answering over single remote-sensing images.',
    category: 'Single Image',
  },
  {
    id: 'cdvqa_second',
    name: 'CDVQA / SECOND',
    description: 'Bi-temporal change-detection VQA',
    domain: 'Remote Sensing',
    capability: 'Change Detection · Bi-Temporal VQA',
    usedFor: 'Bi-temporal change detection and question answering.',
    category: 'Bi-Temporal',
  },
];

const FILTER_CATEGORIES = ['All', 'Single Image', 'Bi-Temporal', 'Domain Adaptation'] as const;
type FilterCategory = typeof FILTER_CATEGORIES[number];

export function DatasetsWorkspace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('All');
  const [activeDatasetDetail, setActiveDatasetDetail] = useState<DatasetItem | null>(null);

  const filteredDatasets = useMemo(() => {
    return PROJECT_DATASETS.filter((ds) => {
      const matchesCategory =
        selectedCategory === 'All' || ds.category === selectedCategory;

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        ds.name.toLowerCase().includes(q) ||
        ds.description.toLowerCase().includes(q) ||
        ds.capability.toLowerCase().includes(q) ||
        ds.usedFor.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="relative min-h-full w-full bg-[#050709] text-white font-sans overflow-x-hidden select-none">
      {/* Visual Aerospace Backdrop (No Satellite Map) */}
      <AerospaceBackground />

      {/* Main Workspace Content Container */}
      <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* ════════════════════════════════════════════════════════
            1. PAGE HEADER
        ════════════════════════════════════════════════════════ */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-[#C29B53]/15 border border-[#C29B53]/30 flex items-center justify-center">
                <Database size={13} className="text-[#C29B53]" />
              </div>
              <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-[#C29B53]">
                PROJECT RESOURCES
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
              DATASETS
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 max-w-2xl font-sans">
              Remote-sensing datasets powering SatQuery&apos;s analysis capabilities.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-zinc-300">
              <span className="font-bold text-[#C29B53]">4</span> DATASETS
            </span>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            2. SEARCH & FILTER CONTROLS
        ════════════════════════════════════════════════════════ */}
        <div className="my-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search datasets..."
              className="w-full bg-black/60 backdrop-blur-xl border border-white/15 focus:border-[#C29B53] rounded-xl pl-9 pr-8 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none transition-all font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {FILTER_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all shrink-0 cursor-pointer
                  ${
                    selectedCategory === cat
                      ? 'bg-[#C29B53]/20 text-[#C29B53] border border-[#C29B53]/50 shadow-sm'
                      : 'bg-white/[0.03] hover:bg-white/[0.07] text-zinc-400 hover:text-white border border-white/10'
                  }
                `}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            3. 4 DATASET CARDS (GRID LAYOUT)
        ════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredDatasets.map((ds) => (
            <div
              key={ds.id}
              className="group relative rounded-2xl bg-black/65 backdrop-blur-xl border border-white/15 hover:border-[#C29B53]/50 p-6 flex flex-col justify-between transition-all shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_10px_40px_rgba(194, 155, 83,0.15)]"
            >
              {/* Card Top: Tag + Name + Description */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#C29B53] bg-[#C29B53]/10 px-2.5 py-0.5 rounded-md border border-[#C29B53]/30">
                    DATASET
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                    {ds.category}
                  </span>
                </div>

                <h3 className="text-lg font-bold font-mono text-white group-hover:text-[#C29B53] transition-colors tracking-wide">
                  {ds.name}
                </h3>

                <p className="mt-2 text-xs text-zinc-300 leading-relaxed font-sans min-h-[36px]">
                  {ds.description}
                </p>
              </div>

              {/* Divider */}
              <div className="my-5 border-t border-white/10" />

              {/* Card Mid: Domain + Capability + Used For */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-0.5">
                      Domain
                    </div>
                    <div className="text-zinc-200 font-sans">{ds.domain}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-0.5">
                      Capability
                    </div>
                    <div className="text-zinc-200 font-sans truncate" title={ds.capability}>
                      {ds.capability}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">
                    Used for:
                  </div>
                  <div className="text-xs text-zinc-400 font-sans leading-relaxed">
                    {ds.usedFor}
                  </div>
                </div>
              </div>

              {/* Card Bottom: Details Action (Informational Only) */}
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
                  <Info size={12} className="text-zinc-500" />
                  <span>Project Resource</span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveDatasetDetail(ds)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wider uppercase text-[#C29B53] hover:text-white bg-[#C29B53]/10 hover:bg-[#C29B53]/25 border border-[#C29B53]/30 hover:border-[#C29B53]/60 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>DETAILS</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          ))}

          {filteredDatasets.length === 0 && (
            <div className="col-span-full py-16 text-center rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl">
              <Database size={28} className="mx-auto text-zinc-600 mb-3" />
              <div className="text-sm font-mono text-zinc-300">No matching datasets found</div>
              <div className="text-xs text-zinc-500 mt-1">Try adjusting your search query or filter</div>
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════
            4. INFORMATIONAL NOTE AT BOTTOM
        ════════════════════════════════════════════════════════ */}
        <div className="mt-10 p-4 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-zinc-400 flex items-start gap-3">
          <Sparkles size={16} className="text-[#C29B53] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-mono text-white font-semibold">Agentic AI Routing: </span>
            SatQuery&apos;s intelligent agent router automatically determines the appropriate dataset and model pipeline based on your query and imagery context. Datasets do not require manual selection.
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          5. CLEAN DATASET DETAILS MODAL (ONLY REAL PROJECT METADATA)
      ════════════════════════════════════════════════════════ */}
      {activeDatasetDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0b0f12] border border-white/20 shadow-[0_25px_80px_rgba(0,0,0,0.95)] p-6 sm:p-7 text-left">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActiveDatasetDetail(null)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-zinc-400 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C29B53] bg-[#C29B53]/10 px-2 py-0.5 rounded border border-[#C29B53]/30">
                DATASET METADATA
              </span>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                {activeDatasetDetail.category}
              </span>
            </div>

            <h2 className="text-xl font-bold font-mono text-white tracking-wide">
              {activeDatasetDetail.name}
            </h2>

            <p className="mt-2 text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
              {activeDatasetDetail.description}
            </p>

            <div className="my-5 border-t border-white/10" />

            {/* Details Fields */}
            <div className="space-y-4 text-xs font-sans">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">
                  Domain
                </div>
                <div className="text-zinc-200 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2">
                  {activeDatasetDetail.domain}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">
                  Capability
                </div>
                <div className="text-zinc-200 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2">
                  {activeDatasetDetail.capability}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">
                  Used for
                </div>
                <div className="text-zinc-200 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 leading-relaxed">
                  {activeDatasetDetail.usedFor}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-500">
                Informational project documentation
              </span>
              <button
                type="button"
                onClick={() => setActiveDatasetDetail(null)}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase text-white bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
