/**
 * Utility to optimize Cloudinary URLs by injecting transformation parameters.
 * It adds f_auto (automatic format) and q_auto (automatic quality).
 */
export function optimizeCloudinaryUrl(url: string | undefined): string | undefined {
  if (!url) return url;

  // Check if it's a Cloudinary URL
  if (url.includes('res.cloudinary.com')) {
    // Check if it already has transformations (contains '/upload/v' or '/upload/')
    // We want to inject transformations after '/upload/'
    if (url.includes('/upload/') && !url.includes('/upload/f_auto,q_auto/')) {
      // If it has transformations already, they are usually between /upload/ and /v12345/
      // For simplicity, if it doesn't have f_auto,q_auto, we insert it.
      
      // If there's a version number like /v123456789/, we insert before it.
      // If not, we insert after /upload/
      return url.replace('/upload/', '/upload/f_auto,q_auto/');
    }
  }

  return url;
}

/**
 * Get an optimized URL for any image.
 * Currently supports Cloudinary optimization.
 */
export function getOptimizedUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  
  // Optimize Cloudinary URLs
  if (url.includes('res.cloudinary.com')) {
    return optimizeCloudinaryUrl(url);
  }
  
  // For Unsplash, we could add auto=format&q=80, but many already have it.
  // The user specifically complained about Cloudinary images.
  
  return url;
}
