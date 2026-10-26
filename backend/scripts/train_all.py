import os
import sys
import shutil
import subprocess
import torch

def print_resources():
    """Print the number of CPU cores and CUDA devices available."""
    print(f"CPU cores: {os.cpu_count()}, CUDA devices: {torch.cuda.device_count()}")

def run_training(model, data_dir, annotations, output_dir):
    """Run the training pipeline for a given model.

    Args:
        model (str): 'chest' or 'bone'.
        data_dir (str): Path to image directory.
        annotations (str): Path to the CSV annotation file.
        output_dir (str): Directory where checkpoints will be saved.
    """
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    cmd = [
        sys.executable,
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "train_pipeline.py")),
        "--model", model,
        "--data-dir", data_dir,
        "--annotations", annotations,
        "--epochs", "50",
        "--batch-size", "16",
        "--output-dir", output_dir,
    ]
    print(f"Running training for {model} model...")
    subprocess.run(cmd, check=True)
    # After training, copy the final checkpoint to the app directory for inference
    checkpoint_path = os.path.join(output_dir, "checkpoint_epoch50.pth")
    if os.path.isfile(checkpoint_path):
        dest_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app", f"densenet121_{model}.pth"))
        shutil.copy(checkpoint_path, dest_path)
        print(f"Copied {model} checkpoint to {dest_path}")
    else:
        print(f"Warning: checkpoint not found at {checkpoint_path}")

def main():
    print_resources()
    # Chest model training
    run_training(
        "chest",
        r"d:\\med-vision-ai-clarity\\backend\\data\\chest\\images",
        r"d:\\med-vision-ai-clarity\\backend\\data\\chest\\annotations.csv",
        r"d:\\med-vision-ai-clarity\\backend\\trained_models\\chest",
    )
    # Bone model training
    run_training(
        "bone",
        r"d:\\med-vision-ai-clarity\\backend\\data\\bone\\FractureAtlas\\images",
        r"d:\\med-vision-ai-clarity\\backend\\data\\bone\\annotations.csv",
        r"d:\\med-vision-ai-clarity\\backend\\trained_models\\bone",
    )

if __name__ == "__main__":
    main()
