import { Share2, Download } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

interface ShareScoreCardProps {
  score: number;
  skinType?: string;
  concerns?: string[];
}

export function ShareScoreCard({ score, skinType, concerns }: ShareScoreCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  const getScoreColor = () => {
    if (score >= 8) return 'from-green-400 to-emerald-500';
    if (score >= 5) return 'from-yellow-400 to-orange-500';
    return 'from-red-400 to-rose-500';
  };

  const getScoreLabel = () => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Needs Attention';
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      // Generate canvas from the card
      const card = cardRef.current;
      if (!card) return;

      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 800;
      const ctx = canvas.getContext('2d')!;

      // Background
      const gradient = ctx.createLinearGradient(0, 0, 600, 800);
      gradient.addColorStop(0, '#0A0A0F');
      gradient.addColorStop(0.5, '#0D1117');
      gradient.addColorStop(1, '#0A0A0F');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 600, 800);

      // Border glow
      ctx.strokeStyle = '#00F5FF30';
      ctx.lineWidth = 2;
      ctx.roundRect(20, 20, 560, 760, 24);
      ctx.stroke();

      // Logo
      ctx.font = 'bold 36px system-ui';
      ctx.fillStyle = '#00F5FF';
      ctx.textAlign = 'center';
      ctx.fillText('SKYN', 300, 80);

      ctx.font = '14px system-ui';
      ctx.fillStyle = '#888888';
      ctx.fillText('AI Skin Health Analysis', 300, 105);

      // Score circle
      ctx.beginPath();
      ctx.arc(300, 300, 120, 0, Math.PI * 2);
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 12;
      ctx.stroke();

      // Score arc
      const scoreAngle = (score / 10) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(300, 300, 120, -Math.PI / 2, -Math.PI / 2 + scoreAngle);
      const arcGradient = ctx.createLinearGradient(180, 180, 420, 420);
      arcGradient.addColorStop(0, '#00F5FF');
      arcGradient.addColorStop(1, '#7000FF');
      ctx.strokeStyle = arcGradient;
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Score number
      ctx.font = 'bold 72px system-ui';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText(`${score}`, 300, 310);
      ctx.font = '24px system-ui';
      ctx.fillStyle = '#888888';
      ctx.fillText('/10', 300, 345);

      // Score label
      ctx.font = 'bold 20px system-ui';
      ctx.fillStyle = '#00F5FF';
      ctx.fillText(getScoreLabel(), 300, 460);

      // Skin type
      if (skinType) {
        ctx.font = '16px system-ui';
        ctx.fillStyle = '#CCCCCC';
        ctx.fillText(`Skin Type: ${skinType}`, 300, 520);
      }

      // Concerns
      if (concerns && concerns.length > 0) {
        ctx.font = '14px system-ui';
        ctx.fillStyle = '#888888';
        ctx.fillText(concerns.slice(0, 3).join(' • '), 300, 555);
      }

      // CTA
      ctx.font = 'bold 16px system-ui';
      ctx.fillStyle = '#00F5FF';
      ctx.fillText('Get your free analysis at yourskyn.lovable.app', 300, 720);

      // Dermatologist certified badge
      ctx.font = '12px system-ui';
      ctx.fillStyle = '#4ADE80';
      ctx.fillText('✓ Dermatologist Certified', 300, 750);

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png');
      });

      if (navigator.share && navigator.canShare?.({ files: [new File([blob], 'skyn-score.png', { type: 'image/png' })] })) {
        await navigator.share({
          title: `My SKYN Score: ${score}/10`,
          text: `I just got my AI skin health score! ${getScoreLabel()} — ${score}/10. Get yours free at yourskyn.lovable.app`,
          files: [new File([blob], 'skyn-score.png', { type: 'image/png' })],
        });
      } else {
        // Fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'skyn-score.png';
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Score card downloaded! Share it on social media 🎉');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        toast.error('Failed to share. Try again!');
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div ref={cardRef}>
      <button
        onClick={handleShare}
        disabled={isSharing}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 text-foreground font-medium flex items-center justify-center gap-2 btn-shine hover:from-primary/30 hover:to-secondary/30 transition-all disabled:opacity-50"
      >
        <Share2 className="w-5 h-5" />
        {isSharing ? 'Generating...' : 'Share My Score'}
      </button>
    </div>
  );
}
