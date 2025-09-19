from typing import List
from PIL import ImageFile

def create_image_segments(image: ImageFile, chunk_size=3000):
    """
        Generates 2d image segments for a given image with defined chuck size.
    """
    width, height = image.size
    x_chunks = (width + chunk_size - 1) // chunk_size
    y_chunks = (height + chunk_size - 1) // chunk_size

    x_size: List = [None for _ in range(x_chunks)]
    y_size: List = [None for _ in range(y_chunks)]

    chunks_2d_list = [[y for y in y_size] for _ in x_size]

    for i, _ in enumerate(x_size):
        for j, _ in enumerate(y_size):
            left = i * chunk_size
            upper = j * chunk_size
            right = min(left + chunk_size, width)
            lower = min(upper + chunk_size, height)

            image_chunk = image.crop((left, upper, right, lower))

            chunks_2d_list[i][j] = image_chunk

    return chunks_2d_list