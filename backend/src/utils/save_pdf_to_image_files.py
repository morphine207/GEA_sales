import fitz
from fitz import Matrix

def save_pdf_to_image_files(upload_path: str, input_file_name: str, output_file_name: str, save_format: str):
    """
        convert every page of pdf file to a png image.
    """
    doc = fitz.open(f"{upload_path}/{input_file_name}")
    output_file_names: list[str] = []
    document_page_numbers = []

    w0 = 0.00384811
    w1 = -0.02291423
    w3 = 19.779194990652627

    for i in range(len(doc)):
        page = doc.load_page(i)
        zoom = round(page.rect.width * w0  + page.rect.height * w1  + w3, 2)
        zoom_ = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=zoom_)
        new_output_file_name = f"{output_file_name}_{i}.{save_format}"
        output_path = f"{upload_path}/{new_output_file_name}"
        pix.save(output_path)

        output_file_names.append(new_output_file_name)
        document_page_numbers.append(i)

    return output_file_names, document_page_numbers