# Data Directory Layout & Dataset Management

This directory organizes raw audio benchmarks and processed training/validation/test manifests for the **Synthetic Voice & Audio Spoof Detection System**.

```
data/
├── raw/                  <- Place downloaded research archives (e.g., ASVspoof 2019 LA) here
├── benchmark_samples/    <- High-fidelity calibrated acoustic samples (bonafide vs spoof)
│   ├── bonafide/         <- Authentic human speech samples with dynamic vocal tract resonances
│   └── spoof/            <- Synthetic speech samples with neural vocoder & TTS artifacts
├── processed/            <- Partitioned manifests (speaker-disjoint)
│   ├── train_manifest.json
│   ├── val_manifest.json
│   ├── test_manifest.json
│   └── dataset_summary.json
├── download_guide.md     <- Step-by-step acquisition guide for ASVspoof 2019/2021 & WaveFake
├── generate_benchmark_data.py <- Generates calibrated benchmark audio corpus
├── prepare_dataset.py    <- Generates speaker-disjoint JSON manifests
└── verify_dataset.py     <- Verifies integrity, format, and zero speaker leakage
```

### Reproducing Dataset Splits:
1. Generate or place audio files into `data/benchmark_samples/` or `data/raw/LA/`.
2. Run partitioner:
   ```bash
   python data/prepare_dataset.py --source benchmark --raw_dir data/benchmark_samples --output_dir data/processed
   ```
3. Verify integrity:
   ```bash
   python data/verify_dataset.py --processed_dir data/processed
   ```
