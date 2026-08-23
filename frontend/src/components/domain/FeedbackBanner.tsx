import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Star } from 'lucide-react';
import { api } from '../../services/ApiClient';

interface FeedbackBannerProps {
  orderId: string;
  onSuccess: () => void;
  onSkip: () => void;
}

export const FeedbackBanner: React.FC<FeedbackBannerProps> = ({ orderId, onSuccess, onSkip }) => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating between 1 and 5 stars.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await api.post('/customer/feedback', {
        orderId,
        rating,
        comment
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <Card style={{ marginBottom: '1.5rem', border: '1px solid var(--color-primary)', backgroundColor: 'var(--color-surface)' }}>
      <CardContent style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Delivery Feedback</h3>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          Your order #{orderId.split('-')[0].toUpperCase()} was delivered. How was your delivery experience?
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', margin: '0.5rem 0' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={32}
              fill={(hoverRating || rating) >= star ? 'var(--color-warning)' : 'transparent'}
              color={(hoverRating || rating) >= star ? 'var(--color-warning)' : 'var(--color-border)'}
              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
            />
          ))}
        </div>

        {rating > 0 && (
          <textarea
            placeholder="Tell us more (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg)',
              color: 'var(--color-text-primary)',
              minHeight: '80px',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        )}

        {error && <p style={{ color: 'var(--color-error)', margin: 0, fontSize: '0.875rem' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting || rating === 0}>
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
          <Button variant="ghost" onClick={onSkip} disabled={isSubmitting}>
            Skip for now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
