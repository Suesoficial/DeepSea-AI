def count_sequences(fasta_file):
    """Count number of sequences (headers starting with '>') in the FASTA file."""
    count = 0
    with open(fasta_file, 'r') as f:
        for line in f:
            if line.startswith('>'):
                count += 1
    return count

def split_fasta(input_fasta, num_chunks=10, output_prefix="chunked-sample-"):
    """Split input FASTA into num_chunks files with approx equal sequences per file."""
    total_seqs = count_sequences(input_fasta)
    chunk_size = (total_seqs + num_chunks - 1) // num_chunks  # Ceiling division

    print(f"Total sequences: {total_seqs}")
    print(f"Splitting into {num_chunks} chunks, ~{chunk_size} sequences per chunk.")

    count = 0
    file_index = 1
    output_file = None

    with open(input_fasta, 'r') as infile:
        for line in infile:
            if line.startswith('>'):
                if count % chunk_size == 0:
                    if output_file:
                        output_file.close()
                    output_filename = f"{output_prefix}{file_index}.fasta"
                    output_file = open(output_filename, 'w')
                    print(f"Creating {output_filename}")
                    file_index += 1
                count += 1
            if output_file:
                output_file.write(line)

        if output_file:
            output_file.close()


if __name__ == "__main__":
    input_fasta_path = r"C:\Users\joshua moses\DeepSea-AI\data\raw\deepsea-sample-2.fasta"
    split_fasta(input_fasta_path, num_chunks=10)
