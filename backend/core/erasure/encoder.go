package erasure

import (
	"bytes"
	"fmt"
	"io"

	"github.com/klauspost/reedsolomon"
)

// Encoder handles splitting data into shards
type Encoder struct {
	dataShards   int
	parityShards int
	enc          reedsolomon.Encoder
}

// NewEncoder creates a standard 10+4 encoder
func NewEncoder() (*Encoder, error) {
	enc, err := reedsolomon.New(10, 4)
	if err != nil {
		return nil, err
	}
	return &Encoder{
		dataShards:   10,
		parityShards: 4,
		enc:          enc,
	}, nil
}

// Encode splits a byte array into shards (Data + Parity)
func (e *Encoder) Encode(data []byte) ([][]byte, error) {
	// Split the data into shards
	shards, err := e.enc.Split(data)
	if err != nil {
		return nil, fmt.Errorf("split failed: %v", err)
	}

	// Encode parity
	if err := e.enc.Encode(shards); err != nil {
		return nil, fmt.Errorf("encode failed: %v", err)
	}

	return shards, nil
}

// Verify checks if shards are intact
func (e *Encoder) Verify(shards [][]byte) (bool, error) {
	ok, err := e.enc.Verify(shards)
	return ok, err
}

// Reconstruct recovers missing shards
func (e *Encoder) Reconstruct(shards [][]byte) error {
	return e.enc.Reconstruct(shards)
}

// Join combines shards back into data
func (e *Encoder) Join(shards [][]byte, out io.Writer) error {
	return e.enc.Join(out, shards, len(shards[0])*e.dataShards)
}
