import { useState } from 'react'

function App() {
  const [connected, setConnected] = useState(false)

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1>Timber Cloud</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Distributed Enterprise Storage</p>
        </div>
        <button className="btn" onClick={() => setConnected(!connected)}>
          {connected ? 'Connected: 0x12...34' : 'Connect Wallet'}
        </button>
      </header>

      <div className="grid">
        <div className="card">
          <div className="stat-label">Total Storage Used</div>
          <div className="stat-value">0.00 GB</div>
        </div>
        <div className="card">
          <div className="stat-label">Active Nodes</div>
          <div className="stat-value">14</div>
        </div>
        <div className="card">
          <div className="stat-label">Network Status</div>
          <div className="stat-value" style={{ color: '#4ade80' }}>Healthy</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>Drop files here to upload</p>
          <p style={{ color: 'var(--text-secondary)' }}>Encrypted & Sharded across the network</p>
          <button className="btn" style={{ marginTop: '1rem', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
            Select Files
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
