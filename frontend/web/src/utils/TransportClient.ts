// @ts-ignore
declare const WebTransport: any;

export class TransportClient {
  private url: string;
  private transport: any; // WebTransport type is experimental in TS
  private writer: any;

  constructor(url: string, certificateHash: string) {
    this.url = url;

    // Clean hash (remove newlines/spaces)
    const cleanHash = certificateHash.replace(/[^a-fA-F0-9]/g, '');
    console.log(`Original Hash: ${certificateHash}`);
    console.log(`Cleaned Hash: ${cleanHash}`);

    const hashBytes = this.hexToBytes(cleanHash);
    console.log(`Hash Length: ${hashBytes.length} bytes (Should be 32)`);

    // @ts-ignore - WebTransport is new
    this.transport = new WebTransport(url, {
      serverCertificateHashes: [{
        algorithm: "sha-256",
        value: hashBytes
      }]
    });
  }

  async connect() {
    await this.transport.ready;
    console.log("🚀 WebTransport Connected!");
    const stream = await this.transport.createBidirectionalStream();
    this.writer = stream.writable.getWriter();
    this.readLoop(stream.readable.getReader());
  }

  async uploadShard(data: Uint8Array) {
    await this.writer.write(data);
    console.log(`Sent ${data.length} bytes`);
  }

  private async readLoop(reader: any) {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      console.log("Server wrote:", new TextDecoder().decode(value));
    }
  }

  private hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
  }
}
