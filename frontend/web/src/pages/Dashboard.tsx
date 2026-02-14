
export default function DashboardPage() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="metallic-silver-card p-6 rounded-xl">
                <h3 className="text-silver-500 text-sm font-mono uppercase">Total Storage</h3>
                <div className="text-3xl font-bold text-silver-900 mt-1">45.2 GB <span className="text-silver-400 text-lg font-normal">/ 1 TB</span></div>
            </div>

            <div className="metallic-silver-card p-6 rounded-xl shadow-sm">
                <h3 className="text-silver-500 text-sm font-mono uppercase">Active Nodes</h3>
                <div className="text-3xl font-bold text-emerald-600 mt-1">14 <span className="text-silver-400 text-lg font-normal">Online</span></div>
            </div>

            <div className="metallic-silver-card p-6 rounded-xl shadow-sm">
                <h3 className="text-silver-500 text-sm font-mono uppercase">Token Balance</h3>
                <div className="text-3xl font-bold text-silver-900 mt-1">1,240 <span className="text-silver-400 text-lg font-normal">TMBR</span></div>
            </div>

            <div className="md:col-span-3 metallic-silver-card p-8 rounded-xl min-h-[400px] flex items-center justify-center shadow-sm">
                <p className="text-silver-400 font-mono tracking-widest uppercase text-xs">Network Topology Map</p>
            </div>
        </div>
    )
}
