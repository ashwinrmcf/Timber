
export default function DashboardPage() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-panel border border-white/10 p-6 rounded-xl">
                <h3 className="text-silver-400 text-sm font-mono uppercase">Total Storage</h3>
                <div className="text-3xl font-bold text-white mt-1">45.2 GB <span className="text-silver-600 text-lg font-normal">/ 1 TB</span></div>
            </div>

            <div className="bg-panel border border-white/10 p-6 rounded-xl">
                <h3 className="text-silver-400 text-sm font-mono uppercase">Active Nodes</h3>
                <div className="text-3xl font-bold text-emerald-400 mt-1">14 <span className="text-silver-600 text-lg font-normal">Online</span></div>
            </div>

            <div className="bg-panel border border-white/10 p-6 rounded-xl">
                <h3 className="text-silver-400 text-sm font-mono uppercase">Token Balance</h3>
                <div className="text-3xl font-bold text-white mt-1">1,240 <span className="text-silver-600 text-lg font-normal">TMBR</span></div>
            </div>

            <div className="md:col-span-3 bg-panel border border-white/10 p-8 rounded-xl min-h-[400px] flex items-center justify-center">
                <p className="text-silver-500 font-mono">Network Map Placeholder</p>
            </div>
        </div>
    )
}
