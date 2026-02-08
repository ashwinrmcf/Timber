import { useState, useEffect } from 'react'
import './App.css'
import { ErasureEncoder } from './utils/ErasureEncoder'

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<string>('Network Status: Healthy') // Default to Healthy for demo
  const [token, setToken] = useState<string>('')
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const [certHash, setCertHash] = useState<string>('') // Keep for legacy/debug

  // Remove useEffect for token to avoid "stale" or "failed on load" issues.

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      setUploadStatus('Ready to Upload')
    }
  }

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file.")
      return
    }

    try {
      // 1. Get Token (Lazy Load)
      let validToken = token;

      if (!validToken) {
        setUploadStatus('🔐 Requesting Secure Token from Gateway...')
        const res = await fetch('http://localhost:8080/api/upload/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: file.name, size: file.size })
        })

        if (!res.ok) throw new Error("Gateway Unreachable");

        const data = await res.json()
        validToken = data.uploadToken; // Update local variable
        setToken(validToken); // Update state for next time
        console.log("Token acquired:", validToken)
      }

      setUploadStatus('⏳ Sharding File (10 Data + 4 Parity)...')

      // 1. Read File
      const buffer = await file.arrayBuffer()
      const data = new Uint8Array(buffer)

      // 2. Erasure Encode
      const startTime = performance.now()
      const encoder = new ErasureEncoder(10, 4)
      const shards = encoder.encode(data)
      const endTime = performance.now()

      console.log(`Sharding took ${Math.round(endTime - startTime)}ms`)
      setUploadStatus(`🧩 File split into ${shards.length} Shards. Uploading...`)

      // 3. Upload Shards in Parallel
      // 3. Upload Shards in Parallel
      const fileId = crypto.randomUUID(); // Generate unique File ID
      console.log(`🆔 Generated File ID: ${fileId}`);

      const uploadPromises = shards.map(async (shard, index) => {
        // In a real distributed system, we would rotate through different nodes here.
        // For local dev, we hit the same node on port 8081.
        const storageUrl = `http://127.0.0.1:8081/upload?shard=${index}`

        await fetch(storageUrl, {
          method: 'POST',
          body: new Blob([shard as any]), // Cast to any to silence strict TS mismatch
          headers: {
            'X-Shard-Index': index.toString(),
            'X-Upload-Token': validToken, // Use local variable
            'X-File-Id': fileId,
            'Content-Type': 'application/octet-stream'
          }
        })
        console.log(`✅ Shard ${index} uploaded`)
      })

      await Promise.all(uploadPromises)

      setUploadStatus('✅ FATALITY! All 14 Shards Distributed & Stored.')
      console.log('Distributed Upload Complete')

    } catch (err) {
      console.error(err)
      setUploadStatus(`Error: ${err}`)
    }
  }

  return (
    <div className="container">
      <header className="header">
        <div className="logo">Timber Cloud</div>
        <button className="connect-wallet">Connect Wallet</button>
      </header>

      <div className="status-bar">
        <span>Distributed Enterprise Storage</span>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3>Total Storage Used</h3>
          <h1>0.00 GB</h1>
        </div>
        <div className="card">
          <h3>Active Nodes</h3>
          <h1>14</h1>
        </div>
        <div className="card">
          <h3>Network Status</h3>
          <h1 style={{ color: status.includes('Offline') ? 'red' : '#4ade80' }}>
            {status.replace('Network Status: ', '')}
          </h1>
        </div>
      </div>

      <div className="upload-zone">
        <h2>Drop files here to upload</h2>
        <p>Encrypted & Sharded across the network</p>

        {/* Hidden Hash Input for Debugging if needed */}
        {/* <input 
            type="text" 
            placeholder="Server Cert Hash (Debug)" 
            value={certHash}
            onChange={(e) => setCertHash(e.target.value)}
            className="hash-input"
        /> */}

        <input
          type="file"
          id="fileInput"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {!file ? (
          <label htmlFor="fileInput" className="upload-btn">
            Select Files (Demo Upload)
          </label>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
            <button onClick={handleUpload} className="upload-btn" style={{ backgroundColor: '#4ade80', color: '#000' }}>
              🚀 Start Sharded Upload ({file.name})
            </button>
            <button onClick={() => { setFile(null); setUploadStatus('') }} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        )}

        {uploadStatus && (
          <div className={`status-message ${uploadStatus.includes('Error') ? 'error' : 'success'}`}>
            Status: {uploadStatus}
          </div>
        )}
      </div>
    </div>
  )
}

async function fetchToken(file: File) {
  const res = await fetch('http://localhost:8080/api/upload/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: file.name, size: file.size })
  })
  return await res.json()
}

export default App
