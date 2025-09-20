'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  label: string;
  value: string;
  onChange: (base64: string) => void;
  className?: string;
  accept?: string;
  maxSizeMB?: number;
  preview?: boolean;
  avatarSize?: number;
  round?: boolean;
}

export function ImageUploader({
  label,
  value,
  onChange,
  className = '',
  accept = 'image/*',
  maxSizeMB = 0.25,
  preview = true,
  avatarSize = 128,
  round = true
}: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resizeImage = (file: File, maxSizeInMB: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Set canvas size to avatar size
        canvas.width = avatarSize;
        canvas.height = avatarSize;

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate dimensions to crop to square
        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;

        // Draw image cropped to square and resized
        ctx.drawImage(img, x, y, size, size, 0, 0, avatarSize, avatarSize);

        // Convert to base64 with higher compression for smaller size
        let base64 = canvas.toDataURL('image/jpeg', 0.6);
        
        // Check if the base64 size is too large (base64 is ~1.37x larger than binary)
        const sizeInBytes = (base64.length * 3) / 4;
        const maxSizeBytes = maxSizeInMB * 1024 * 1024;
        
        if (sizeInBytes > maxSizeBytes) {
          // Try with even higher compression
          base64 = canvas.toDataURL('image/jpeg', 0.4);
          const newSizeInBytes = (base64.length * 3) / 4;
          
          if (newSizeInBytes > maxSizeBytes) {
            reject(new Error(`Image too large after compression. Size: ${Math.round(newSizeInBytes / 1024)}KB, Max: ${Math.round(maxSizeBytes / 1024)}KB`));
            return;
          }
        }
        
        resolve(base64);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setIsUploading(true);

    try {
      const resizedBase64 = await resizeImage(file, maxSizeMB);
      onChange(resizedBase64);
      setIsUploading(false);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file: ' + (error as Error).message);
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-white/80">
        {label}
      </label>

      {value && preview ? (
        // Image preview
        <div className="relative group flex justify-center">
          <div className={`relative ${round ? 'rounded-full' : 'rounded-lg'} overflow-hidden bg-white/5 border border-white/20`} 
               style={{ width: avatarSize, height: avatarSize }}>
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex flex-col space-y-1">
                <button
                  type="button"
                  onClick={handleUploadClick}
                  className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-white text-xs transition-colors"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 rounded text-white text-xs transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Upload area
        <div className="flex justify-center">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleUploadClick}
            className={`
              relative border-2 border-dashed transition-colors cursor-pointer flex items-center justify-center
              ${round ? 'rounded-full' : 'rounded-lg'}
              ${isDragOver 
                ? 'border-blue-400 bg-blue-500/10' 
                : 'border-white/30 bg-white/5 hover:border-white/50 hover:bg-white/10'
              }
              ${isUploading ? 'pointer-events-none' : ''}
            `}
            style={{ width: avatarSize, height: avatarSize }}
          >
            <div className="flex flex-col items-center justify-center text-white/60 text-center">
              {isUploading ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white/60 mb-1"></div>
                  <p className="text-xs">Processing...</p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto h-6 w-6 mb-1" />
                  <p className="text-xs font-medium mb-1">
                    {round ? 'Add Avatar' : 'Drop image here'}
                  </p>
                  <p className="text-xs text-white/40">
                    {maxSizeMB}MB max
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {value && !preview && (
        <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/20">
          <div className="flex items-center space-x-2 text-white/80">
            <ImageIcon size={16} />
            <span className="text-sm">Image uploaded</span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}