package main

import (
	"fmt"
	"log"
	"net/http"
	"io"
	"time"
	"strings"
	"encoding/json"

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
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Upload-Token, X-Shard-Index, X-File-Id, X-File-Name, X-File-Total-Size")
		
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


		// Metadata Headers
		fileName := r.Header.Get("X-File-Name")
		fileSizeStr := r.Header.Get("X-File-Total-Size")
		var fileSize int64
		fmt.Sscanf(fileSizeStr, "%d", &fileSize)

		// Update Metadata
		metaStore.AddShard(fileID, filename, fileName, fileSize)
		
		log.Printf("✅ PERSISTED: %s (%d bytes)", filename, len(data))
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Upload Received & Saved"))
	})

	// Serve Raw Shard Data (for download)
	// e.g. http://localhost:8081/data/shard_abc_0.bin
	fs := http.FileServer(http.Dir("./data"))
	// Wrap in CORS handler
	http.Handle("/data/", http.StripPrefix("/data/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		fs.ServeHTTP(w, r)
	})))

	// Get File Metadata (List all or get specific)
	// e.g. http://localhost:8081/files/ (List All)
	// e.g. http://localhost:8081/files/abc-123 (Get One)
	http.HandleFunc("/files/", func(w http.ResponseWriter, r *http.Request) {
		// CORS
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Content-Type", "application/json")
		
		if r.Method == "OPTIONS" {
			return
		}

		fileID := strings.TrimPrefix(r.URL.Path, "/files/")
		
		// If no ID provided, list all files
		if fileID == "" {
			files := metaStore.GetAllFiles()
			json.NewEncoder(w).Encode(files)
			return
		}

		// Otherwise get specific file
		meta, exists := metaStore.GetFile(fileID)
		if !exists {
			http.Error(w, "File Not Found", http.StatusNotFound)
			return
		}

		json.NewEncoder(w).Encode(meta)
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
