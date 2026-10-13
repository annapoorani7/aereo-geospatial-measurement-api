"""
CRS (Coordinate Reference System) conversion service for Aereo GeoMeasure.

Provides coordinate system conversion, transformation, and CRS information utilities.
"""

from typing import Any

from pyproj import CRS, Transformer
from pyproj.exceptions import CRSError
from shapely.geometry import shape, mapping
from shapely.ops import transform

from app.logging_config import get_logger
from app.schemas.files import FeatureResponse

logger = get_logger(__name__)


def parse_crs(crs_input: str) -> dict[str, Any]:
    """
    Parse and validate a CRS string.
    
    Supports multiple formats:
    - EPSG codes: "EPSG:4326"
    - WKT strings: "PROJCS[...]"
    - PROJ strings: "+proj=longlat +datum=WGS84"
    
    Args:
        crs_input: CRS string in any supported format
        
    Returns:
        Dictionary with CRS information
    """
    try:
        crs = CRS.from_user_input(crs_input)
        
        return {
            "success": True,
            "input": crs_input,
            "epsg_code": crs.to_epsg(),
            "name": crs.name,
            "is_geographic": crs.is_geographic,
            "is_projected": crs.is_projected,
            "wkt": crs.to_wkt(),
            "proj_string": crs.to_proj4(),
        }
    except CRSError as exc:
        logger.warning(f"CRS parsing failed for '{crs_input}': {exc}")
        return {
            "success": False,
            "input": crs_input,
            "error": str(exc),
        }


def get_crs_info(crs_string: str) -> dict[str, Any]:
    """
    Get detailed information about a CRS.
    
    Args:
        crs_string: CRS string (EPSG code, WKT, or PROJ)
        
    Returns:
        Dictionary with CRS details
    """
    try:
        crs = CRS.from_user_input(crs_string)
        
        info = {
            "name": crs.name,
            "epsg_code": crs.to_epsg(),
            "is_geographic": crs.is_geographic,
            "is_projected": crs.is_projected,
            "is_compound": crs.is_compound,
            "is_bound": crs.is_bound,
        }
        
        # Add axis information
        if hasattr(crs, "axis_info"):
            info["axes"] = [
                {
                    "name": axis.name,
                    "abbrev": axis.abbrev,
                    "direction": axis.direction,
                    "unit_name": axis.unit_name,
                }
                for axis in crs.axis_info
            ]
        
        # Add area of use if available
        if crs.area_of_use:
            info["area_of_use"] = {
                "name": crs.area_of_use.name,
                "west": crs.area_of_use.west,
                "south": crs.area_of_use.south,
                "east": crs.area_of_use.east,
                "north": crs.area_of_use.north,
            }
        
        logger.debug(f"CRS info retrieved for {crs_string}")
        return {"success": True, "crs_info": info}
    
    except Exception as exc:
        logger.error(f"Failed to get CRS info for {crs_string}: {exc}")
        return {"success": False, "error": str(exc)}


def transform_coordinates(
    coordinates: list[float],
    source_crs: str,
    target_crs: str,
) -> dict[str, Any]:
    """
    Transform coordinates from one CRS to another.
    
    Args:
        coordinates: [x, y] or [x, y, z] coordinates
        source_crs: Source CRS string
        target_crs: Target CRS string
        
    Returns:
        Dictionary with transformed coordinates
    """
    try:
        source = CRS.from_user_input(source_crs)
        target = CRS.from_user_input(target_crs)
        transformer = Transformer.from_crs(source, target, always_xy=True)
        
        if len(coordinates) == 2:
            x, y = transformer.transform(coordinates[0], coordinates[1])
            transformed = [x, y]
        elif len(coordinates) == 3:
            x, y, z = transformer.transform(coordinates[0], coordinates[1], coordinates[2])
            transformed = [x, y, z]
        else:
            return {"success": False, "error": "Coordinates must be [x, y] or [x, y, z]"}
        
        logger.debug(f"Coordinates transformed from {source_crs} to {target_crs}")
        return {
            "success": True,
            "source_crs": source_crs,
            "target_crs": target_crs,
            "original_coordinates": coordinates,
            "transformed_coordinates": transformed,
        }
    
    except Exception as exc:
        logger.error(f"Coordinate transformation failed: {exc}")
        return {"success": False, "error": str(exc)}


def transform_geometry(
    feature: FeatureResponse,
    target_crs: str,
) -> dict[str, Any]:
    """
    Transform a feature's geometry to a different CRS.
    
    Args:
        feature: Feature with geometry to transform
        target_crs: Target CRS string
        
    Returns:
        Dictionary with transformed geometry
    """
    if not feature.source_crs:
        return {
            "success": False,
            "error": "Feature has no source CRS",
        }
    
    try:
        source = CRS.from_user_input(feature.source_crs)
        target = CRS.from_user_input(target_crs)
        transformer = Transformer.from_crs(source, target, always_xy=True)
        
        geometry = shape(feature.geometry)
        transformed_geometry = transform(transformer.transform, geometry)
        
        logger.info(f"Feature {feature.feature_id}: geometry transformed to {target_crs}")
        
        return {
            "success": True,
            "feature_id": feature.feature_id,
            "source_crs": feature.source_crs,
            "target_crs": target_crs,
            "original_geometry": feature.geometry,
            "transformed_geometry": mapping(transformed_geometry),
        }
    
    except Exception as exc:
        logger.error(f"Geometry transformation failed for {feature.feature_id}: {exc}")
        return {
            "success": False,
            "feature_id": feature.feature_id,
            "error": str(exc),
        }


def find_utm_zone(longitude: float, latitude: float) -> dict[str, Any]:
    """
    Find the appropriate UTM zone for given coordinates.
    
    Args:
        longitude: Longitude in degrees (-180 to 180)
        latitude: Latitude in degrees (-90 to 90)
        
    Returns:
        Dictionary with UTM zone information
    """
    from math import floor
    
    if not (-180 <= longitude <= 180 and -90 <= latitude <= 90):
        return {
            "success": False,
            "error": "Coordinates out of valid range",
        }
    
    # Calculate UTM zone
    zone = max(1, min(60, floor((longitude + 180) / 6) + 1))
    hemisphere = "north" if latitude >= 0 else "south"
    epsg_code = (32600 if latitude >= 0 else 32700) + zone
    
    logger.debug(f"UTM zone calculated for ({longitude}, {latitude}): zone {zone} {hemisphere}")
    
    return {
        "success": True,
        "longitude": longitude,
        "latitude": latitude,
        "utm_zone": zone,
        "hemisphere": hemisphere,
        "epsg_code": f"EPSG:{epsg_code}",
    }


def list_common_crs() -> dict[str, Any]:
    """
    Get a list of commonly used CRS codes.
    
    Returns:
        Dictionary with common CRS information
    """
    common_crs = {
        "WGS84": "EPSG:4326",
        "Web Mercator": "EPSG:3857",
        "UTM Zone 31N": "EPSG:32631",
        "UTM Zone 32N": "EPSG:32632",
        "UTM Zone 33N": "EPSG:32633",
        "British National Grid": "EPSG:27700",
        "Irish National Grid": "EPSG:29902",
        "NAD83": "EPSG:4269",
        "NAD83 UTM Zone 10N": "EPSG:26910",
        "ETRS89": "EPSG:4258",
        "ETRS89 UTM Zone 31N": "EPSG:25831",
    }
    
    result = {}
    for name, code in common_crs.items():
        crs_info = parse_crs(code)
        if crs_info["success"]:
            result[name] = {
                "code": code,
                "epsg": crs_info.get("epsg_code"),
                "is_geographic": crs_info.get("is_geographic"),
                "is_projected": crs_info.get("is_projected"),
            }
    
    return {"common_crs": result}


def validate_crs_compatibility(crs1: str, crs2: str) -> dict[str, Any]:
    """
    Check if two CRS are compatible for transformation.
    
    Args:
        crs1: First CRS string
        crs2: Second CRS string
        
    Returns:
        Dictionary with compatibility information
    """
    try:
        source = CRS.from_user_input(crs1)
        target = CRS.from_user_input(crs2)
        
        # Try to create a transformer
        transformer = Transformer.from_crs(source, target, always_xy=True)
        
        return {
            "success": True,
            "crs1": crs1,
            "crs2": crs2,
            "compatible": True,
            "source_is_geographic": source.is_geographic,
            "target_is_geographic": target.is_geographic,
            "requires_transformation": source != target,
        }
    
    except Exception as exc:
        logger.warning(f"CRS compatibility check failed: {exc}")
        return {
            "success": False,
            "crs1": crs1,
            "crs2": crs2,
            "compatible": False,
            "error": str(exc),
        }
