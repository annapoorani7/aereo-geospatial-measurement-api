"""
Spatial operations service for Aereo GeoMeasure.

Provides advanced geospatial analysis operations:
- Buffer zones
- Intersection detection
- Union/Dissolve
- Centroid calculation
- Convex hull
- Bounding box
"""

from typing import Any

from shapely.geometry import shape, mapping
from shapely.ops import unary_union

from app.logging_config import get_logger
from app.schemas.files import FeatureResponse

logger = get_logger(__name__)


def buffer_geometry(feature: FeatureResponse, distance: float) -> dict[str, Any]:
    """
    Create a buffer zone around a geometry.
    
    Args:
        feature: Feature to buffer
        distance: Buffer distance in the same units as the geometry
        
    Returns:
        Dictionary with buffered geometry and metadata
    """
    try:
        geometry = shape(feature.geometry)
        buffered = geometry.buffer(distance)
        
        logger.info(f"Feature {feature.feature_id}: buffered by {distance} units")
        
        return {
            "feature_id": feature.feature_id,
            "original_geometry_type": feature.geometry_type,
            "buffer_distance": distance,
            "buffered_geometry": mapping(buffered),
            "buffered_area": buffered.area,
            "success": True,
        }
    except Exception as exc:
        logger.error(f"Feature {feature.feature_id}: buffer failed - {exc}")
        return {
            "feature_id": feature.feature_id,
            "buffer_distance": distance,
            "success": False,
            "error": str(exc),
        }


def find_intersections(features: list[FeatureResponse]) -> list[dict[str, Any]]:
    """
    Find all intersecting feature pairs.
    
    Args:
        features: List of features to check
        
    Returns:
        List of intersection results
    """
    logger.info(f"Finding intersections among {len(features)} features")
    intersections = []
    
    geometries = []
    for feature in features:
        try:
            geometries.append((feature.feature_id, shape(feature.geometry)))
        except Exception as exc:
            logger.warning(f"Feature {feature.feature_id}: could not parse geometry - {exc}")
            continue
    
    # Check all pairs
    for i, (id1, geom1) in enumerate(geometries):
        for id2, geom2 in geometries[i + 1 :]:
            if geom1.intersects(geom2):
                intersection = geom1.intersection(geom2)
                intersections.append({
                    "feature_1_id": id1,
                    "feature_2_id": id2,
                    "intersects": True,
                    "intersection_type": intersection.geom_type,
                    "intersection_area": intersection.area if hasattr(intersection, "area") else None,
                    "intersection_geometry": mapping(intersection),
                })
    
    logger.info(f"Found {len(intersections)} intersecting feature pairs")
    return intersections


def union_features(features: list[FeatureResponse]) -> dict[str, Any]:
    """
    Create a union (dissolve) of multiple features.
    
    Combines all geometries into a single geometry.
    
    Args:
        features: List of features to union
        
    Returns:
        Dictionary with union result
    """
    logger.info(f"Creating union of {len(features)} features")
    
    try:
        geometries = []
        for feature in features:
            try:
                geometries.append(shape(feature.geometry))
            except Exception as exc:
                logger.warning(f"Feature {feature.feature_id}: skipped - {exc}")
                continue
        
        if not geometries:
            return {
                "success": False,
                "error": "No valid geometries to union",
            }
        
        union_geom = unary_union(geometries)
        
        return {
            "success": True,
            "input_feature_count": len(features),
            "valid_geometries": len(geometries),
            "union_geometry_type": union_geom.geom_type,
            "union_area": union_geom.area if hasattr(union_geom, "area") else None,
            "union_length": union_geom.length if hasattr(union_geom, "length") else None,
            "union_geometry": mapping(union_geom),
        }
    except Exception as exc:
        logger.error(f"Union operation failed - {exc}")
        return {
            "success": False,
            "error": str(exc),
        }


def get_centroid(feature: FeatureResponse) -> dict[str, Any]:
    """
    Calculate the centroid (center point) of a geometry.
    
    Args:
        feature: Feature to calculate centroid for
        
    Returns:
        Dictionary with centroid coordinates
    """
    try:
        geometry = shape(feature.geometry)
        centroid = geometry.centroid
        
        logger.info(f"Feature {feature.feature_id}: centroid calculated")
        
        return {
            "feature_id": feature.feature_id,
            "geometry_type": feature.geometry_type,
            "centroid_coordinates": list(centroid.coords[0]),
            "centroid_geometry": mapping(centroid),
            "success": True,
        }
    except Exception as exc:
        logger.error(f"Feature {feature.feature_id}: centroid calculation failed - {exc}")
        return {
            "feature_id": feature.feature_id,
            "success": False,
            "error": str(exc),
        }


def get_convex_hull(feature: FeatureResponse) -> dict[str, Any]:
    """
    Calculate the convex hull of a geometry.
    
    The convex hull is the smallest convex polygon containing all points.
    
    Args:
        feature: Feature to calculate convex hull for
        
    Returns:
        Dictionary with convex hull geometry
    """
    try:
        geometry = shape(feature.geometry)
        hull = geometry.convex_hull
        
        logger.info(f"Feature {feature.feature_id}: convex hull calculated")
        
        return {
            "feature_id": feature.feature_id,
            "original_geometry_type": feature.geometry_type,
            "hull_geometry_type": hull.geom_type,
            "hull_area": hull.area if hasattr(hull, "area") else None,
            "hull_geometry": mapping(hull),
            "success": True,
        }
    except Exception as exc:
        logger.error(f"Feature {feature.feature_id}: convex hull calculation failed - {exc}")
        return {
            "feature_id": feature.feature_id,
            "success": False,
            "error": str(exc),
        }


def get_bounding_box(feature: FeatureResponse) -> dict[str, Any]:
    """
    Calculate the bounding box (envelope) of a geometry.
    
    Args:
        feature: Feature to calculate bounding box for
        
    Returns:
        Dictionary with bounding box coordinates and geometry
    """
    try:
        geometry = shape(feature.geometry)
        bounds = geometry.bounds  # (minx, miny, maxx, maxy)
        envelope = geometry.envelope
        
        logger.info(f"Feature {feature.feature_id}: bounding box calculated")
        
        return {
            "feature_id": feature.feature_id,
            "geometry_type": feature.geometry_type,
            "bounds": {
                "min_x": bounds[0],
                "min_y": bounds[1],
                "max_x": bounds[2],
                "max_y": bounds[3],
            },
            "width": bounds[2] - bounds[0],
            "height": bounds[3] - bounds[1],
            "envelope_geometry": mapping(envelope),
            "success": True,
        }
    except Exception as exc:
        logger.error(f"Feature {feature.feature_id}: bounding box calculation failed - {exc}")
        return {
            "feature_id": feature.feature_id,
            "success": False,
            "error": str(exc),
        }


def simplify_geometry(feature: FeatureResponse, tolerance: float) -> dict[str, Any]:
    """
    Simplify a geometry by removing unnecessary vertices.
    
    Uses the Douglas-Peucker algorithm.
    
    Args:
        feature: Feature to simplify
        tolerance: Simplification tolerance (in same units as geometry)
        
    Returns:
        Dictionary with simplified geometry
    """
    try:
        geometry = shape(feature.geometry)
        simplified = geometry.simplify(tolerance)
        
        original_coords = len(list(geometry.coords))
        simplified_coords = len(list(simplified.coords))
        reduction = ((original_coords - simplified_coords) / original_coords * 100) if original_coords > 0 else 0
        
        logger.info(
            f"Feature {feature.feature_id}: simplified from {original_coords} to {simplified_coords} vertices ({reduction:.1f}% reduction)"
        )
        
        return {
            "feature_id": feature.feature_id,
            "geometry_type": feature.geometry_type,
            "tolerance": tolerance,
            "original_vertex_count": original_coords,
            "simplified_vertex_count": simplified_coords,
            "vertex_reduction_percent": reduction,
            "simplified_geometry": mapping(simplified),
            "success": True,
        }
    except Exception as exc:
        logger.error(f"Feature {feature.feature_id}: simplification failed - {exc}")
        return {
            "feature_id": feature.feature_id,
            "success": False,
            "error": str(exc),
        }
