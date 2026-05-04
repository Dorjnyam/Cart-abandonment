# Visibility Graph (VG) Service

Standalone microservice for computing entropy and motif counts from mouse tracking time-series data using horizontal visibility graph algorithms.

## Setup

### Install Dependencies
```bash
pip install flask requests
```

### Run the VG Service

```bash
# Option 1: Direct Python
python vg_service/server.py

# Option 2: With gunicorn (production)
gunicorn -w 2 -b 0.0.0.0:8005 vg_service.server:app
```

The service will run on `http://localhost:8005`

## API Endpoints

### POST /compute-entropy
Compute Shannon entropy and motif counts from a mouse tracking time-series.

**Request:**
```json
{
    "session_id": "session_123",
    "events": [0.5, 1.2, 0.8, 2.1, 1.5, ...],
    "fallback": false
}
```

**Response (200 OK):**
```json
{
    "entropy": 0.65,
    "motifs": {
        "z1": 5,
        "z2": 8,
        "z3": 2,
        "z4": 1
    }
}
```

**Response (4xx/5xx):**
```json
{
    "error": "invalid_event_values",
    "entropy": 0.0,
    "motifs": {"z1": 0, "z2": 0, "z3": 0, "z4": 0}
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
    "status": "ok"
}
```

## Algorithm

### Horizontal Visibility Graph (HVG)

For a time-series with n points, builds a graph where:
- Each point is a node
- Two points (i, yi) and (j, yj) have an edge if they "see" each other horizontally
- Vision condition: all points k between i and j satisfy max(yi, yj) > yk

### Motif Classification

Nodes are classified by degree (number of connections):
- **Z1**: Degree 1 (leaf nodes) - isolated spikes
- **Z2**: Degree 2 - normal flow
- **Z3**: Degree 3 - bifurcations
- **Z4**: Degree 4+ - complex hubs

### Shannon Entropy

H = -Σ (Zi / total) × log₂(Zi / total)

Normalized to [0, 1] by dividing by log₂(4), indicating disorder in mouse behavior pattern:
- **0.0-0.2**: Highly organized, predictable movement
- **0.2-0.5**: Structured with some variation
- **0.5-0.8**: Chaotic, confused searching
- **0.8-1.0**: Maximum entropy, random-like behavior

## Integration with Main Service

The main Django service calls this endpoint from `apps/diagnosis/scoring.py`:

```python
response = requests.post(
    "http://localhost:8005/compute-entropy",
    json={"session_id": "...", "events": [mouse_speed_data]},
    timeout=2.0
)
```

If the service is unavailable or takes > 2 seconds, S6 score falls back to the simple time/page-view formula.

## Testing

```bash
# Test entropy computation
python -c "
from vg_service.entropy import compute_entropy_and_motifs
series = [0.5, 1.2, 0.8, 2.1, 1.5, 0.9, 1.1, 0.7]
entropy, motifs = compute_entropy_and_motifs(series)
print(f'Entropy: {entropy:.4f}')
print(f'Motifs: {motifs}')
"

# Test API
curl -X POST http://localhost:8005/compute-entropy \
  -H "Content-Type: application/json" \
  -d '{"session_id": "test_123", "events": [0.5, 1.2, 0.8, 2.1, 1.5]}'
```
