from dataclasses import dataclass, asdict
from typing import Any, List, Dict
import json

@dataclass
class TCO:
    """
    Minimal TCO container for a single machine.
    - monthly_cum_total: cumulative total cost per month, starting at month 0.
    - ca, cc, co, cm: final cumulative values of the cost factors.
    """
    label: str
    monthly_cum_total: List[float]      # must include month 0 element
    ca: float                           # acquisition
    cc: float                           # commissioning
    co: float                           # operating
    cm: float                           # maintenance/services

    @property
    def total(self) -> float:
        """Final cumulative total (last element of monthly_cum_total)."""
        return self.monthly_cum_total[-1] if self.monthly_cum_total else 0.0

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    def to_json(self, **kwargs) -> str:
        return json.dumps(self.to_dict(), **({"ensure_ascii": False, "indent": 2} | kwargs))
