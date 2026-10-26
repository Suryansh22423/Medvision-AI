#!/usr/bin/env python
"""
MedVision AI — Extended Deep Training Pipeline
Runs comprehensive, extended GPU training on NVIDIA RTX 3050:
1. Extended Bone / Anatomy Identifier (densenet121_anatomy.pth):
   - 12 Epochs with Cosine Annealing LR & Warmup
   - Class-balanced weighting & Advanced Medical Augmentations
2. Extended Sensitive Fracture Detector (densenet121_bone.pth):
   - 10 Epochs with Weighted Focal/Cross-Entropy (pos_weight = 3.8)
   - Cosine Annealing LR & Fracture-Specific Augmentations
"""

import os
import sys
import time
import glob
from pathlib import Path
from collections import Counter

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import torchvision.models as models
import albumentations as A
from albumentations.pytorch import ToTensorV2
import pandas as pd
import numpy as np
import cv2
from sklearn.metrics import accuracy_score, f1_score, recall_score, precision_score, classification_report
from sklearn.model_selection import StratifiedShuffleSplit

# -----------------------------------------------------------------------------
# Datasets
# -----------------------------------------------------------------------------

CLASS_NAMES = ["Hand", "Leg", "Hip", "Shoulder", "Chest"]

class ComprehensiveAnatomyDataset(Dataset):
    def __init__(self, data_csv: str, images_root: str, chest_dir: str):
        self.samples = []
        self.labels = []
        
        df = pd.read_csv(data_csv)
        img_root = Path(images_root)

        for _, row in df.iterrows():
            img_id = str(row["image_id"]).strip()
            p1 = img_root / "Fractured" / img_id
            p2 = img_root / "Non_fractured" / img_id
            target_path = str(p1) if p1.is_file() else (str(p2) if p2.is_file() else None)
            if not target_path:
                continue

            if int(row.get("shoulder", 0)) == 1:
                lbl = 3 # Shoulder
            elif int(row.get("hip", 0)) == 1:
                lbl = 2 # Hip
            elif int(row.get("hand", 0)) == 1:
                lbl = 0 # Hand
            elif int(row.get("leg", 0)) == 1:
                lbl = 1 # Leg
            else:
                lbl = 0

            self.samples.append(target_path)
            self.labels.append(lbl)

        chest_files = glob.glob(os.path.join(chest_dir, "**", "*.png"), recursive=True) + \
                      glob.glob(os.path.join(chest_dir, "**", "*.jpg"), recursive=True)
        for cf in chest_files[:380]:
            self.samples.append(cf)
            self.labels.append(4)

        counts = Counter(self.labels)
        print("\n[Anatomy Dataset Breakdown]:", flush=True)
        for idx, name in enumerate(CLASS_NAMES):
            print(f"  [{idx}] {name:10s}: {counts[idx]} radiographs", flush=True)
        print(f"  Total Indexed  : {len(self.samples)} images\n", flush=True)

    def __len__(self):
        return len(self.samples)


class SubsetWithTransform(Dataset):
    def __init__(self, full_dataset, indices, transform=None):
        self.full_dataset = full_dataset
        self.indices = indices
        self.transform = transform

    def __len__(self):
        return len(self.indices)

    def __getitem__(self, idx):
        real_idx = self.indices[idx]
        path = self.full_dataset.samples[real_idx]
        label = self.full_dataset.labels[real_idx]

        img = cv2.imread(path)
        if img is None:
            img = np.zeros((224, 224, 3), dtype=np.uint8)
        else:
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        if self.transform:
            img = self.transform(image=img)["image"]

        return img, torch.tensor(label, dtype=torch.long)


class BalancedFractureDataset(Dataset):
    def __init__(self, data_csv: str, images_root: str):
        self.samples = []
        self.labels = []
        df = pd.read_csv(data_csv)
        img_root = Path(images_root)

        pos_count = 0
        neg_count = 0

        for _, row in df.iterrows():
            img_id = str(row["image_id"]).strip()
            p1 = img_root / "Fractured" / img_id
            p2 = img_root / "Non_fractured" / img_id
            target_path = str(p1) if p1.is_file() else (str(p2) if p2.is_file() else None)
            if not target_path:
                continue

            is_frac = 1 if (int(row.get("fractured", 0)) == 1 or int(row.get("fracture_count", 0)) > 0) else 0
            if is_frac == 1:
                pos_count += 1
            else:
                neg_count += 1
            self.samples.append(target_path)
            self.labels.append(is_frac)

        self.pos_weight = neg_count / max(1, pos_count)
        print(f"[Fracture Dataset]: {len(self.samples)} images ({pos_count} fractured, {neg_count} normal). Imbalance ratio: {self.pos_weight:.2f}\n", flush=True)

    def __len__(self):
        return len(self.samples)


class FractureSubsetWithTransform(Dataset):
    def __init__(self, full_dataset, indices, transform=None):
        self.full_dataset = full_dataset
        self.indices = indices
        self.transform = transform

    def __len__(self):
        return len(self.indices)

    def __getitem__(self, idx):
        real_idx = self.indices[idx]
        path = self.full_dataset.samples[real_idx]
        label = self.full_dataset.labels[real_idx]

        img = cv2.imread(path)
        if img is None:
            img = np.zeros((224, 224, 3), dtype=np.uint8)
        else:
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        if self.transform:
            img = self.transform(image=img)["image"]

        return img, torch.tensor(label, dtype=torch.long)

# -----------------------------------------------------------------------------
# Medical Transforms
# -----------------------------------------------------------------------------

def get_train_transforms():
    return A.Compose([
        A.Resize(224, 224),
        A.HorizontalFlip(p=0.5),
        A.ShiftScaleRotate(shift_limit=0.08, scale_limit=0.10, rotate_limit=18, p=0.6, border_mode=cv2.BORDER_REFLECT),
        A.CLAHE(clip_limit=2.5, tile_grid_size=(8, 8), p=0.4),
        A.RandomBrightnessContrast(brightness_limit=0.15, contrast_limit=0.15, p=0.5),
        A.CoarseDropout(max_holes=4, max_height=28, max_width=28, min_holes=1, min_height=12, min_width=12, p=0.3),
        A.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
        ToTensorV2(),
    ])

def get_val_transforms():
    return A.Compose([
        A.Resize(224, 224),
        A.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
        ToTensorV2(),
    ])

# -----------------------------------------------------------------------------
# Training Function
# -----------------------------------------------------------------------------

def run_epoch(model, loader, criterion, optimizer, scaler, scheduler, device, is_train=True):
    if is_train:
        model.train()
    else:
        model.eval()

    total_loss = 0.0
    all_preds = []
    all_targets = []

    context = torch.enable_grad() if is_train else torch.no_grad()

    with context:
        for images, targets in loader:
            images = images.to(device, non_blocking=True)
            targets = targets.to(device, non_blocking=True)

            if is_train:
                optimizer.zero_grad(set_to_none=True)

            with torch.amp.autocast(device_type="cuda", dtype=torch.float16):
                outputs = model(images)
                loss = criterion(outputs, targets)

            if is_train:
                scaler.scale(loss).backward()
                scaler.step(optimizer)
                scaler.update()

            batch_size = images.size(0)
            total_loss += loss.item() * batch_size
            all_preds.extend(outputs.argmax(dim=1).cpu().numpy())
            all_targets.extend(targets.cpu().numpy())

    if is_train and scheduler is not None:
        scheduler.step()

    avg_loss = total_loss / max(1, len(all_targets))
    acc = accuracy_score(all_targets, all_preds)
    f1 = f1_score(all_targets, all_preds, average="weighted", zero_division=0)
    return avg_loss, acc, f1, all_preds, all_targets

# -----------------------------------------------------------------------------
# Main Routine
# -----------------------------------------------------------------------------

def main():
    repo_root = Path(__file__).resolve().parent.parent
    data_csv = repo_root / "FractureAtlas" / "FractureAtlas" / "dataset.csv"
    images_root = repo_root / "FractureAtlas" / "FractureAtlas" / "images"
    chest_dir = repo_root / "backend" / "app" / "data" / "chest"
    app_dir = repo_root / "backend" / "app"

    anatomy_model_dest = app_dir / "densenet121_anatomy.pth"
    bone_model_dest = app_dir / "densenet121_bone.pth"

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print("==================================================================", flush=True)
    print("  MEDVISION AI - EXTENDED HIGH-PERFORMANCE TRAINING WORKFLOW", flush=True)
    print("==================================================================", flush=True)
    print(f"- Device: {device} ({torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'})", flush=True)
    torch.backends.cudnn.benchmark = True

    # =========================================================================
    # PART 1: EXTENDED ANATOMICAL IDENTIFIER (12 Epochs)
    # =========================================================================
    print("\n------------------------------------------------------------------", flush=True)
    print(" [1/2] TRAINING EXTENDED BONE/ANATOMY IDENTIFIER (12 Epochs)", flush=True)
    print(" Classes: [0:Hand, 1:Leg, 2:Hip, 3:Shoulder, 4:Chest]", flush=True)
    print("------------------------------------------------------------------", flush=True)

    full_anat_ds = ComprehensiveAnatomyDataset(str(data_csv), str(images_root), str(chest_dir))
    sss_anat = StratifiedShuffleSplit(n_splits=1, test_size=0.15, random_state=42)
    train_anat_idx, val_anat_idx = next(sss_anat.split(full_anat_ds.samples, full_anat_ds.labels))

    train_anat_ds = SubsetWithTransform(full_anat_ds, train_anat_idx, transform=get_train_transforms())
    val_anat_ds = SubsetWithTransform(full_anat_ds, val_anat_idx, transform=get_val_transforms())

    train_anat_loader = DataLoader(train_anat_ds, batch_size=32, shuffle=True, pin_memory=True, num_workers=0)
    val_anat_loader = DataLoader(val_anat_ds, batch_size=32, shuffle=False, pin_memory=True, num_workers=0)

    train_anat_labels = [full_anat_ds.labels[i] for i in train_anat_idx]
    counts_anat = Counter(train_anat_labels)
    total_train_anat = len(train_anat_labels)
    anat_weights = [total_train_anat / (len(CLASS_NAMES) * max(1, counts_anat[c])) for c in range(len(CLASS_NAMES))]
    anat_weights_t = torch.tensor(anat_weights, dtype=torch.float32, device=device)

    model_anat = models.densenet121(weights=models.DenseNet121_Weights.DEFAULT)
    num_ftrs = model_anat.classifier.in_features
    model_anat.classifier = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(num_ftrs, len(CLASS_NAMES))
    )
    model_anat = model_anat.to(device)

    crit_anat = nn.CrossEntropyLoss(weight=anat_weights_t, label_smoothing=0.03)
    opt_anat = optim.AdamW(model_anat.parameters(), lr=2.5e-4, weight_decay=1e-2)
    anat_epochs = 12
    sched_anat = optim.lr_scheduler.CosineAnnealingLR(opt_anat, T_max=anat_epochs, eta_min=5e-7)
    scaler_anat = torch.amp.GradScaler("cuda")

    best_anat_f1 = 0.0
    best_anat_acc = 0.0

    print(" Epoch |  Train Loss  |  Train Acc  |   Val Loss   |  Val Acc  | Val F1  | Time", flush=True)
    for ep in range(1, anat_epochs + 1):
        t0 = time.time()
        tr_loss, tr_acc, tr_f1, _, _ = run_epoch(model_anat, train_anat_loader, crit_anat, opt_anat, scaler_anat, sched_anat, device, True)
        vl_loss, vl_acc, vl_f1, _, _ = run_epoch(model_anat, val_anat_loader, crit_anat, None, scaler_anat, None, device, False)
        t_el = time.time() - t0

        is_best = vl_f1 > best_anat_f1
        if is_best:
            best_anat_f1 = vl_f1
            best_anat_acc = vl_acc
            torch.save(model_anat.state_dict(), anatomy_model_dest)

        star = " * [SAVED]" if is_best else ""
        print(f" {ep:5d} |    {tr_loss:7.4f}   |   {tr_acc*100:6.2f}%   |    {vl_loss:7.4f}   |  {vl_acc*100:6.2f}%  |  {vl_f1:6.4f} | {t_el:5.1f}s{star}", flush=True)

    print(f"\n-> Peak Bone Identification Validation Accuracy: {best_anat_acc*100:.2f}% (F1: {best_anat_f1:.4f})\n", flush=True)

    # =========================================================================
    # PART 2: EXTENDED FRACTURE DETECTOR (10 Epochs)
    # =========================================================================
    print("------------------------------------------------------------------", flush=True)
    print(" [2/2] TRAINING EXTENDED SENSITIVE FRACTURE DETECTOR (10 Epochs)", flush=True)
    print(" Optimizing with Weighted Loss (pos_weight = 3.8) to eliminate false negatives", flush=True)
    print("------------------------------------------------------------------", flush=True)

    full_frac_ds = BalancedFractureDataset(str(data_csv), str(images_root))
    sss_frac = StratifiedShuffleSplit(n_splits=1, test_size=0.15, random_state=42)
    train_frac_idx, val_frac_idx = next(sss_frac.split(full_frac_ds.samples, full_frac_ds.labels))

    train_frac_ds = FractureSubsetWithTransform(full_frac_ds, train_frac_idx, transform=get_train_transforms())
    val_frac_ds = FractureSubsetWithTransform(full_frac_ds, val_frac_idx, transform=get_val_transforms())

    train_frac_loader = DataLoader(train_frac_ds, batch_size=32, shuffle=True, pin_memory=True, num_workers=0)
    val_frac_loader = DataLoader(val_frac_ds, batch_size=32, shuffle=False, pin_memory=True, num_workers=0)

    model_frac = models.densenet121(weights=models.DenseNet121_Weights.DEFAULT)
    num_ftrs_f = model_frac.classifier.in_features
    model_frac.classifier = nn.Sequential(
        nn.Dropout(p=0.35),
        nn.Linear(num_ftrs_f, 2)
    )
    model_frac = model_frac.to(device)

    # Balanced class weights: Normal: 1.0, Fracture: 3.8
    frac_weights = torch.tensor([1.0, 3.8], device=device)
    crit_frac = nn.CrossEntropyLoss(weight=frac_weights, label_smoothing=0.03)
    opt_frac = optim.AdamW(model_frac.parameters(), lr=1.8e-4, weight_decay=1e-2)
    frac_epochs = 10
    sched_frac = optim.lr_scheduler.CosineAnnealingLR(opt_frac, T_max=frac_epochs, eta_min=5e-7)
    scaler_frac = torch.amp.GradScaler("cuda")

    best_frac_score = 0.0

    print(" Epoch |  Train Loss  |  Train Acc  |   Val Loss   |  Val Acc  | Recall  | Time", flush=True)
    for ep in range(1, frac_epochs + 1):
        t0 = time.time()
        tr_loss, tr_acc, _, _, _ = run_epoch(model_frac, train_frac_loader, crit_frac, opt_frac, scaler_frac, sched_frac, device, True)
        vl_loss, vl_acc, vl_f1, preds, targets = run_epoch(model_frac, val_frac_loader, crit_frac, None, scaler_frac, None, device, False)
        rec = recall_score(targets, preds, pos_label=1, zero_division=0)
        t_el = time.time() - t0

        # Balanced score: 50% accuracy + 50% positive fracture recall
        combined_score = 0.5 * vl_acc + 0.5 * rec
        is_best = combined_score > best_frac_score
        if is_best:
            best_frac_score = combined_score
            torch.save(model_frac.state_dict(), bone_model_dest)

        star = " * [SAVED]" if is_best else ""
        print(f" {ep:5d} |    {tr_loss:7.4f}   |   {tr_acc*100:6.2f}%   |    {vl_loss:7.4f}   |  {vl_acc*100:6.2f}%  | {rec*100:6.2f}% | {t_el:5.1f}s{star}", flush=True)

    print("\n==================================================================", flush=True)
    print("  EXTENDED DEEP TRAINING COMPLETED SUCCESSFULLY!", flush=True)
    print(f"- Bone Identification Model Deployed: {anatomy_model_dest}", flush=True)
    print(f"- Sensitive Fracture Model Deployed: {bone_model_dest}", flush=True)
    print("==================================================================\n", flush=True)

if __name__ == "__main__":
    main()
