"""
Geometry validation service for Aereo GeoMeasure.

Provides topology validation, self-intersection detection, and geometry quality checks.
"""

from typing import Any

from shapely.geometry import shape
from shapely.validation import explain_validity

from app.logging_config import get_logger
from app.schemas.files import FeatureResponse

logger = get_logger(__name__)


class ValidationIssue:
    """Represents a single geometry validation issue."""

    def __init__(
        self,
        feature_id: str,
        geometry_type: str,
        issue_type: str,
        severity: str,
        message: str,
    ):
        self.feature_id = feature_id
        self.geometry_type = geometry_type
        self.issue_type = issue_type
        self.severity = severity  # "error", "warning", "info"
        self.message = message

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "feature_id": self.feature_id,
            "geometry_type": self.geometry_type,
            "issue_type": self.issue_type,
            "severity": self.severity,
            "message": self.message,
        }


class ValidationResult:
    """Result of geometry validation for a feature."""

    def __init__(self, feature_id: str):
        self.feature_id = feature_id
        self.issues: list[ValidationIssue] = []
        self.is_valid = True

    def add_issue(
        self,
        issue_type: str,
        severity: str,
        message: str,
        geometry_type: str = "Unknown",
    ) -> None:
        """Add a validation issue."""
        issue = ValidationIssue(
            feature_id=self.feature_id,
            geometry_type=geometry_type,
            issue_type=issue_type,
            severity=severity,
            message=message,
        )
        self.issues.append(issue)
        if severity == "error":
            self.is_valid = False

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "feature_id": self.feature_id,
            "is_valid": self.is_valid,
            "issue_count": len(self.issues),
            "issues": [issue.to_dict() for issue in self.issues],
        }


def validate_geometry(feature: FeatureResponse) -> ValidationResult:
    """
    Validate a single geometry feature.

    Checks for:
    - Empty geometries
    - Invalid geometries (self-intersections, bowtie polygons, etc.)
    - Degenerate geometries (zero-length lines, zero-area polygons)
    - Coordinate validity

    Args:
        feature: FeatureResponse to validate

    Returns:
        ValidationResult with any issues found
    """
    result = ValidationResult(feature.feature_id)

    try:
        geometry = shape(feature.geometry)
    except Exception as exc:
        logger.warning(f"Feature {feature.feature_id}: malformed geometry - {exc}")
        result.add_issue(
            issue_type="malformed",
            severity="error",
            message=f"Geometry is malformed: {str(exc)}",
            geometry_type=feature.geometry_type,
        )
        return result

    # Check for empty geometry
    if geometry.is_empty:
        logger.warning(f"Feature {feature.feature_id}: empty geometry")
        result.add_issue(
            issue_type="empty",
            severity="error",
            message="Geometry is empty",
            geometry_type=feature.geometry_type,
        )
        return result

    # Check for invalid geometry
    if not geometry.is_valid:
        validity_msg = explain_validity(geometry)
        logger.warning(f"Feature {feature.feature_id}: invalid geometry - {validity_msg}")
        result.add_issue(
            issue_type="invalid",
            severity="error",
            message=f"Geometry is invalid: {validity_msg}",
            geometry_type=feature.geometry_type,
        )

    # Check for degenerate geometries
    if feature.geometry_type == "LineString":
        if geometry.length == 0:
            logger.warning(f"Feature {feature.feature_id}: zero-length line")
            result.add_issue(
                issue_type="degenerate",
                severity="warning",
                message="LineString has zero length",
                geometry_type=feature.geometry_type,
            )

    elif feature.geometry_type == "Polygon":
        if geometry.area == 0:
            logger.warning(f"Feature {feature.feature_id}: zero-area polygon")
            result.add_issue(
                issue_type="degenerate",
                severity="warning",
                message="Polygon has zero area",
                geometry_type=feature.geometry_type,
            )

        # Check for excessive holes
        if hasattr(geometry, "interiors"):
            hole_count = len(list(geometry.interiors))
            if hole_count > 100:
                logger.warning(f"Feature {feature.feature_id}: excessive holes ({hole_count})")
                result.add_issue(
                    issue_type="complexity",
                    severity="warning",
                    message=f"Polygon has {hole_count} holes (excessive)",
                    geometry_type=feature.geometry_type,
                )

    # Check coordinate count
    coords = list(geometry.coords)
    if len(coords) > 100000:
        logger.warning(f"Feature {feature.feature_id}: excessive coordinates ({len(coords)})")
        result.add_issue(
            issue_type="complexity",
            severity="warning",
            message=f"Geometry has {len(coords)} coordinates (excessive)",
            geometry_type=feature.geometry_type,
        )

    return result


def validate_features(features: list[FeatureResponse]) -> list[ValidationResult]:
    """
    Validate multiple features.

    Args:
        features: List of features to validate

    Returns:
        List of ValidationResult objects
    """
    logger.info(f"Validating {len(features)} features")
    results = [validate_geometry(feature) for feature in features]

    invalid_count = sum(1 for r in results if not r.is_valid)
    if invalid_count > 0:
        logger.warning(f"Validation complete: {invalid_count}/{len(features)} features have issues")
    else:
        logger.info(f"Validation complete: all {len(features)} features are valid")

    return results


def get_validation_summary(results: list[ValidationResult]) -> dict[str, Any]:
    """
    Get a summary of validation results.

    Args:
        results: List of ValidationResult objects

    Returns:
        Dictionary with summary statistics
    """
    total_features = len(results)
    valid_features = sum(1 for r in results if r.is_valid)
    invalid_features = total_features - valid_features

    issue_counts: dict[str, int] = {}
    severity_counts: dict[str, int] = {}

    for result in results:
        for issue in result.issues:
            issue_counts[issue.issue_type] = issue_counts.get(issue.issue_type, 0) + 1
            severity_counts[issue.severity] = severity_counts.get(issue.severity, 0) + 1

    return {
        "total_features": total_features,
        "valid_features": valid_features,
        "invalid_features": invalid_features,
        "validity_percentage": (valid_features / total_features * 100) if total_features > 0 else 0,
        "issue_types": issue_counts,
        "severity_breakdown": severity_counts,
    }
