import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Scan, AlertCircle } from 'lucide-react';

interface ImageCaptureProps {
  onImageCapture: (imageData: string) => void;
  isScanning: boolean;
  showValidationWarning: boolean;
  onDismissWarning: () => void;
}

export function ImageCapture({ onImageCapture, isScanning, showValidationWarning, onDismissWarning }: ImageCaptureProps) {
  const [image, setImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
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

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setImage(imageData);
        onImageCapture(imageData);
        stopCamera();
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setImage(imageData);
        onImageCapture(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImage(null);
    stopCamera();
  };

  return (
    <div className="relative">
      {/* Validation Warning */}
      {showValidationWarning && (
        <div className="absolute -top-16 left-0 right-0 z-20 animate-fade-in">
          <div className="glass-card bg-destructive/20 border-destructive/50 p-3 mx-4">
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
        </div>
      )}

      <div className="glass-card overflow-hidden">
        {/* Image/Camera Preview Area */}
        <div className="relative aspect-[3/4] bg-obsidian-light flex items-center justify-center overflow-hidden rounded-t-2xl">
          {isCameraActive ? (
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
        {!isCameraActive && !image && (
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
