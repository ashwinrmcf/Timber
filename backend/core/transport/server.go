package transport

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/tls"
	"crypto/x509"
	"encoding/hex"
	"encoding/pem"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"time"

	"github.com/quic-go/quic-go/http3"
	"github.com/quic-go/webtransport-go"
)

// StartQUICServer starts a WebTransport (HTTP/3) listener
func StartQUICServer(addr string) error {
	// 1. Generate TLS Certs (Required for QUIC/WebTransport)
	tlsCert, certHash, err := generateTLSConfig()
	if err != nil {
		return err
	}

	taskList := []string{
		fmt.Sprintf("🔑 SERVER CERT HASH (For Frontend): %s", certHash),
		"---------------------------------------------------",
	}
	for _, msg := range taskList {
		log.Println(msg)
	}

	// 2. Setup WebTransport Server
	wt := webtransport.Server{
		H3: http3.Server{
			Addr: addr,
			TLSConfig: &tls.Config{
				Certificates: []tls.Certificate{tlsCert},
			},
		},
		CheckOrigin: func(r *http.Request) bool { return true }, // Allow all origins for dev
	}

	// 3. Define Handler
	http.HandleFunc("/upload", func(w http.ResponseWriter, r *http.Request) {
		session, err := wt.Upgrade(w, r)
		if err != nil {
			log.Printf("Upgrade failed: %s", err)
			w.WriteHeader(500)
			return
		}
		handleWebTransportSession(session)
	})

	log.Printf("🚀 WebTransport Server listening on %s (UDP)", addr)
	
	// 4. Start Serving
	return wt.ListenAndServe()
}

func handleWebTransportSession(session *webtransport.Session) {
	log.Printf("New WebTransport Session: %s", session.RemoteAddr())

	for {
		stream, err := session.AcceptStream(context.Background())
		if err != nil {
			log.Printf("Stream error: %v", err)
			break
		}
		
		go func(s webtransport.Stream) {
			defer s.Close()
			buf := make([]byte, 1024)
			n, err := s.Read(buf)
			if err != nil {
				return
			}
			log.Printf("Received %d bytes via WebTransport", n)
			s.Write([]byte("ACK: Received Shard via WebTransport"))
		}(stream)
	}
}

// generateTLSConfig creates a self-signed cert and returns the hash for the frontend
func generateTLSConfig() (tls.Certificate, string, error) {
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return tls.Certificate{}, "", err
	}
	template := x509.Certificate{
		SerialNumber: big.NewInt(1),
		NotBefore:    time.Now(),
		NotAfter:     time.Now().Add(time.Hour * 24 * 14), // 2 weeks
		DNSNames:     []string{"localhost"},
	}
	certDER, err := x509.CreateCertificate(rand.Reader, &template, &template, &key.PublicKey, key)
	if err != nil {
		return tls.Certificate{}, "", err
	}
	
	// Calculate SHA-256 Hash for the frontend
	hash := sha256.Sum256(certDER)
	hashString := hex.EncodeToString(hash[:])

	keyPEM := pem.EncodeToMemory(&pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(key)})
	certPEM := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: certDER})

	tlsCert, err := tls.X509KeyPair(certPEM, keyPEM)
	return tlsCert, hashString, err
}
