import os
from PIL import Image

def save_tiff_to_image_files(upload_path: str, input_file_name: str, output_file_name: str, save_format: str):
    """
        Read each and every page from tiff file and convert it into a png image.
        A tiff file might have multiple images. The function will take all image pages from the tiff file 
    """
    output_file_names = []
    document_page_numbers = []
    Image.MAX_IMAGE_PIXELS = None
    with Image.open(f"{upload_path}/{input_file_name}") as tif_image:
        for i in range(tif_image.n_frames):
            tif_image.seek(i)

            image = tif_image.convert('L')

            scale_factor = 0.3  # try 0.3 to 0.6 depending on quality
            new_size = (int(image.width * scale_factor), int(image.height * scale_factor))

            img_resized = image.resize(new_size, Image.LANCZOS)

            new_output_file_name = f"{output_file_name}_{i}.{save_format}"
            output_path = f"{upload_path}/{new_output_file_name}"
            img_resized.save(output_path, format=save_format, compress_level=6, optimize=True)

            output_file_names.append(new_output_file_name)
            document_page_numbers.append(i)

    return output_file_names, document_page_numbers