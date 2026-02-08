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

// GetAllFiles returns all stored file metadata
func (s *MetadataStore) GetAllFiles() []*FileMetadata {
	s.mu.RLock()
	defer s.mu.RUnlock()

	files := make([]*FileMetadata, 0, len(s.files))
	for _, meta := range s.files {
		files = append(files, meta)
	}
	return files
}

// AddShard appends a shard filename to the file's metadata. 
// Also sets name/size if creating for the first time.
func (s *MetadataStore) AddShard(fileID, shardFilename, name string, size int64) {
	s.mu.Lock()
	defer s.mu.Unlock()

	meta, exists := s.files[fileID]
	if !exists {
		meta = &FileMetadata{
			FileID:    fileID,
			Name:      name,
			Size:      size,
			CreatedAt: time.Now(),
			Shards:    []string{},
		}
		s.files[fileID] = meta
	}
	
	meta.Shards = append(meta.Shards, shardFilename)
}
