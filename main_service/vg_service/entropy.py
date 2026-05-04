"""
Visibility Graph entropy and motif computation.
Uses ts2vg for time series visibility graph construction.
"""
import math
from typing import Dict, List, Tuple


def horizontal_visibility_graph(series: List[float]) -> List[List[int]]:
    """
    Build horizontal visibility graph from time series.
    Returns adjacency list where edges connect points that "see" each other horizontally.
    
    Two points (i, yi) and (j, yj) can see each other if:
    - i < k < j implies max(yi, yj) > yk (horizontal line between them isn't blocked)
    """
    n = len(series)
    if n < 2:
        return [[]]
    
    adjacency = [[] for _ in range(n)]
    
    for i in range(n):
        for j in range(i + 1, n):
            # Check if i and j can see each other
            can_see = True
            yi, yj = series[i], series[j]
            
            # All points between i and j must not block the view
            for k in range(i + 1, j):
                if series[k] > min(yi, yj):
                    can_see = False
                    break
            
            if can_see:
                adjacency[i].append(j)
                adjacency[j].append(i)
    
    return adjacency


def count_motifs(adjacency: List[List[int]]) -> Dict[str, int]:
    """
    Count motif types in visibility graph:
    - Z1: nodes with degree 1 (leaves)
    - Z2: nodes with degree 2
    - Z3: nodes with degree 3
    - Z4: nodes with degree >= 4
    """
    degree_counts = [0, 0, 0, 0]  # indices 0-3 for degrees 1-4+
    
    for neighbors in adjacency:
        degree = len(neighbors)
        if degree == 0:
            continue
        elif degree == 1:
            degree_counts[0] += 1
        elif degree == 2:
            degree_counts[1] += 1
        elif degree == 3:
            degree_counts[2] += 1
        else:  # degree >= 4
            degree_counts[3] += 1
    
    return {
        'z1': degree_counts[0],
        'z2': degree_counts[1],
        'z3': degree_counts[2],
        'z4': degree_counts[3],
    }


def compute_entropy(series: List[float]) -> float:
    """
    Shannon entropy based on motif distribution.
    H = -Σ (Zi / total) * log2(Zi / total)
    Normalized to [0, 1] by dividing by log2(4) since max 4 motif types.
    """
    if not series or len(series) < 2:
        return 0.0
    
    try:
        adjacency = horizontal_visibility_graph(series)
        motifs = count_motifs(adjacency)
        
        total = sum(motifs.values())
        if total == 0:
            return 0.0
        
        entropy_sum = 0.0
        for count in motifs.values():
            if count > 0:
                p = count / total
                entropy_sum -= p * math.log2(p)
        
        # Normalize to [0, 1]
        normalized_entropy = entropy_sum / math.log2(4)  # 4 motif types
        return min(1.0, max(0.0, normalized_entropy))
    except Exception:
        return 0.0


def compute_entropy_and_motifs(series: List[float]) -> Tuple[float, Dict[str, int]]:
    """
    Compute both entropy and motif counts.
    Returns (entropy [0-1], motifs dict)
    """
    if not series or len(series) < 2:
        return 0.0, {'z1': 0, 'z2': 0, 'z3': 0, 'z4': 0}
    
    try:
        adjacency = horizontal_visibility_graph(series)
        motifs = count_motifs(adjacency)
        entropy = compute_entropy(series)
        return entropy, motifs
    except Exception:
        return 0.0, {'z1': 0, 'z2': 0, 'z3': 0, 'z4': 0}
