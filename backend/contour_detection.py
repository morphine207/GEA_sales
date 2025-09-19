import numpy as np
import cv2
import fitz
from typing import List
from PIL import ImageFile, Image
import os
import json
import matplotlib.pyplot as plt
from shapely.geometry import LineString

file_path = ""
image_file_name = ""
test_image_path = ""
folder_path = "./public/segments"
chunk_size = 3000


def pdf_to_image_file(file_path, output_path):
    """
        read the pdf file, convert it into an image, save the image in a png format.  
    """
    doc = fitz.open(file_path)
    page = doc.load_page(0)
    pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5))  
    pix.save(output_path)

def create_image_segments(image: ImageFile):
    """
        Generates 2d image segments for a given image with defined chuck size.
    """
    width, height = image.size
    chunk_size = 3000
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

def save_image_chunks(image_segments, save_dir):
    """
        Save the image chunks in a specified folder.
    """
    for i, row in enumerate(image_segments):
        for j, col_image in enumerate(row):
            col_image.save(f"./{save_dir}/image_{i}_{j}.png")

def get_line_segments(image_path):
    gray = cv2.cvtColor(cv2.imread(image_path), cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    lines = cv2.HoughLinesP(edges, rho=1, theta=np.pi/180, threshold=100, minLineLength=50, maxLineGap=10)
    return lines

def write_cv_image(line_segments, output_path , width, height):
    display_image = np.ones((height, width, 3), dtype=np.uint8) * 255
    if line_segments is not None:
        for line in line_segments:
            x1, y1, x2, y2 = line[0]
            cv2.line(display_image, (x1, y1), (x2, y2), (0, 0, 0), 2)
    cv2.imwrite(output_path, display_image)

def get_bounding_box(polygon_data):
    """
        Get bounding box coordinates from datastructure provided by the json
    """
    polygon_points = [(polygon_data[i], polygon_data[i + 1]) for i in range(0, len(polygon_data), 2)]

    all_x = [point[0] for point in polygon_points]
    all_y = [point[1] for point in polygon_points]

    return [min(all_x), min(all_y), max(all_x), max(all_y)]

def convert_to_2dim(index, m):
    """
        convert a single dimension array to 2-dimensions.
    """
    return (index // m, index % m)

def get_bounding_boxes_from_json_files(folder_path):
    json_data_arr = []
    # load the json data and append it in an array
    for filename in os.listdir(folder_path):
        if filename.endswith(".json"):
            file_path = os.path.join(folder_path, filename)
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                json_data_arr.append(data)

    # append bounding box result in an array.
    json_bboxes = []
    for json_data in json_data_arr:
        bboxes = []
        for page in json_data["analyzeResult"]['pages']:
            for word in page['words']:
                bboxes.append(get_bounding_box(word['polygon']))

        json_bboxes.append(bboxes)

    return json_bboxes

def plot_bboxes_on_image(image, bboxes):
    plt.figure(figsize=(10, 8), dpi=500)
    plt.imshow(image)
    ax = plt.gca()

    # displaying only the first example since the first example image is displayed right here.
    for bbox in bboxes:
        x1, y1, x2, y2 = bbox

        width = x2 - x1
        height = y2 - y1

        rect = plt.Rectangle((x1, y1), width, height, fill=False, color="red", linewidth=0.2)
        ax.add_patch(rect)

    plt.axis('off')
    plt.show()

def get_absolute_bboxes():
    x_chunks = (full_image_width + chunk_size - 1) // chunk_size
    y_chunks = (full_image_height + chunk_size - 1) // chunk_size
    absolute_bboxes = []
    for i in range(x_chunks):
        for j in range(y_chunks):
            offsetX = i * chunk_size
            offsetY = j * chunk_size

            # convert 2d to one dimension.
            bboxes = json_bboxes[i * y_chunks + j]
            for bbox in bboxes:
                x, y, _x, _y = bbox
                absolute_bboxes.append([offsetX + x, offsetY + y, offsetX + _x, offsetY + _y])

    return absolute_bboxes

def clear_highlighted_bboxes(bboxes, image_file_path, output_path):
    """
        Whiten the areas that are detected by OCR.
    """
    image_cv2 = cv2.imread(image_file_path)
    hist = cv2.calcHist([image_cv2], [0], None, [256], [0, 256])
    background_value = int(np.argmax(hist))

    if(len(bboxes) == 0):
        return

    for bb in bboxes:
        topX, topY, bottomX, bottomY = bb
        points = np.array([[bottomX, topY],
                            [bottomX, bottomY],
                            [topX, bottomY],
                            [topX, topY]],
                            np.int32)
        cv2.fillPoly(image_cv2, [points], (background_value, background_value, background_value))

    # show it in image.
    cv2.imwrite(output_path, image_cv2)

def normalize_line(line_coords):
    x1, y1, x2, y2 = line_coords
    p1 = (x1, y1)
    p2 = (x2, y2)
    if p1 <= p2:
        return LineString([p1, p2])
    else:
        return LineString([p2, p1])

# get an image from pdf
pdf_to_image_file(file_path, image_file_name)

image = Image.open(
    image_file_name
)
full_image_width, full_image_height = image.size


image_segments = create_image_segments(
    image
)
save_image_chunks(
     image_segments,
     "./public/segments"
)

line_segments = get_line_segments(test_image_path)
write_cv_image(line_segments, 'test_image_segments_line_segments.jpg', chunk_size, chunk_size)

json_bboxes = get_bounding_boxes_from_json_files(folder_path)

absolute_bboxes = get_absolute_bboxes()

plot_bboxes_on_image(image=image, bboxes=absolute_bboxes)