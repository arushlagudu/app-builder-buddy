import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Scan, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImageCaptureProps {
  onImageCapture: (imageData: string) => void;
  isScanning: boolean;
  showValidationWarning: boolean;
  onDismissWarning: () => void;
}

// Check image clarity by analyzing variance in pixel brightness
const checkImageClarity = (imageData: string): Promise<{ isBlurry: boolean; score: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 100; // Sample size for analysis
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve({ isBlurry: false, score: 100 });
        return;
      }
      
      ctx.drawImage(img, 0, 0, size, size);
      const imageDataObj = ctx.getImageData(0, 0, size, size);
      const data = imageDataObj.data;
      
      // Calculate Laplacian variance (simple blur detection)
      let sum = 0;
      let sumSquares = 0;
      let count = 0;
      
      for (let i = 0; i < data.length; i += 4) {
        const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
        sum += gray;
        sumSquares += gray * gray;
        count++;
      }
      
      const mean = sum / count;
      const variance = (sumSquares / count) - (mean * mean);
      
      // Threshold for blur detection (lower variance = more blur)
      const isBlurry = variance < 800;
      const score = Math.min(100, Math.round(variance / 20));
      
      resolve({ isBlurry, score });
    };
    img.onerror = () => resolve({ isBlurry: false, score: 100 });
    img.src = imageData;
  });
};

// Compress and resize image to reduce payload size
const compressImage = (file: File | Blob, maxWidth = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      
      // Scale down if needed
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      const compressedData = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedData);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};

export function ImageCapture({ onImageCapture, isScanning, showValidationWarning, onDismissWarning }: ImageCaptureProps) {
  const [image, setImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [showBlurWarning, setShowBlurWarning] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const processImage = async (imageData: string) => {
    const { isBlurry } = await checkImageClarity(imageData);
    
    if (isBlurry) {
      setPendingImage(imageData);
      setShowBlurWarning(true);
    } else {
      setImage(imageData);
      onImageCapture(imageData);
      setShowBlurWarning(false);
      setPendingImage(null);
    }
  };

  const handleUseAnyway = () => {
    if (pendingImage) {
      setImage(pendingImage);
      onImageCapture(pendingImage);
    }
    setShowBlurWarning(false);
    setPendingImage(null);
  };

  const handleRetake = () => {
    setShowBlurWarning(false);
    setPendingImage(null);
    setImage(null);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 800 }, height: { ideal: 600 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      // Fallback to file upload
      fileInputRef.current?.click();
    }
  };

  const capturePhoto = useCallback(async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Limit canvas size
      const maxWidth = 800;
      let width = video.videoWidth;
      let height = video.videoHeight;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        const imageData = canvas.toDataURL('image/jpeg', 0.7);
        stopCamera();
        await processImage(imageData);
      }
    }
  }, [onImageCapture]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const compressedImage = await compressImage(file, 800, 0.7);
        await processImage(compressedImage);
      } catch (err) {
        console.error('Failed to compress image:', err);
        // Fallback to direct read but still limit size
        const reader = new FileReader();
        reader.onloadend = async () => {
          const imageData = reader.result as string;
          await processImage(imageData);
        };
        reader.readAsDataURL(file);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const clearImage = () => {
    setImage(null);
    stopCamera();
  };

  return (
    <div className="relative space-y-3">
      {/* Instructions */}
      <div className="glass-card p-3 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">How to get the best results:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Use natural lighting (avoid harsh shadows)</li>
              <li>Face the camera directly, keep your face centered</li>
              <li>Remove makeup for accurate skin analysis</li>
              <li>Hold steady to avoid blurry photos</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Blur Warning Modal */}
      {showBlurWarning && (
        <div className="glass-card p-4 bg-yellow-500/10 border-yellow-500/30 animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-yellow-400 text-sm">Image may be blurry</p>
              <p className="text-xs text-muted-foreground mt-1">
                The photo appears unclear. For best results, please retake with better lighting and hold steady.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleRetake}
                  className="flex-1 py-2 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retake Photo
                </button>
                <button
                  onClick={handleUseAnyway}
                  className="flex-1 py-2 px-3 rounded-lg bg-muted text-foreground text-xs font-medium"
                >
                  Use Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation Warning */}
      {showValidationWarning && (
        <div className="glass-card bg-destructive/20 border-destructive/50 p-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <p className="text-sm text-destructive">Please complete the form above first</p>
            </div>
            <button onClick={onDismissWarning} className="text-destructive/70 hover:text-destructive">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        {/* Image/Camera Preview Area */}
        <div className="relative aspect-[3/4] bg-obsidian-light flex items-center justify-center overflow-hidden rounded-t-2xl">
          {isCompressing ? (
            <div className="text-center p-6">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-muted-foreground text-sm">Processing image...</p>
            </div>
          ) : isCameraActive ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Camera overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-primary rounded-tl-xl" />
                <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-primary rounded-tr-xl" />
                <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-primary rounded-bl-xl" />
                <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-primary rounded-br-xl" />
              </div>
              
              {/* Capture button */}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                <button
                  onClick={capturePhoto}
                  className="w-16 h-16 rounded-full bg-primary flex items-center justify-center glow-cyan btn-shine"
                >
                  <div className="w-14 h-14 rounded-full border-4 border-primary-foreground" />
                </button>
              </div>
              
              {/* Cancel button */}
              <button
                onClick={stopCamera}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-muted/80 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          ) : image ? (
            <>
              <img src={image} alt="Captured face" className="w-full h-full object-cover" />
              
              {/* Scanning overlay */}
              {isScanning && (
                <div className="absolute inset-0 bg-obsidian/30">
                  {/* Scan line */}
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-secondary to-transparent scan-line" />
                  
                  {/* Hotspots */}
                  <div className="absolute top-1/4 left-1/3">
                    <div className="w-6 h-6 rounded-full border-2 border-secondary flex items-center justify-center hotspot-pulse">
                      <span className="text-secondary text-xs">+</span>
                    </div>
                  </div>
                  <div className="absolute top-1/3 right-1/4">
                    <div className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center hotspot-pulse" style={{ animationDelay: '0.5s' }}>
                      <span className="text-primary text-xs">+</span>
                    </div>
                  </div>
                  <div className="absolute bottom-1/3 left-1/4">
                    <div className="w-6 h-6 rounded-full border-2 border-secondary flex items-center justify-center hotspot-pulse" style={{ animationDelay: '1s' }}>
                      <span className="text-secondary text-xs">+</span>
                    </div>
                  </div>
                  
                  {/* Scanning text */}
                  <div className="absolute bottom-6 left-0 right-0 text-center">
                    <p className="text-sm text-secondary text-glow-violet flex items-center justify-center gap-2">
                      <Scan className="w-4 h-4 animate-pulse" />
                      Analyzing skin...
                    </p>
                  </div>
                </div>
              )}
              
              {/* Clear button */}
              {!isScanning && (
                <button
                  onClick={clearImage}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-muted/80 flex items-center justify-center hover:bg-destructive/80 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </>
          ) : (
            <div className="text-center p-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                <Camera className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground text-sm">Capture or upload your photo</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {!isCameraActive && !image && !isCompressing && (
          <div className="p-4 flex gap-3">
            <button
              onClick={startCamera}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-medium flex items-center justify-center gap-2 glow-cyan btn-shine"
            >
              <Camera className="w-5 h-5" />
              Take Photo
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-3 rounded-xl bg-muted text-foreground font-medium flex items-center justify-center gap-2 hover:bg-muted/80 transition-colors"
            >
              <Upload className="w-5 h-5" />
              Upload
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}
