package transport

import (
	"bytes"
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"crypto/tls"
	"crypto/x509"
	"encoding/hex"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"io"
	"log"
	"math/big"
	"net"
	"net/http"
	"os"
	"time"

	"github.com/quic-go/quic-go/http3"
	"github.com/quic-go/webtransport-go"
	"github.com/timber/core/metadata"
	"github.com/timber/core/storage"
)

// ShardMetadata is the first JSON block sent over a WebTransport stream
type ShardMetadata struct {
	FileID    string `json:"file_id"`
	FileName  string `json:"file_name"`
	FileSize  int64  `json:"file_total_size"`
	ShardIndex int    `json:"shard_index"`
	Token     string `json:"upload_token"`
}

var (
	storageMgr *storage.Manager
	metaStore  *metadata.MetadataStore
)

// StartQUICServer starts a WebTransport (HTTP/3) listener
func StartQUICServer(addr string, s *storage.Manager, m *metadata.MetadataStore) error {
	storageMgr = s
	metaStore = m

	// Use Port 4455 if default
	if addr == ":4433" {
		addr = "127.0.0.1:4455"
	}

	tlsCert, certHash, err := generateTLSConfig()
	if err != nil {
		return err
	}

	log.Printf("🔑 SERVER CERT HASH (For Frontend): %s", certHash)
	_ = os.WriteFile("./data/.cert_hash", []byte(certHash), 0644)

	h3Server := &http3.Server{
		Addr: addr,
		TLSConfig: &tls.Config{
			Certificates: []tls.Certificate{tlsCert},
			NextProtos:   []string{"h3"}, // Required for WebTransport ALPN
		},
	}

	wt := &webtransport.Server{
		H3:          h3Server,
		CheckOrigin: func(r *http.Request) bool { return true },
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/upload", func(w http.ResponseWriter, r *http.Request) {
		log.Printf("💛 WEBTRANSPORT UPGRADE ATTEMPT FROM: %s", r.RemoteAddr)
		session, err := wt.Upgrade(w, r)
		if err != nil {
			log.Printf("Upgrade failed: %v", err)
			return
		}
		handleWebTransportSession(session)
	})

	h3Server.Handler = mux

	log.Printf("🚀 WebTransport Server listening on %s (UDP)", addr)
	return wt.ListenAndServe()
}

func handleWebTransportSession(session *webtransport.Session) {
	log.Printf("✅ Session established: %s", session.RemoteAddr())
	for {
		stream, err := session.AcceptStream(context.Background())
		if err != nil {
			break
		}
		go func(s *webtransport.Stream) {
			defer s.Close()

			// 1. Read Metadata (First 1KB should contain JSON)
			// Protocol: [JSON Metadata]\n[Binary Data]
			metaBuf := make([]byte, 1024)
			n, err := s.Read(metaBuf)
			if err != nil && err != io.EOF {
				log.Printf("❌ Failed to read metadata: %v", err)
				return
			}

			// Find newline separator (if any) or just try to parse JSON
			var meta ShardMetadata
			parts := bytes.SplitN(metaBuf[:n], []byte("\n"), 2)
			if err := json.Unmarshal(parts[0], &meta); err != nil {
				log.Printf("❌ JSON Meta Parse Error: %v | Raw: %s", err, string(parts[0]))
				return
			}

			log.Printf("📥 QUIC UPLOAD: %s | Shard %d", meta.FileID, meta.ShardIndex)

			// 2. Read Shard Data
			var shardData []byte
			if len(parts) > 1 {
				shardData = parts[1]
			}
			
			// Continue reading from stream until EOF
			remaining, err := io.ReadAll(s)
			if err != nil && err != io.EOF {
				log.Printf("❌ Data Read Error: %v", err)
				return
			}
			shardData = append(shardData, remaining...)

			// 3. Persist
			shardFilename := fmt.Sprintf("shard_%s_%d.bin", meta.FileID, meta.ShardIndex)
			if err := storageMgr.WriteShard(shardFilename, shardData); err != nil {
				log.Printf("❌ QUIC Write Failed: %v", err)
				return
			}

			// 4. Update Metadata
			metaStore.AddShard(meta.FileID, shardFilename, meta.FileName, meta.FileSize)

			log.Printf("✅ QUIC PERSISTED: %s (%d bytes)", shardFilename, len(shardData))
			s.Write([]byte("ACK: Received & Persisted Shard via QUIC"))
		}(stream)
	}
}

func generateTLSConfig() (tls.Certificate, string, error) {
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		return tls.Certificate{}, "", err
	}

	template := x509.Certificate{
		SerialNumber: big.NewInt(1),
		NotBefore:    time.Now().Add(-24 * time.Hour),
		NotAfter:     time.Now().Add(time.Hour * 24 * 7), // 7 days (must be < 14)
		IsCA:          true,
		IPAddresses:  []net.IP{net.ParseIP("127.0.0.1")},
		BasicConstraintsValid: true,
	}

	certDER, err := x509.CreateCertificate(rand.Reader, &template, &template, &key.PublicKey, key)
	if err != nil {
		return tls.Certificate{}, "", err
	}

	hash := sha256.Sum256(certDER)
	hashString := hex.EncodeToString(hash[:])

	keyBytes, _ := x509.MarshalECPrivateKey(key)
	keyPEM := pem.EncodeToMemory(&pem.Block{Type: "EC PRIVATE KEY", Bytes: keyBytes})
	certPEM := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: certDER})

	tlsCert, err := tls.X509KeyPair(certPEM, keyPEM)
	return tlsCert, hashString, err
}
