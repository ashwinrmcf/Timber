package main

import (
	"fmt"
	"log"
	"net/http"
	"io"
	"time"

	"github.com/timber/core/transport"
	"github.com/timber/core/storage"
	"github.com/timber/core/metadata"
)

func main() {
	fmt.Println("🌲 Timber Storage Node Starting...")


	// Initialize Storage Manager
	store, err := storage.NewManager("./data")
	if err != nil {
		log.Fatalf("❌ Failed to init storage: %v", err)
	}

	// Initialize Metadata Store (In-Memory for now)
	metaStore := metadata.NewStore()

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Write([]byte(`{"status": "ok", "service": "storage-core"}`))
	})

	http.HandleFunc("/upload", func(w http.ResponseWriter, r *http.Request) {
		// CORS
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Upload-Token, X-Shard-Index, X-File-Id")
		
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		shardIndex := r.Header.Get("X-Shard-Index")
		// Use a mock FileID for demo if not provided, or derive from Token
		fileID := r.Header.Get("X-File-Id") 
		if fileID == "" {
			fileID = "demo_file_123" 
		}

		if shardIndex == "" {
			shardIndex = fmt.Sprintf("unknown_%d", time.Now().UnixNano())
		}
		
		filename := fmt.Sprintf("shard_%s_%s.bin", fileID, shardIndex)

		log.Printf("📥 HTTP UPLOAD: File %s | Shard %s", fileID, shardIndex)
		
		data, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "Failed to read body", http.StatusInternalServerError)
			return
		}

		if err := store.WriteShard(filename, data); err != nil {
			log.Printf("❌ Write Failed: %v", err)
			http.Error(w, "Disk Write Error", http.StatusInternalServerError)
			return
		}

		// Update Metadata
		// In a real system, we would lock and update the list of shards for this FileID
		// For this MVP, we just log it, but we should add it to the store
		// metaStore.AddShard(fileID, filename) -- (We need to implement AddShard in store.go first)
		
		log.Printf("✅ PERSISTED: %s (%d bytes)", filename, len(data))
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Upload Received & Saved"))
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
