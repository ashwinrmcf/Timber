package erasure

import (
	"fmt"
	"io"
	"os"
)

const ChunkSize = 64 * 1024 * 1024 // 64MB

// ReadFileInChunks reads a large file and returns a channel of byte chunks
func ReadFileInChunks(path string) (<-chan []byte, <-chan error) {
	chunks := make(chan []byte)
	errs := make(chan error, 1)

	go func() {
		defer close(chunks)
		defer close(errs)

		file, err := os.Open(path)
		if err != nil {
			errs <- err
			return
		}
		defer file.Close()

		for {
			buf := make([]byte, ChunkSize)
			n, err := file.Read(buf)
			if err != nil {
				if err == io.EOF {
					break
				}
				errs <- err
				return
			}
			chunks <- buf[:n]
		}
	}()

	return chunks, errs
}

// WriteShard writes a single shard to disk
func WriteShard(shardID string, data []byte) error {
	return os.WriteFile(fmt.Sprintf("%s.dat", shardID), data, 0644)
}
