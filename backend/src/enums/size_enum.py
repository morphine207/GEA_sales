from enum import Enum

class SizeEnum(str, Enum):
    ORIGINAL = "original"
    MEDIUM = "medium"
    SMALL = "small"


SCALE_VECTOR = {
    SizeEnum.ORIGINAL: 1,
    SizeEnum.MEDIUM: 0.4,
    SizeEnum.SMALL: 0.1
}