package main

import (
	"fmt"
	"log"
	"net/http"
	"github.com/timber/core/transport"
)

func main() {
	fmt.Println("🌲 Timber Storage Node Starting...")

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status": "ok", "service": "storage-core"}`))
	})

	// Start QUIC Transport in a goroutine
	go func() {
		if err := transport.StartQUICServer(":4433"); err != nil {
			log.Fatalf("QUIC Server failed: %v", err)
		}
	}()

	log.Println("Storage Node listening on :8081 (HTTP) and :4433 (QUIC)")
	log.Fatal(http.ListenAndServe(":8081", nil))
}
