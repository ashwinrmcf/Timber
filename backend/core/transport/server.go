package transport

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"crypto/tls"
	"crypto/x509"
	"encoding/hex"
	"encoding/pem"
	"log"
	"math/big"
	"net"
	"net/http"
	"time"

	"github.com/quic-go/quic-go/http3"
	"github.com/quic-go/webtransport-go"
)

// StartQUICServer starts a WebTransport (HTTP/3) listener
func StartQUICServer(addr string) error {
	// Use Port 4455 if default
	if addr == ":4433" {
		addr = "127.0.0.1:4455"
	}

	tlsCert, certHash, err := generateTLSConfig()
	if err != nil {
		return err
	}

	log.Printf("🔑 SERVER CERT HASH (For Frontend): %s", certHash)

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
			buf := make([]byte, 4096)
			n, _ := s.Read(buf)
			log.Printf("📥 Received %d bytes via WebTransport", n)
			s.Write([]byte("ACK: Received Shard via WebTransport"))
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
