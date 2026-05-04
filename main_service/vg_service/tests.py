"""
Test cases for VG Service entropy and motif computation.
Run: python -m pytest vg_service/tests.py -v
"""
import pytest
from vg_service.entropy import (
    horizontal_visibility_graph,
    count_motifs,
    compute_entropy,
    compute_entropy_and_motifs,
)


class TestHVG:
    def test_empty_series(self):
        """Empty series should return empty adjacency."""
        result = horizontal_visibility_graph([])
        assert result == [[]]

    def test_single_point(self):
        """Single point has no connections."""
        result = horizontal_visibility_graph([1.0])
        assert len(result) == 1

    def test_two_points(self):
        """Two points always see each other."""
        result = horizontal_visibility_graph([1.0, 2.0])
        assert len(result) == 2
        assert 1 in result[0]  # point 0 sees point 1
        assert 0 in result[1]  # point 1 sees point 0

    def test_blocked_visibility(self):
        """Middle point blocks visibility between outer points."""
        # Points: 1.0, 2.0 (tall), 1.0
        # Point 0 and point 2 should NOT see each other
        result = horizontal_visibility_graph([1.0, 2.0, 1.0])
        assert 2 not in result[0]  # point 0 cannot see point 2
        assert 0 not in result[2]  # point 2 cannot see point 0


class TestMotifs:
    def test_motif_counting(self):
        """Count nodes by degree."""
        # Simple: 0-1-2-3 (chain)
        adjacency = [
            [1],        # degree 1 (z1)
            [0, 2],     # degree 2 (z2)
            [1, 3],     # degree 2 (z2)
            [2],        # degree 1 (z1)
        ]
        motifs = count_motifs(adjacency)
        assert motifs['z1'] == 2  # two leaf nodes
        assert motifs['z2'] == 2  # two middle nodes
        assert motifs['z3'] == 0
        assert motifs['z4'] == 0

    def test_empty_graph(self):
        """Empty graph should have no motifs."""
        motifs = count_motifs([])
        assert motifs == {'z1': 0, 'z2': 0, 'z3': 0, 'z4': 0}


class TestEntropy:
    def test_entropy_bounds(self):
        """Entropy should be in [0, 1]."""
        test_cases = [
            [1.0],
            [1.0, 2.0],
            [0.5, 1.0, 1.5, 2.0],
            list(range(20)),
        ]
        for series in test_cases:
            entropy = compute_entropy(series)
            assert 0.0 <= entropy <= 1.0

    def test_entropy_low_for_ordered(self):
        """Low entropy for ordered series (predictable)."""
        entropy = compute_entropy([1.0, 2.0, 3.0, 4.0, 5.0])
        assert entropy < 0.5  # Should be relatively low

    def test_entropy_and_motifs_returns_tuple(self):
        """Should return (entropy, motifs) tuple."""
        entropy, motifs = compute_entropy_and_motifs([1.0, 2.0, 3.0])
        assert isinstance(entropy, float)
        assert isinstance(motifs, dict)
        assert 'z1' in motifs
        assert 0.0 <= entropy <= 1.0


class TestIntegration:
    def test_mouse_speed_example(self):
        """Example: mouse speed time-series."""
        # Realistic mouse speed pattern: slow, fast, normal, slow
        mouse_speeds = [0.1, 0.5, 1.2, 0.8, 0.3, 0.2, 0.9, 1.5, 0.4]
        entropy, motifs = compute_entropy_and_motifs(mouse_speeds)
        
        assert isinstance(entropy, float)
        assert 0.0 <= entropy <= 1.0
        assert motifs['z1'] >= 0
        assert motifs['z2'] >= 0
        assert sum(motifs.values()) > 0  # Should have some nodes

    def test_high_entropy_random_like(self):
        """Random-like series should have higher entropy."""
        import math
        
        # Create chaotic pattern (higher entropy)
        chaotic = [math.sin(i * 0.7) + math.cos(i * 1.3) for i in range(30)]
        entropy_chaotic = compute_entropy(chaotic)
        
        # Create ordered pattern (lower entropy)
        ordered = list(range(30))
        entropy_ordered = compute_entropy(ordered)
        
        # Chaotic should generally have higher entropy
        assert entropy_chaotic >= entropy_ordered


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
