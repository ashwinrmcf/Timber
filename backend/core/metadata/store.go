package metadata

import (
	"sync"
	"time"
)

// FileMetadata stores info about a stored file
type FileMetadata struct {
	FileID    string    `json:"file_id"`
	Name      string    `json:"name"`
	Size      int64     `json:"size"`
	Shards    []string  `json:"shards"` // List of shard filenames on disk
	CreatedAt time.Time `json:"created_at"`
}

type MetadataStore struct {
	files map[string]*FileMetadata
	mu    sync.RWMutex
}

func NewStore() *MetadataStore {
	return &MetadataStore{
		files: make(map[string]*FileMetadata),
	}
}

func (s *MetadataStore) SaveFile(meta *FileMetadata) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.files[meta.FileID] = meta
}

func (s *MetadataStore) GetFile(fileID string) (*FileMetadata, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	meta, ok := s.files[fileID]
	return meta, ok
}
