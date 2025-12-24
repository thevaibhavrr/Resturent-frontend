// Cloudinary upload utility with image compression
export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

// Compress image before upload
const compressImage = (file: File, maxWidth: number = 1920, maxHeight: number = 1080, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file); // fallback to original
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
};

// Upload to Cloudinary
export const uploadToCloudinary = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResult> => {
  // Validate file size (5GB limit as requested)
  const maxSize = 5 * 1024 * 1024 * 1024; // 5GB in bytes
  if (file.size > maxSize) {
    throw new Error('File size must be less than 5GB');
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }

  try {
    // Compress image first
    const compressedFile = await compressImage(file);

    const formData = new FormData();
    formData.append('file', compressedFile);
    formData.append('upload_preset', 'VR billing'); // Your upload preset
    formData.append('cloud_name', 'dqf3tdsri'); // Your cloud name

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/dqf3tdsri/image/upload`, // Your cloud name
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const result: CloudinaryUploadResult = await response.json();
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

// Delete from Cloudinary
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    // Note: For unsigned uploads, deletion requires signed requests
    // This would need to be implemented on the backend for security
    console.warn('Delete functionality requires backend implementation for security');
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};
