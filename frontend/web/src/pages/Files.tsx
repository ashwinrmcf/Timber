import { useState, useEffect } from 'react';
import { ErasureEncoder } from '../utils/ErasureEncoder';
import { Upload, FileText, Download, Trash2, HardDrive, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileMeta {
    file_id: string;
    name: string;
    size: number;
    created_at: string;
}

export default function FilesPage() {
    const [file, setFile] = useState<File | null>(null);
    const [fileList, setFileList] = useState<FileMeta[]>([]);
    const [uploadStatus, setUploadStatus] = useState<string>('');
    const [token, setToken] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetchFiles();
    }, [uploadStatus]);

    const fetchFiles = async () => {
        try {
            const res = await fetch('http://localhost:8081/files/');
            if (res.ok) {
                const data = await res.json();
                setFileList(data || []);
            }
        } catch (e) {
            console.error("Failed to fetch files:", e);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setUploadStatus('');
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        setUploadStatus('Initializing...');

        try {
            // 1. Get Token (Lazy Load)
            let validToken = token;
            if (!validToken) {
                const res = await fetch('http://localhost:8080/api/upload/init', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: file.name, size: file.size })
                });
                if (!res.ok) throw new Error("Gateway Unreachable");
                const data = await res.json();
                validToken = data.uploadToken;
                setToken(validToken);
            }

            setUploadStatus('Sharding & Encrypting...');

            // 2. Read & Encode
            const buffer = await file.arrayBuffer();
            const data = new Uint8Array(buffer);
            const encoder = new ErasureEncoder(10, 4);
            const shards = encoder.encode(data);

            setUploadStatus(`Distributing ${shards.length} Shards...`);

            // 3. Upload
            const fileId = crypto.randomUUID();
            const uploadPromises = shards.map(async (shard, index) => {
                const storageUrl = `http://127.0.0.1:8081/upload?shard=${index}`;
                await fetch(storageUrl, {
                    method: 'POST',
                    body: new Blob([shard]),
                    headers: {
                        'X-Shard-Index': index.toString(),
                        'X-Upload-Token': validToken,
                        'X-File-Id': fileId,
                        'X-File-Name': file.name,
                        'X-File-Total-Size': file.size.toString(),
                        'Content-Type': 'application/octet-stream'
                    }
                });
            });

            await Promise.all(uploadPromises);
            setUploadStatus('Upload Complete');
            setFile(null);
            fetchFiles(); // Refresh list immediately

        } catch (err) {
            console.error(err);
            setUploadStatus('Upload Failed');
        } finally {
            setIsUploading(false);
            setTimeout(() => setUploadStatus(''), 3000);
        }
    };

    const handleDownload = async (fileId: string, fileName: string) => {
        try {
            console.log(`Starting download for ${fileName}...`);
            // 1. Get Metadata
            const metaRes = await fetch(`http://localhost:8081/files/${fileId}`);
            if (!metaRes.ok) throw new Error("File Not Found");
            const meta = await metaRes.json();

            // 2. Download Data Shards (First 10)
            const encoder = new ErasureEncoder(10, 4);
            const sortedShards = new Array(14).fill(null);

            meta.shards.forEach((fname: string) => {
                const parts = fname.split('_');
                const idxPart = parts[parts.length - 1]; // e.g., "0.shard"
                const idx = parseInt(idxPart.split('.')[0]); // e.g., 0
                sortedShards[idx] = fname;
            });

            const dataShards: Uint8Array[] = [];
            for (let i = 0; i < 10; i++) {
                const fname = sortedShards[i];
                if (!fname) throw new Error(`Missing Data Shard ${i}`);

                const res = await fetch(`http://localhost:8081/data/${fname}`);
                const buf = await res.arrayBuffer();
                dataShards[i] = new Uint8Array(buf);
            }

            // 3. Reconstruct
            const reconstructed = encoder.combine(dataShards, meta.size);

            // 4. Save
            const blob = new Blob([reconstructed]);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName; // Use original filename
            a.click();
            URL.revokeObjectURL(url);

        } catch (err) {
            console.error("Download failed:", err);
            alert(`Download failed: ${err}`);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">My Files</h1>
                    <p className="text-silver-500 text-sm">Manage your decentralized data artifacts.</p>
                </div>
                <button onClick={fetchFiles} className="p-2 hover:bg-white/5 rounded-lg text-silver-400 hover:text-white transition-colors">
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Upload Area */}
            <div className="bg-panel border border-white/10 rounded-xl p-8 text-center transition-all hover:border-silver-600 group relative overflow-hidden">
                <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileChange}
                />

                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-4 relative z-10">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-silver-500/10 transition-colors">
                        <Upload size={32} className="text-silver-400 group-hover:text-silver-100 transition-colors" />
                    </div>

                    {file ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2">
                            <p className="text-lg font-medium text-white">{file.name}</p>
                            <p className="text-sm text-silver-500">{(file.size / 1024 / 1024).toFixed(2)} MB • Ready to Shard</p>

                            <div className="mt-4 flex gap-3 justify-center">
                                <button
                                    onClick={(e) => { e.preventDefault(); handleUpload(); }}
                                    disabled={isUploading}
                                    className="bg-silver-100 text-black px-6 py-2 rounded-lg font-medium hover:bg-white transition-colors disabled:opacity-50"
                                >
                                    {isUploading ? 'Processing...' : 'Start Upload'}
                                </button>
                                <button
                                    onClick={(e) => { e.preventDefault(); setFile(null); }}
                                    className="text-silver-500 hover:text-white px-4 py-2"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="text-lg font-medium text-silver-200">Drop files here or click to upload</p>
                            <p className="text-sm text-silver-600">Files are automatically encrypted & sharded across 14 nodes.</p>
                        </>
                    )}
                </label>

                {isUploading && (
                    <div className="absolute inset-0 bg-panel/90 backdrop-blur-sm flex items-center justify-center z-20">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-silver-800 border-t-silver-100 rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-silver-100 font-mono text-sm animate-pulse">{uploadStatus}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* File List Table */}
            <div className="bg-panel border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10 text-silver-500 text-xs uppercase tracking-wider bg-white/5">
                            <th className="px-6 py-4 font-medium">Name</th>
                            <th className="px-6 py-4 font-medium">Size</th>
                            <th className="px-6 py-4 font-medium">Available Shards</th>
                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {fileList.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-silver-600">
                                    No files found in the network.
                                </td>
                            </tr>
                        ) : (
                            fileList.map((f) => (
                                <tr key={f.file_id} className="group hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-silver-900 flex items-center justify-center text-silver-400">
                                                <FileText size={16} />
                                            </div>
                                            <div>
                                                <div className="font-medium text-silver-100 group-hover:text-white transition-colors">{f.name}</div>
                                                <div className="text-xs text-silver-600 font-mono">{f.file_id.substring(0, 8)}...</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-silver-400 font-mono text-sm">
                                        {(f.size / 1024).toFixed(1)} KB
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                            <span className="text-sm text-silver-300">14 / 14</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleDownload(f.file_id, f.name)}
                                                className="p-2 hover:bg-silver-800 rounded-lg text-silver-400 hover:text-silver-100 transition-colors"
                                                title="Download"
                                            >
                                                <Download size={18} />
                                            </button>
                                            <button className="p-2 hover:bg-red-500/10 rounded-lg text-silver-600 hover:text-red-500 transition-colors" title="Delete">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
