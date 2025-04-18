import os
import shutil
import random

def split_data(dataset_path, output_path, train_ratio=0.8, val_ratio=0.1, test_ratio=0.1):
    if not os.path.exists(dataset_path):
        print(f"Error: Dataset path '{dataset_path}' does not exist!")
        return
    
    categories = [folder for folder in os.listdir(dataset_path) if os.path.isdir(os.path.join(dataset_path, folder))]
    
    for split in ['train', 'validation', 'test']:
        split_path = os.path.join(output_path, split)
        os.makedirs(split_path, exist_ok=True)
    
    for category in categories:
        category_path = os.path.join(dataset_path, category)
        images = [img for img in os.listdir(category_path) if img.endswith(('png', 'jpg', 'jpeg'))]
        random.shuffle(images)
        
        train_split = int(len(images) * train_ratio)
        val_split = int(len(images) * (train_ratio + val_ratio))
        
        splits = {
            'train': images[:train_split],
            'validation': images[train_split:val_split],
            'test': images[val_split:]
        }
        
        for split, split_images in splits.items():
            split_category_path = os.path.join(output_path, split, category)
            os.makedirs(split_category_path, exist_ok=True)
            
            for img in split_images:
                shutil.copy(os.path.join(category_path, img), os.path.join(split_category_path, img))
    
    print("Dataset successfully split into train, validation, and test sets!")

# Paths
dataset_path = "D:/my-project/dataset"
output_path = "D:/my-project"

# Run the split function
split_data(dataset_path, output_path)
