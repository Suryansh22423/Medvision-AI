import os
import torchxrayvision as xrv
import shutil

# Destination folder
dest = r'd:\med-vision-ai-clarity\backend\data\chest'
os.makedirs(dest, exist_ok=True)

print('Downloading NIH ChestX-ray14 dataset (this may take several minutes)...')
# This will download images and CSV metadata if not already present
nih = xrv.datasets.NIH_Dataset(imgpath=dest)
print('Download complete.')

# Locate the CSV file (provided by torchxrayvision)
# It may be stored in the default cache directory
cache_dir = os.path.expanduser('~/.torchxrayvision')
csv_candidates = [
    os.path.join(cache_dir, 'models_data', 'nih.csv'),
    os.path.join(cache_dir, 'nih.csv')
]
csv_path = next((p for p in csv_candidates if os.path.isfile(p)), None)
if csv_path:
    shutil.copy(csv_path, os.path.join(dest, 'annotations.csv'))
    print(f'Copied annotations CSV to {dest}')
else:
    print('Warning: Could not locate NIH CSV file; annotations may be missing.')
