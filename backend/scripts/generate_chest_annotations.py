import csv
from pathlib import Path

# Paths
metadata_path = Path(r'd:/med-vision-ai-clarity/backend/data/chest/metadata.csv')
images_root = Path(r'd:/med-vision-ai-clarity/backend/data/chest/images')
output_csv = Path(r'd:/med-vision-ai-clarity/backend/data/chest/annotations.csv')

# Ensure output directory exists
output_csv.parent.mkdir(parents=True, exist_ok=True)

# Read metadata and create multi-label annotations (semicolon separated list)
with open(metadata_path, newline='') as f_in, open(output_csv, 'w', newline='') as f_out:
    reader = csv.DictReader(f_in)
    writer = csv.writer(f_out)
    # Header expected by ChestDataset: image_path, labels
    writer.writerow(['image_path', 'labels'])
    for row in reader:
        filename = row['filename']
        finding = row['finding']
        # Use the finding as a single label; if 'No Finding' keep it
        labels = finding if finding else 'No Finding'
        writer.writerow([f'images/{filename}', labels])
print(f'Generated chest annotations at {output_csv}')
