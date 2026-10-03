export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-slate-50 text-slate-900">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl p-8 shadow-xs">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-sm tracking-tight">
            HL
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">HireLens</h1>
            <p className="text-xs text-slate-500 font-medium">AI Recruitment Intelligence Platform</p>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 space-y-4">
          <div className="flex items-center justify-between text-sm py-2 border-b border-slate-100">
            <span className="text-slate-600 font-medium">Environment</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              Phase 1: Foundation Ready
            </span>
          </div>
          <div className="flex items-center justify-between text-sm py-2 border-b border-slate-100">
            <span className="text-slate-600 font-medium">Stack</span>
            <span className="text-slate-800 font-mono text-xs">Next.js 16 (App Router) + TypeScript + Tailwind CSS</span>
          </div>
          <div className="flex items-center justify-between text-sm py-2">
            <span className="text-slate-600 font-medium">Status</span>
            <span className="text-slate-600 text-xs">Clean foundation initialized. Next: Phase 2 Database & Prisma</span>
          </div>
        </div>
      </div>
    </main>
  );
}
