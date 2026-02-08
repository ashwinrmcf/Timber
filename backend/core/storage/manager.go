package storage

import (
	"fmt"
	"os"
	"path/filepath"
	"sync"
)

type Manager struct {
	DataDir string
	mu      sync.Mutex
}

// NewManager creates a storage manager that writes to the specified directory
func NewManager(dataDir string) (*Manager, error) {
	// Create directory if not exists
	if _, err := os.Stat(dataDir); os.IsNotExist(err) {
		if err := os.MkdirAll(dataDir, 0755); err != nil {
			return nil, fmt.Errorf("failed to create data dir: %w", err)
		}
	}

	return &Manager{
		DataDir: dataDir,
	}, nil
}

// WriteShard writes a binary shard to disk
func (m *Manager) WriteShard(shardID string, data []byte) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Prevent directory traversal
	filename := filepath.Base(shardID)
	path := filepath.Join(m.DataDir, filename)

	// Write file (0644 = rw-r--r--)
	return os.WriteFile(path, data, 0644)
}

// ReadShard reads a shard from disk (for future download logic)
func (m *Manager) ReadShard(shardID string) ([]byte, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	filename := filepath.Base(shardID)
	path := filepath.Join(m.DataDir, filename)

	return os.ReadFile(path)
}
