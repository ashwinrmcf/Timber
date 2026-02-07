import express from 'express';
import KSUID from 'ksuid';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// In-memory database for demo (would be Redis/Postgres)
interface FileSession {
    id: string;
    name: string;
    size: number;
    shards: number;
}
const sessions: Record<string, FileSession> = {};

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'gateway', timestamp: new Date().toISOString() });
});

// Step 1: Client requests to upload a file
app.post('/api/upload/init', async (req, res) => {
    const { name, size } = req.body;

    if (!name || !size) {
        return res.status(400).json({ error: 'Missing name or size' });
    }

    const fileId = await KSUID.random();
    const id = fileId.string;

    sessions[id] = {
        id,
        name,
        size,
        shards: 14 // 10 data + 4 parity
    };

    console.log(`[Gateway] New Upload Session: ${id} (${name})`);

    res.json({
        fileId: id,
        // The "Bifurcation" Protocol:
        // 1. Data Shards (90%) -> Go to Edge Nodes via QUIC
        // 2. Parity Shards (10%) -> Go to Core via HTTPS (Reliable fallback)
        targets: {
            dateShards: [
                `quic://node-alpha.timber.network:4433/upload/${id}`,
                `quic://node-beta.timber.network:4433/upload/${id}`,
                `quic://node-gamma.timber.network:4433/upload/${id}`
            ],
            parityShards: [
                `https://core.timber.network/upload/${id}/parity`
            ]
        },
        shardingConfig: {
            dataShards: 10,
            parityShards: 4
        }
    });
});

app.listen(PORT, () => {
    console.log(`🌲 Timber Gateway running on port ${PORT}`);
});
