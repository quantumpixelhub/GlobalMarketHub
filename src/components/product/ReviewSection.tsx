import React, { useState } from 'react';
import { Star, ThumbsUp } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  title: string;
  content: string;
  user: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  helpfulCount: number;
}

interface ReviewSectionProps {
  productId: string;
  reviews: Review[];
  averageRating?: number;
  totalReviews?: number;
  onSubmitReview?: (data: any) => void;
  isAuthenticated?: boolean;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({
  reviews,
  averageRating = 4.5,
  totalReviews = 245,
  onSubmitReview,
  isAuthenticated = false,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hover, setHover] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReview?.({
      rating,
      title,
      content,
    });
    setRating(5);
    setTitle('');
    setContent('');
    setShowForm(false);
  };

  return (
    <div className="bg-white rounded-lg">
      {/* Rating Summary */}
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
        <div className="flex items-start gap-8">
          {/* Average Rating */}
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-bold">{averageRating.toFixed(1)}</span>
              <span className="text-gray-600">out of 5</span>
            </div>
            <div className="flex mb-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={20}
                  className={i < Math.ceil(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                />
              ))}
            </div>
            <p className="text-sm text-gray-600">{totalReviews} reviews</p>
          </div>

          {/* Rating Breakdown */}
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => (
              <div key={stars} className="flex items-center gap-2">
                <span className="text-sm w-12">{stars} ⭐</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${Math.random() * 80}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Write Review Button */}
        {isAuthenticated && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="mt-4 bg-rose-600 text-white px-6 py-2 rounded hover:bg-rose-700"
          >
            {showForm ? 'Cancel' : 'Write a Review'}
          </button>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <div className="p-6 border-b bg-gray-50">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-semibold mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                  >
                    <Star
                      size={32}
                      className={`cursor-pointer ${
                        star <= (hover || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold mb-2">Review Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-600"
                placeholder="Summary of your experience"
                required
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-semibold mb-2">Your Review</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-600 h-24"
                placeholder="Share your experience with this product"
                required
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="bg-rose-600 text-white px-6 py-2 rounded hover:bg-rose-700"
            >
              Submit Review
            </button>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="divide-y">
        {reviews.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No reviews yet</div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="p-6">
              {/* Author & Rating */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold">{review.user.firstName} {review.user.lastName}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Review Title & Content */}
              <h4 className="font-bold text-sm mb-2">{review.title}</h4>
              <p className="text-sm text-gray-700 mb-3">{review.content}</p>

              {/* Helpful Button */}
              <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-rose-600">
                <ThumbsUp size={16} />
                <span>Helpful ({review.helpfulCount})</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
