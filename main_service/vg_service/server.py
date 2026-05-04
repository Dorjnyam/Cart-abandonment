"""
VG Service REST API Server.
Runs on port 8005 by default.
Endpoint: POST /compute-entropy
"""
import logging
from flask import Flask, request, jsonify
from vg_service.entropy import compute_entropy_and_motifs

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.route('/compute-entropy', methods=['POST'])
def compute_entropy_endpoint():
    """
    Compute entropy and motifs from mouse tracking time series.
    
    Expected JSON body:
    {
        "session_id": "...",
        "events": [float, float, ...],  # mouse speed or distance time-series
        "fallback": true/false
    }
    
    Returns:
    {
        "entropy": 0.0-1.0,
        "motifs": {
            "z1": int,
            "z2": int,
            "z3": int,
            "z4": int
        }
    }
    """
    try:
        data = request.get_json() or {}
        session_id = data.get('session_id', 'unknown')
        events = data.get('events', [])
        
        if not events or not isinstance(events, list):
            logger.warning(f"Invalid events for session {session_id}: empty or not a list")
            return jsonify({
                "entropy": 0.0,
                "motifs": {"z1": 0, "z2": 0, "z3": 0, "z4": 0},
                "warning": "empty_events"
            }), 400
        
        # Ensure all events are floats
        try:
            series = [float(x) for x in events]
        except (ValueError, TypeError):
            logger.warning(f"Invalid event values for session {session_id}")
            return jsonify({
                "entropy": 0.0,
                "motifs": {"z1": 0, "z2": 0, "z3": 0, "z4": 0},
                "warning": "invalid_event_values"
            }), 400
        
        entropy, motifs = compute_entropy_and_motifs(series)
        
        logger.info(f"Computed entropy for session {session_id}: {entropy:.4f}")
        return jsonify({
            "entropy": round(float(entropy), 4),
            "motifs": motifs
        }), 200
    
    except Exception as e:
        logger.exception(f"Error computing entropy: {e}")
        return jsonify({
            "error": str(e),
            "entropy": 0.0,
            "motifs": {"z1": 0, "z2": 0, "z3": 0, "z4": 0}
        }), 500


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "ok"}), 200


if __name__ == '__main__':
    # Run on port 8005
    app.run(host='0.0.0.0', port=8005, debug=False)
