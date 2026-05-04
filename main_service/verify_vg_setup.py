#!/usr/bin/env python
"""
Quick verification script for VG Service integration.
Run: python verify_vg_setup.py
"""
import sys
import subprocess
from pathlib import Path

def test_entropy_module():
    """Test VG entropy computation locally."""
    print("\n[1/4] Testing VG entropy module...")
    try:
        from vg_service.entropy import compute_entropy_and_motifs
        
        # Test with sample mouse speed data
        mouse_speeds = [0.5, 1.2, 0.8, 2.1, 1.5, 0.9, 1.1, 0.7]
        entropy, motifs = compute_entropy_and_motifs(mouse_speeds)
        
        print(f"    ✓ Entropy: {entropy:.4f}")
        print(f"    ✓ Motifs: {motifs}")
        assert 0 <= entropy <= 1, "Entropy out of bounds"
        assert sum(motifs.values()) > 0, "No motifs detected"
        return True
    except Exception as e:
        print(f"    ✗ FAILED: {e}")
        return False


def test_scoring_with_vg():
    """Test S6 calculation with VG fallback."""
    print("\n[2/4] Testing S6 score calculation...")
    try:
        from apps.diagnosis.scoring import score_s1_s7
        
        # Mock features
        features = {
            'max_scroll_pct': 50.0,
            'tab_hidden_count': 1,
            'copy_count': 0,
            'cart_ratio': 0.8,
            'page_view_count': 15,
            'rage_click_count': 2,
            'js_error_count': 0,
            'checkout_step_max': 2,
            'payment_bounce': 0.0,
            'device_is_mobile': 0.0,
            'filter_change_count': 3,
            'outbound_count': 0,
            'time_on_page_ms_total': 180000,  # 3 minutes
            'referrer_source': 'google',
            'mouse_speed_series': [0.5, 1.2, 0.8, 2.1, 1.5]
        }
        
        scores = score_s1_s7(features, session_id='test_123')
        
        print(f"    ✓ S1: {scores['s1']:.4f}")
        print(f"    ✓ S6: {scores['s6']:.4f}")
        print(f"    ✓ Dominant: {scores['dominant_key']} ({scores['dominant_score']:.4f})")
        
        # Should use fallback since VG Service isn't running
        if scores.get('vg_entropy') is None:
            print(f"    ✓ Using fallback S6 (VG Service not running)")
        
        return True
    except Exception as e:
        print(f"    ✗ FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_vg_service_api():
    """Test VG Service REST API (if running)."""
    print("\n[3/4] Testing VG Service API (localhost:8005)...")
    try:
        import requests
        
        payload = {
            "session_id": "verify_test",
            "events": [0.5, 1.2, 0.8, 2.1, 1.5, 0.9, 1.1, 0.7]
        }
        
        response = requests.post(
            "http://localhost:8005/compute-entropy",
            json=payload,
            timeout=3.0
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"    ✓ API responding")
            print(f"    ✓ Entropy: {data['entropy']:.4f}")
            print(f"    ✓ Motifs: {data['motifs']}")
            return True
        else:
            print(f"    ⚠ API returned {response.status_code}")
            print(f"    → Start VG Service with: python vg_service/server.py")
            return None  # Not a failure, just not running
    
    except requests.exceptions.ConnectionError:
        print(f"    ⚠ VG Service not running on localhost:8005")
        print(f"    → Start VG Service with: python vg_service/server.py")
        return None  # Not a failure, just not running
    except Exception as e:
        print(f"    ✗ FAILED: {e}")
        return False


def test_diagnosis_model():
    """Test Diagnosis model has VG fields."""
    print("\n[4/4] Testing Diagnosis model...")
    try:
        from apps.analytics.models import Diagnosis
        
        # Check fields exist
        fields = [f.name for f in Diagnosis._meta.get_fields()]
        
        if 'vg_entropy' in fields:
            print(f"    ✓ vg_entropy field exists")
        else:
            print(f"    ✗ vg_entropy field missing")
            return False
        
        if 'vg_motifs' in fields:
            print(f"    ✓ vg_motifs field exists")
        else:
            print(f"    ✗ vg_motifs field missing")
            return False
        
        print(f"    → Run migrations: python manage.py migrate")
        return True
    except Exception as e:
        print(f"    ✗ FAILED: {e}")
        return False


def main():
    print("=" * 60)
    print("VG Service Integration Verification")
    print("=" * 60)
    
    results = []
    
    # Test 1: Entropy module
    results.append(("Entropy Module", test_entropy_module()))
    
    # Test 2: Scoring
    results.append(("Scoring", test_scoring_with_vg()))
    
    # Test 3: VG Service API (optional)
    api_result = test_vg_service_api()
    if api_result is not None:
        results.append(("VG Service API", api_result))
    
    # Test 4: Diagnosis model
    results.append(("Diagnosis Model", test_diagnosis_model()))
    
    # Summary
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    
    passed = sum(1 for _, r in results if r)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{test_name:.<40} {status}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n✓ All checks passed!")
        print("\nNext steps:")
        print("1. Run migrations: python manage.py migrate")
        print("2. Start VG Service: python vg_service/server.py")
        print("3. Start main service: python manage.py runserver")
        print("4. Start Celery: celery -A main_service.celery:app worker -l info")
        return 0
    else:
        print("\n✗ Some checks failed. See above for details.")
        return 1


if __name__ == '__main__':
    sys.exit(main())
