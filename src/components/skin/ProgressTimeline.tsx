import { useState, useEffect, useRef } from 'react';
import { Camera, ChevronLeft, ChevronRight, Plus, Trash2, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ScoreGauge } from './ScoreGauge';
import { toast } from 'sonner';

interface ProgressPhoto {
  id: string;
  image_url: string;
  notes: string | null;
  skin_score: number | null;
  created_at: string;
}

export function ProgressTimeline() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIndex, setCompareIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPhotos();
    }
  }, [user]);

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('progress_photos')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Failed to fetch photos:', error);
      toast.error('Failed to load progress photos');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from('progress_photos')
        .insert({
          user_id: user.id,
          image_url: publicUrl,
        });

      if (insertError) throw insertError;

      await fetchPhotos();
      toast.success('Progress photo added!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (id: string) => {
    try {
      const { error } = await supabase
        .from('progress_photos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPhotos(photos.filter(p => p.id !== id));
      toast.success('Photo deleted');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete photo');
    }
  };

  if (!user) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-muted-foreground">Sign in to track your skin progress</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-8 h-8 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="glass-card p-8 text-center space-y-4">
        <Camera className="w-16 h-16 mx-auto text-muted-foreground/50" />
        <div>
          <p className="text-muted-foreground font-medium">Start Your Skin Journey</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Take weekly photos to track improvements
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="mx-auto px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-medium flex items-center gap-2 btn-shine"
        >
          <Plus className="w-5 h-5" />
          Add First Photo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />
      </div>
    );
  }

  const scoreTrend = photos.length >= 2 && photos[0].skin_score && photos[photos.length - 1].skin_score
    ? (photos[photos.length - 1].skin_score! - photos[0].skin_score!)
    : null;

  return (
    <div className="space-y-4">
      {/* Trend Summary */}
      {scoreTrend !== null && (
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className={`w-5 h-5 ${scoreTrend >= 0 ? 'text-green-400' : 'text-red-400'}`} />
            <div>
              <p className="text-sm font-medium">
                {scoreTrend >= 0 ? 'Skin improving!' : 'Needs attention'}
              </p>
              <p className="text-xs text-muted-foreground">
                {scoreTrend >= 0 ? '+' : ''}{scoreTrend.toFixed(1)} points over {photos.length} photos
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Photo Comparison */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-sm">Progress Photos</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                compareMode ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              Compare
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-3 py-1 rounded-lg text-xs font-medium bg-primary/20 text-primary"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {compareMode ? (
          <div className="grid grid-cols-2 gap-2">
            {/* Before */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground text-center">Before</p>
              <div className="aspect-square rounded-xl overflow-hidden relative">
                <img
                  src={photos[compareIndex]?.image_url}
                  alt="Before"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 right-2 glass-card p-2">
                  <p className="text-xs text-center">
                    {new Date(photos[compareIndex]?.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setCompareIndex(Math.max(0, compareIndex - 1))}
                  disabled={compareIndex === 0}
                  className="p-1 rounded-lg bg-muted disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCompareIndex(Math.min(photos.length - 2, compareIndex + 1))}
                  disabled={compareIndex >= photos.length - 2}
                  className="p-1 rounded-lg bg-muted disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* After (always latest) */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground text-center">After</p>
              <div className="aspect-square rounded-xl overflow-hidden relative">
                <img
                  src={photos[photos.length - 1]?.image_url}
                  alt="After"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 right-2 glass-card p-2">
                  <p className="text-xs text-center">
                    {new Date(photos[photos.length - 1]?.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <p className="text-xs text-center text-primary">Latest</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Main Photo */}
            <div className="aspect-square rounded-xl overflow-hidden relative group">
              <img
                src={photos[selectedIndex]?.image_url}
                alt="Progress"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => deletePhoto(photos[selectedIndex].id)}
                className="absolute top-2 right-2 p-2 rounded-lg bg-destructive/80 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
              <div className="absolute bottom-2 left-2 right-2 glass-card p-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs">
                    {new Date(photos[selectedIndex]?.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                {photos[selectedIndex]?.skin_score && (
                  <div className="w-10 h-10">
                    <ScoreGauge score={photos[selectedIndex].skin_score!} />
                  </div>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
                disabled={selectedIndex === 0}
                className="p-2 rounded-lg bg-muted disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-muted-foreground">
                {selectedIndex + 1} / {photos.length}
              </span>
              <button
                onClick={() => setSelectedIndex(Math.min(photos.length - 1, selectedIndex + 1))}
                disabled={selectedIndex === photos.length - 1}
                className="p-2 rounded-lg bg-muted disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Thumbnail Strip */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedIndex(index)}
                  className={`w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                    selectedIndex === index ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img src={photo.image_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
