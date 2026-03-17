# 7. AI Enhancements & Advanced Features

**GlobalMarketHub** - Machine Learning & AI Implementation  
**Version**: 1.0  
**Last Updated**: March 2026

---

## Overview

AI/ML features enhance user experience, improve conversions, and provide competitive advantages. These are **Phase 2+** features (not MVP).

---

## 1. Product Matching Engine

### Purpose
Match products from different platforms (Daraz, Pickaboo, Sajgoj) that are the same or similar to avoid duplicates and improve user experience.

### Approach: Vector Embeddings + Semantic Similarity

```python
# src/ml_service/product_matcher.py

import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict

class ProductMatcher:
    def __init__(self):
        # Pre-trained model for semantic similarity
        self.model = SentenceTransformer('paraphrase-multilingual-mpnet-base-v2')
        self.threshold = 0.75  # Similarity threshold for matching
    
    def create_product_embedding(self, product: Dict) -> np.ndarray:
        """Create vector embedding for a product."""
        # Combine product features into text
        text = f"""
        {product['title']} 
        {product['description']} 
        {product['brand']} 
        {product['category']}
        {' '.join(product.get('certifications', []))}
        """
        # Generate embedding
        embedding = self.model.encode(text)
        return embedding
    
    def match_product(
        self, 
        new_product: Dict, 
        candidate_products: List[Dict]
    ) -> List[Dict]:
        """Find matching products from candidates."""
        # Create embedding for new product
        new_embedding = self.create_product_embedding(new_product)
        
        # Create embeddings for candidates
        candidate_embeddings = [
            self.create_product_embedding(p) for p in candidate_products
        ]
        
        # Calculate similarities
        similarities = cosine_similarity(
            [new_embedding], 
            candidate_embeddings
        )[0]
        
        # Return matches above threshold
        matches = []
        for idx, (product, similarity) in enumerate(zip(candidate_products, similarities)):
            if similarity > self.threshold:
                matches.append({
                    'product': product,
                    'similarity': float(similarity),
                    'match_confidence': min(100, int(similarity * 100))
                })
        
        # Sort by similarity
        return sorted(matches, key=lambda x: x['similarity'], reverse=True)
    
    def batch_match_products(
        self, 
        new_products: List[Dict], 
        existing_products: List[Dict]
    ) -> Dict:
        """Match multiple new products."""
        results = {}
        for product in new_products:
            matches = self.match_product(product, existing_products)
            results[product['id']] = matches
        return results

# Usage in backend
matcher = ProductMatcher()

# When syncing products from external platform
new_daraz_products = fetch_from_daraz()
existing_products = db.get_products(category='skincare')

matches = matcher.batch_match_products(new_daraz_products, existing_products)

# Save matches to database
for external_id, matched_list in matches.items():
    if matched_list:
        best_match = matched_list[0]
        db.create_product_mapping(
            external_id=external_id,
            internal_product_id=best_match['product']['id'],
            confidence=best_match['match_confidence']
        )
```

### Implementation in Backend

```typescript
// src/services/product-matching.service.ts

export class ProductMatchingService {
  private pythonService: PythonMLService;
  
  async syncExternalProducts(platform: 'daraz' | 'pickaboo', products: any[]) {
    // Fetch existing products
    const existingProducts = await this.getProductsByCategory(products[0].category);
    
    // Call Python ML service for matching
    const matches = await this.pythonService.matchProducts(
      products,
      existingProducts
    );
    
    // Save mappings
    for (const [externalId, match] of Object.entries(matches)) {
      if (match.matched) {
        await db.externalProducts.create({
          platform,
          external_id: externalId,
          product_id: match.product_id,
          confidence: match.confidence,
        });
      }
    }
  }
}
```

---

## 2. Price Tracking & Alerts

### Purpose
Track product prices over time and notify users of price drops on their wishlisted items.

### Data Collection

```python
# src/jobs/price_tracking_job.py

from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
import logging

class PriceTrackingJob:
    def __init__(self, db, external_apis, email_service):
        self.db = db
        self.external_apis = external_apis
        self.email_service = email_service
        self.scheduler = BackgroundScheduler()
    
    def start(self):
        # Run every 6 hours
        self.scheduler.add_job(
            self.update_all_prices,
            'interval',
            hours=6,
            id='price_tracking'
        )
        self.scheduler.start()
    
    def update_all_prices(self):
        """Fetch latest prices from all platforms."""
        products = self.db.products.get_all_synced()
        
        for product in products:
            current_price = self.fetch_current_price(product)
            self.save_price_history(product.id, current_price)
            self.check_price_drops(product.id, current_price)
    
    def fetch_current_price(self, product):
        """Get current price from external platform."""
        if product.external_platform == 'daraz':
            return self.external_apis.daraz.get_price(
                product.external_product_id
            )
        elif product.external_platform == 'pickaboo':
            return self.external_apis.pickaboo.get_price(
                product.external_product_id
            )
        # ... more platforms
    
    def save_price_history(self, product_id: str, price: float):
        """Save price to history."""
        self.db.price_history.create({
            product_id,
            price,
            recorded_at: datetime.now()
        })
        
        # Update product's current price
        self.db.products.update(product_id, {'price': price})
    
    def check_price_drops(self, product_id: str, current_price: float):
        """Check if price dropped and send alerts."""
        # Get price history
        history = self.db.price_history.get_recent(product_id, days=30)
        
        if len(history) < 2:
            return
        
        previous_price = history[-2]['price']
        price_drop = previous_price - current_price
        drop_percentage = (price_drop / previous_price) * 100
        
        if drop_percentage >= 5:  # Only notify if drop >= 5%
            self.send_price_drop_alerts(product_id, current_price, drop_percentage)
    
    def send_price_drop_alerts(self, product_id: str, new_price: float, drop_percent: float):
        """Send email/SMS to users with this product in wishlist."""
        users_wishlisted = self.db.wishlists.get_users_for_product(product_id)
        product = self.db.products.get_by_id(product_id)
        
        for user in users_wishlisted:
            if not user.notification_preferences['price_alerts']:
                continue
            
            # Skip if already notified recently
            if self.already_notified_recently(user.id, product_id):
                continue
            
            message = f"""
            Price Drop Alert! 🎉
            {product['title']} dropped by {drop_percent:.1f}%
            New price: BDT {new_price}
            View: {product['url']}
            """
            
            # Send notifications
            if user.email:
                self.email_service.send_price_alert(user.email, product, new_price)
            if user.phone:
                # self.sms_service.send(user.phone, message)
                pass
            
            # Mark as notified
            self.db.notifications.create({
                user_id: user.id,
                product_id,
                type: 'price_drop',
                price_new: new_price,
                sent_at: datetime.now()
            })

price_tracker = PriceTrackingJob(db, external_apis, email_service)
price_tracker.start()
```

### Price Tracking Frontend

```typescript
// src/components/PriceHistory.tsx

import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

interface PricePoint {
  date: string;
  price: number;
}

export const PriceHistory = ({ productId }: { productId: string }) => {
  const { data: history } = usePriceHistory(productId, 30); // Last 30 days
  
  if (!history) return <Skeleton />;
  
  const minPrice = Math.min(...history.map(h => h.price));
  const maxPrice = Math.max(...history.map(h => h.price));
  const currentPrice = history[history.length - 1].price;
  const lowestPriceDate = history.find(h => h.price === minPrice);
  
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-4">Price History (30 days)</h3>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Current</p>
          <p className="text-2xl font-bold">BDT {currentPrice}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Lowest</p>
          <p className="text-2xl font-bold">BDT {minPrice}</p>
          <p className="text-xs text-gray-400">{lowestPriceDate?.date}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Highest</p>
          <p className="text-2xl font-bold">BDT {maxPrice}</p>
        </div>
      </div>
      
      <LineChart width={400} height={200} data={history}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Line type="monotone" dataKey="price" stroke="#10B981" />
      </LineChart>
    </div>
  );
};
```

---

## 3. Review Analysis & Trust Score

### Purpose
Analyze product reviews using NLP to identify fake reviews, summarize sentiments, and calculate trust scores.

### Review Analysis Pipeline

```python
# src/ml_service/review_analyzer.py

from transformers import pipeline
from textblob import TextBlob
import numpy as np

class ReviewAnalyzer:
    def __init__(self):
        # Sentiment analysis model
        self.sentiment_pipeline = pipeline(
            "sentiment-analysis",
            model="bert-base-multilingual-uncased-sentiment"
        )
        # Spam detection model
        self.spam_detector = pipeline(
            "zero-shot-classification",
            model="facebook/bart-large-mnli"
        )
    
    def analyze_review(self, review_text: str) -> Dict:
        """Analyze a single review."""
        # 1. Detect language & sentiment
        sentiment = self._detect_sentiment(review_text)
        
        # 2. Extract key aspects (product quality, shipping, value, etc.)
        aspects = self._extract_aspects(review_text)
        
        # 3. Detect spam/fake reviews
        spam_score = self._detect_spam(review_text)
        
        # 4. Calculate helpfulness
        helpfulness = self._estimate_helpfulness(review_text)
        
        return {
            'sentiment': sentiment,
            'aspects': aspects,
            'spam_score': spam_score,
            'helpfulness': helpfulness,
            'is_fake_likely': spam_score > 0.7
        }
    
    def _detect_sentiment(self, text: str) -> Dict:
        """Detect sentiment (positive/negative/neutral)."""
        result = self.sentiment_pipeline(text[:512])[0]  # BERT limit
        
        return {
            'label': result['label'],
            'score': result['score'],
            'polarity': TextBlob(text).sentiment.polarity  # -1 to 1
        }
    
    def _extract_aspects(self, text: str) -> List[Dict]:
        """Extract aspects (quality, delivery, packaging, etc.)."""
        aspects = {
            'quality': ['good quality', 'excellent product', 'poor quality', 'defected'],
            'delivery': ['fast delivery', 'slow delivery', 'on time', 'delayed'],
            'packaging': ['good packaging', 'damaged packaging', 'well packed'],
            'value': ['good value', 'overpriced', 'worth the money'],
            'seller': ['good seller', 'bad seller', 'responsive'],
        }
        
        found_aspects = []
        text_lower = text.lower()
        
        for aspect_type, keywords in aspects.items():
            for keyword in keywords:
                if keyword in text_lower:
                    found_aspects.append({
                        'type': aspect_type,
                        'keyword': keyword
                    })
        
        return found_aspects
    
    def _detect_spam(self, text: str) -> float:
        """Score likelihood of spam/fake review."""
        spam_keywords = [
            'seller paid me',
            'fake review',
            'bought from',
            'i am seller',
            'please buy my',
            'click here',
            'limited time offer'
        ]
        
        # Keyword-based detection
        keyword_score = sum(
            1 for keyword in spam_keywords 
            if keyword in text.lower()
        ) / len(spam_keywords)
        
        # MLModel: zero-shot classification
        result = self.spam_detector(
            text[:512],
            ['legitimate review', 'spam/fake review']
        )
        
        model_score = result['scores'][1]  # Spam probability
        
        # Combine scores
        return (keyword_score * 0.3 + model_score * 0.7)
    
    def _estimate_helpfulness(self, text: str) -> float:
        """Estimate how helpful a review is."""
        # Factors: length, specificity, aspects mentioned
        length_score = min(len(text.split()) / 50, 1.0)  # Optimal ~50 words
        aspect_score = min(len(self._extract_aspects(text)) / 3, 1.0)  # 3+ aspects
        detail_score = 0.5 if any(x in text for x in ['I', 'we', 'my']) else 0
        
        return (length_score * 0.3 + aspect_score * 0.4 + detail_score * 0.3)
    
    def batch_analyze_reviews(self, reviews: List[str]) -> List[Dict]:
        """Analyze multiple reviews."""
        return [self.analyze_review(review) for review in reviews]

# Usage in backend
analyzer = ReviewAnalyzer()

# When new review is submitted
review = db.reviews.create({...})
analysis = analyzer.analyze_review(review.comment)

# Save analysis
db.review_analysis.create({
    review_id: review.id,
    sentiment: analysis['sentiment'],
    aspects: analysis['aspects'],
    spam_score: analysis['spam_score'],
    is_fake_likely: analysis['is_fake_likely']
})

# Only show review if not likely fake
if not analysis['is_fake_likely']:
    db.reviews.update(review.id, {'is_approved': True})
```

### Product Trust Score

```python
# src/ml_service/trust_scorer.py

class ProductTrustScorer:
    def calculate_trust_score(self, product_id: str) -> float:
        """
        Calculate trust score for a product (0-100).
        
        Factors:
        - Seller rating & history
        - Review authenticity (spam detection)
        - Review consistency
        - Stock availability
        - Return rate
        - Certifications
        """
        product = db.products.get_by_id(product_id)
        seller = db.sellers.get_by_id(product.seller_id)
        reviews = db.reviews.get_for_product(product_id)
        
        scores = {}
        
        # 1. Seller credibility (25%)
        scores['seller'] = min(seller.average_rating * 20, 25)
        
        # 2. Review authenticity (25%)
        authentic_reviews = sum(
            1 for r in reviews 
            if not r.analysis.is_fake_likely
        )
        review_auth_ratio = authentic_reviews / len(reviews) if reviews else 1.0
        scores['review_auth'] = review_auth_ratio * 25
        
        # 3. Review consistency (15%)
        ratings = [r.rating for r in reviews]
        if ratings:
            rating_variance = np.var(ratings)
            # Lower variance = more consistent
            consistency = 1 - (rating_variance / 25)
            scores['consistency'] = max(0, consistency * 15)
        
        # 4. Stock availability (10%)
        stock_score = 10 if product.stock_quantity > 10 else (product.stock_quantity / 10 * 10)
        scores['stock'] = stock_score
        
        # 5. Certifications (15%)
        cert_score = len(product.certifications) * 5
        scores['certifications'] = min(cert_score, 15)
        
        # 6. Return rate (10%) - lower is better
        return_rate = self.calculate_return_rate(product_id)
        scores['returns'] = max(0, 10 - (return_rate * 10))
        
        # Calculate weighted total
        total_score = sum(scores.values())
        
        return {
            'score': int(total_score),
            'breakdown': scores,
            'level': self._get_trust_level(total_score)
        }
    
    def _get_trust_level(self, score: int) -> str:
        if score >= 85:
            return 'Highly Trusted'
        elif score >= 70:
            return 'Trusted'
        elif score >= 50:
            return 'Moderate'
        else:
            return 'Low Trust'

# Display trust score on product page
scorer = ProductTrustScorer()
trust_info = scorer.calculate_trust_score(product_id)

# In product detail API response
{
  'product': {...},
  'trust': {
    'score': 87,
    'level': 'Highly Trusted',
    'factors': {
      'seller_rating': 4.8,
      'authentic_reviews': '95%',
      'certifications': ['Organic', 'Cruelty-free']
    }
  }
}
```

---

## 4. Personalized Recommendations

### Collaborative Filtering

```python
# src/ml_service/recommendation_engine.py

from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class RecommendationEngine:
    def __init__(self, db):
        self.db = db
    
    def get_user_recommendations(self, user_id: str, limit: int = 20) -> List[str]:
        """
        Get personalized product recommendations for a user.
        
        Algorithms:
        1. Collaborative Filtering (similar users)
        2. Content-Based (similar to viewed/purchased)
        3. Hybrid approach
        """
        
        # Get user's interaction history
        user_interactions = self._get_user_interactions(user_id)
        
        # 1. Content-based: Similar to viewed/purchased
        content_based = self._content_based_recommendations(
            user_interactions['purchased'],
            user_interactions['viewed'],
            limit // 2
        )
        
        # 2. Collaborative: Users like you also liked
        collab = self._collaborative_recommendations(user_id, limit // 2)
        
        # Combine and rank
        recommendations = self._combine_recommendations(content_based, collab, limit)
        
        return recommendations
    
    def _get_user_interactions(self, user_id: str) -> Dict:
        """Get user's interaction history."""
        return {
            'purchased': self.db.order_items.get_products_for_user(user_id),
            'viewed': self.db.product_views.get_for_user(user_id, days=30),
            'wishlisted': self.db.wishlists.get_for_user(user_id),
            'rated': self.db.reviews.get_by_user(user_id)
        }
    
    def _content_based_recommendations(self, purchased: List, viewed: List, limit: int) -> List:
        """Find products similar to user's purchased/viewed items."""
        if not purchased and not viewed:
            return []
        
        # Get product embeddings
        interaction_products = purchased + viewed
        user_embeddings = self._get_product_embeddings(interaction_products)
        
        # Get all other products not in user's history
        all_products = self.db.products.get_all_active()
        other_products = [p for p in all_products if p.id not in interaction_products]
        
        if not other_products:
            return []
        
        other_embeddings = self._get_product_embeddings([p.id for p in other_products])
        
        # Calculate similarity
        user_avg_embedding = np.mean(user_embeddings, axis=0)
        similarities = cosine_similarity([user_avg_embedding], other_embeddings)[0]
        
        # Get top recommendations
        top_indices = np.argsort(similarities)[-limit:][::-1]
        return [other_products[i].id for i in top_indices]
    
    def _collaborative_recommendations(self, user_id: str, limit: int) -> List:
        """Find products liked by similar users."""
        # Get similar users (based on purchase history)
        similar_users = self._find_similar_users(user_id, k=10)
        
        if not similar_users:
            return []
        
        # Get products purchased by similar users
        similar_user_products = {}
        for user, similarity in similar_users:
            products = self.db.order_items.get_products_for_user(user)
            for p in products:
                if p not in self._get_user_interactions(user_id)['purchased']:
                    similar_user_products[p] = similar_user_products.get(p, 0) + similarity
        
        # Sort by weighted frequency
        top_products = sorted(
            similar_user_products.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        return [p[0] for p in top_products[:limit]]
    
    def _find_similar_users(self, user_id: str, k: int = 10) -> List[Tuple[str, float]]:
        """Find k most similar users."""
        user_vector = self._get_user_vector(user_id)
        all_users = self.db.users.get_all()
        
        user_vectors = {u.id: self._get_user_vector(u.id) for u in all_users}
        
        similarities = {}
        for other_id, other_vector in user_vectors.items():
            if other_id != user_id:
                sim = cosine_similarity([user_vector], [other_vector])[0][0]
                similarities[other_id] = sim
        
        # Return top k
        return sorted(similarities.items(), key=lambda x: x[1], reverse=True)[:k]
    
    def _get_product_embeddings(self, product_ids: List[str]) -> np.ndarray:
        """Get vector embeddings for products."""
        # Could use pre-trained embeddings or calculate on-demand
        embeddings = []
        for pid in product_ids:
            product = self.db.products.get_by_id(pid)
            # Create embedding from product features
            embedding = self._create_product_embedding(product)
            embeddings.append(embedding)
        return np.array(embeddings)
    
    def _create_product_embedding(self, product) -> np.ndarray:
        """Create embedding from product metadata."""
        # Simple embedding: [price_normalized, rating, category_embedding, ...]
        features = [
            product.price / 10000,  # Normalize price
            product.average_rating / 5,  # Normalize rating
            hash(product.category_id) % 100 / 100,  # Category
            product.total_reviews / 1000,  # Popular
        ]
        return np.array(features)
    
    def _get_user_vector(self, user_id: str) -> np.ndarray:
        """Create user preference vector."""
        interactions = self._get_user_interactions(user_id)
        
        if not interactions['purchased'] and not interactions['viewed']:
            return np.zeros(4)
        
        all_products = interactions['purchased'] + interactions['viewed']
        embeddings = self._get_product_embeddings(all_products)
        
        # Average of interacted products
        return np.mean(embeddings, axis=0) if len(embeddings) > 0 else np.zeros(4)

# Usage in backend
recommender = RecommendationEngine(db)

# Get recommendations when user opens homepage
recommendations = recommender.get_user_recommendations(user_id, limit=20)

# Cache recommendations
cache.set(f"recommendations:{user_id}", recommendations, ttl=3600)
```

### Frontend Display

```typescript
// src/components/RecommendedProducts.tsx

export const RecommendedProducts = ({ userId }: { userId: string }) => {
  const { data: recommendations } = useQuery({
    queryKey: ['recommendations', userId],
    queryFn: () => api.get(`/recommendations?userId=${userId}`),
    staleTime: 1 * 60 * 60 * 1000, // 1 hour
  });
  
  return (
    <section className="py-8">
      <h2 className="text-2xl font-bold mb-6">Recommended For You</h2>
      <ProductCarousel products={recommendations} />
    </section>
  );
};
```

---

## 5. Dynamic Pricing & Surge Pricing

### Optimal Pricing Algorithm

```python
# src/ml_service/dynamic_pricing.py

class DynamicPricingEngine:
    def calculate_optimal_price(self, product_id: str) -> float:
        """
        Calculate optimal selling price based on:
        - Competitor prices
        - Demand level
        - Stock quantity
        - Time of day/season
        """
        product = db.products.get_by_id(product_id)
        
        # 1. Get competitor prices
        competitors = self._get_competitor_prices(product)
        avg_competitor_price = np.mean([c['price'] for c in competitors])
        
        # 2. Calculate demand (from views/searches)
        demand_score = self._calculate_demand(product_id)  # 0-1
        
        # 3. Stock level factor
        stock_level = product.stock_quantity
        stock_factor = 1.0 if stock_level > 50 else (stock_level / 50)
        stock_factor = min(stock_factor, 1.0)
        
        # 4. Time-based factor (seasonal, time of day)
        time_factor = self._get_time_factor()
        
        # 5. Calculate optimal margin
        base_price = product.cost_price
        margin_multiplier = 1.0
        
        # Increase price if high demand
        if demand_score > 0.7:
            margin_multiplier += 0.15
        
        # Increase price if low stock
        if stock_level < 10:
            margin_multiplier += 0.10
        
        # Seasonal adjustment
        margin_multiplier *= time_factor
        
        # Calculate final price
        optimal_price = base_price * margin_multiplier
        
        # Don't go too far below competitors
        optimal_price = max(optimal_price, avg_competitor_price * 0.85)
        
        return optimal_price
    
    def _get_competitor_prices(self, product) -> List[Dict]:
        """Get prices from competitor platforms."""
        competitors = []
        
        # Try to find same product on other platforms
        external_products = db.external_products.find_similar(product)
        
        for ep in external_products:
            if ep.platform == 'daraz':
                price = fetch_daraz_price(ep.external_id)
            elif ep.platform == 'pickaboo':
                price = fetch_pickaboo_price(ep.external_id)
            # ...
            
            competitors.append({
                'platform': ep.platform,
                'price': price
            })
        
        return competitors
    
    def _calculate_demand(self, product_id: str) -> float:
        """Calculate demand score (0-1)."""
        # Count views in last 7 days
        views = db.product_views.count_for_product(product_id, days=7)
        
        # Count searches leading to this product
        search_clicks = db.search_events.count_for_product(product_id, days=7)
        
        # Count in wishlists
        wishlist_count = db.wishlists.count_for_product(product_id)
        
        # Normalize (assuming max 1000 views/week for popular item)
        demand = (views + search_clicks * 2 + wishlist_count) / 3000
        
        return min(demand, 1.0)
    
    def _get_time_factor(self) -> float:
        """Get seasonal/time-based price factor."""
        current_date = datetime.now()
        
        # Holiday/festival periods (apply surge)
        holidays = {
            'pohela_boishakh': (4, 14),  # Bengali New Year
            'eid': [(4, 10), (7, 18)],   # Eid dates vary
            'valentine': (2, 14),
            'christmas': (12, 25),
        }
        
        for holiday, (month, day) in holidays.items():
            if isinstance(day, list):
                for m, d in day:
                    if current_date.month == m and current_date.day == d:
                        return 1.15  # 15% surge for holidays
        
        return 1.0

# Usage: Update prices periodically
pricing_engine = DynamicPricingEngine()

# Run every hour or when conditions change
products = db.products.get_all_active()
for product in products:
    optimal_price = pricing_engine.calculate_optimal_price(product.id)
    db.products.update(product.id, {'price': optimal_price})
```

---

## ML Pipeline Architecture

```python
# src/ml_service/pipeline.py

class MLPipeline:
    def __init__(self):
        self.product_matcher = ProductMatcher()
        self.review_analyzer = ReviewAnalyzer()
        self.recommendation_engine = RecommendationEngine(db)
        self.trust_scorer = ProductTrustScorer()
        self.pricing_engine = DynamicPricingEngine()
    
    def daily_batch_jobs(self):
        """Run ML jobs daily."""
        # 1. Update product embeddings
        self.update_product_vectors()
        
        # 2. Analyze new reviews
        self.analyze_pending_reviews()
        
        # 3. Update trust scores
        self.update_all_trust_scores()
        
        # 4. Optimize pricing
        self.optimize_all_prices()
        
        # 5. Generate new recommendations
        self.generate_recommendations_for_all_users()
    
    def hourly_jobs(self):
        """Run every hour."""
        # Track prices from external platforms
        self.sync_external_prices()
        
        # Check for price drop alerts to send
        self.process_price_drop_alerts()

# Schedule jobs
scheduler.add_job(ml_pipeline.daily_batch_jobs, 'cron', hour=2)  # 2 AM
scheduler.add_job(ml_pipeline.hourly_jobs, 'interval', hours=1)
```

---

## ML Service Deployment

### Python FastAPI Service

```python
# src/ml_service/main.py

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class ProductMatchRequest(BaseModel):
    product: dict
    candidates: list[dict]

@app.post("/match-products")
async def match_products(request: ProductMatchRequest):
    matcher = ProductMatcher()
    matches = matcher.match_product(request.product, request.candidates)
    return matches

@app.post("/analyze-review")
async def analyze_review(review_text: str):
    analyzer = ReviewAnalyzer()
    analysis = analyzer.analyze_review(review_text)
    return analysis

@app.post("/get-recommendations")
async def get_recommendations(user_id: str, limit: int = 20):
    recommender = RecommendationEngine(db)
    recommendations = recommender.get_user_recommendations(user_id, limit)
    return recommendations

@app.post("/calculate-optimal-price")
async def calculate_optimal_price(product_id: str):
    pricing = DynamicPricingEngine()
    price = pricing.calculate_optimal_price(product_id)
    return {"optimal_price": price}

# Run with: uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## Data Science Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Product Matching Accuracy | > 95% | Manual validation |
| Review Spam Detection | > 90% precision | Confusion matrix |
| Recommendation CTR | > 5% | Click tracking |
| Trust Score Correlation | > 0.8 | With actual returns |
| Price Optimization Revenue | > 10% uplift | A/B testing |

---

**ML Version**: 1.0  
**Last Updated**: March 2026  
**Status**: Phase 2+ (Post-MVP)
