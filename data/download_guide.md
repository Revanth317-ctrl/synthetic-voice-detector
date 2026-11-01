# Research Dataset Acquisition and Integration Guide

This document describes how to obtain and integrate official public research datasets for training and benchmarking the **Synthetic Voice and Audio Spoof Detection System**.

---

## 1. Supported Research Datasets

### A. ASVspoof 2019 Logical Access (LA) - Primary Dataset
- **Description**: Standard benchmark containing human bonafide speech and spoofed speech generated via 17 distinct speech synthesis (TTS) and voice conversion (VC) algorithms (A01 to A19).
- **Official Portal**: https://www.asvspoof.org/
- **Direct Zenodo Mirror**: https://zenodo.org/records/4835108 (or academic mirror)
- **Archive Size**: ~15 GB compressed.
- **Directory Layout Expected**:
  ```
  data/raw/LA/
  ├── ASVspoof2019_LA_cm_protocols/
  │   ├── ASVspoof2019.LA.cm.train.trn.txt
  │   ├── ASVspoof2019.LA.cm.dev.trl.txt
  │   └── ASVspoof2019.LA.cm.eval.trl.txt
  ├── ASVspoof2019_LA_train/
  │   └── flac/ (e.g., LA_T_1000137.flac)
  ├── ASVspoof2019_LA_dev/
  │   └── flac/
  └── ASVspoof2019_LA_eval/
      └── flac/
  ```

#### Protocol Format:
```
[SPEAKER_ID] [AUDIO_FILE_NAME] [SYSTEM_ID] [-] [KEY]
LA_0079 LA_T_1138215 - - bonafide
LA_0079 LA_T_1271820 A01 - spoof
```
- `KEY`: `bonafide` (genuine human) or `spoof` (synthetic / converted voice)
- `SPEAKER_ID`: Used for strict speaker-disjoint splitting to guarantee zero speaker leakage across train/validation/test sets.

---

### B. ASVspoof 2021 Deepfake (DF) - Generalization Evaluation
- **Description**: Evaluates detection under audio compression artifacts (MP3, OGG, AAC) and diverse neural vocoders.
- **Source**: https://zenodo.org/records/5642694
- **Directory Layout Expected**:
  ```
  data/raw/DF/
  ├── keys/
  │   └── CM/trial_metadata.txt
  └── flac/
  ```

---

### C. WaveFake - Multi-Architecture Neural Vocoder Dataset
- **Description**: Real voices from LJSpeech and JSUT paired with synthetic replicas from MelGAN, Parallel WaveGAN, Multi-band MelGAN, HiFi-GAN, and WaveGlow.
- **Source**: https://zenodo.org/records/5642694
- **Zenodo DOI**: 10.5281/zenodo.5642694

---

## 2. Dataset Preparation Steps

1. Download the archive(s) into `data/raw/`.
2. Extract the archive contents:
   ```bash
   # Example:
   tar -xvf LA.zip -C data/raw/
   ```
3. Run the dataset preparation script:
   ```bash
   python data/prepare_dataset.py --source asvspoof2019 --raw_dir data/raw/LA --output_dir data/processed
   ```
4. Verify the generated splits and manifest:
   ```bash
   python data/verify_dataset.py --processed_dir data/processed
   ```

---

## 3. Calibrated Benchmark Dataset

For quick-start development and testing when 15-30 GB research archives are still downloading or when running in constrained environments, this repository includes:
```bash
python data/generate_benchmark_data.py --samples_per_class 60 --output_dir data/benchmark_samples
python data/prepare_dataset.py --source benchmark --raw_dir data/benchmark_samples --output_dir data/processed
```
This generates genuine acoustic speech samples alongside multi-technique synthetic voice spoofs (spectral phase distortion, robotic pitch quantization, vocoder high-frequency smoothing, and unnatural silence pauses) to train, evaluate, and test the deep learning models with zero random simulation.
