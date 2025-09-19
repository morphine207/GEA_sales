from typing import List


def convert_to_absolute_bboxes(bboxes: List[List[int]], chunk_size: int, width: int, height: int):
    """
        we have array of bounding boxes that are part of segments and their values are set relative to the current image.
        we want to set it to relative to what every the full width and height of the image is based on the size of this current image which will come from the chunk size.
    """
    x_chunks = (width + chunk_size - 1) // chunk_size
    y_chunks = (height + chunk_size - 1) // chunk_size
    absolute_bboxes = []
    for i in range(x_chunks):
        for j in range(y_chunks):
            absolute_bboxes.append(
                get_absolute_bbox(bboxes[i][j], chunk_size, i, j)
            )

    return absolute_bboxes


def get_absolute_bbox(bbox: List[int], chunk_size: int, row: int, col: int):
    offsetX = row * chunk_size
    offsetY = col * chunk_size

    x, y, _x, _y = bbox
    return [offsetX + x, offsetY + y, offsetX + _x, offsetY + _y]