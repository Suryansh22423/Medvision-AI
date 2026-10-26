import csv
import os
from pathlib import Path

# Paths
csv_path = Path(r'd:/med-vision-ai-clarity/backend/data/bone/FractureAtlas/dataset.csv')
images_root = Path(r'd:/med-vision-ai-clarity/backend/data/bone/FractureAtlas/images')
output_csv = Path(r'd:/med-vision-ai-clarity/backend/data/bone/annotations.csv')

# Ensure output directory exists
output_csv.parent.mkdir(parents=True, exist_ok=True)

# Mapping: use 'fracture_count' column to decide label
with open(csv_path, newline='') as f_in, open(output_csv, 'w', newline='') as f_out:
    reader = csv.DictReader(f_in)
    writer = csv.writer(f_out)
    # Write header expected by BoneDataset: image_path,label
    writer.writerow(['image_path', 'label'])
    for row in reader:
        image_id = row['image_id']
        # Determine label
        label = 'No fracture detected' if int(row.get('fracture_count', '0')) == 0 else 'Transverse fracture'
        # Image path relative to images_root
        image_path = f'FractureAtlas/images/{image_id}'
        writer.writerow([image_path, label])
print(f'Generated bone annotations at {output_csv}')
