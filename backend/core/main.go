package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	fmt.Println("🌲 Timber Storage Node Starting...")

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status": "ok", "service": "storage-core"}`))
	})

	log.Println("Storage Node listening on :8081")
	log.Fatal(http.ListenAndServe(":8081", nil))
}
