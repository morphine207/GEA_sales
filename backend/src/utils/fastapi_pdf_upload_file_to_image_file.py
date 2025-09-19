import fitz
from fitz import Matrix

def fastapi_pdf_upload_file_to_image_file(pdf_data, output_path, matrix: Matrix = fitz.Matrix(1.5, 1.5)):
    """
        read the pdf file, convert it into an image, save the image in a png format.  
    """
    doc = fitz.open(stream=pdf_data, filetype="pdf")  
    page = doc.load_page(0)
    pix = page.get_pixmap(matrix=matrix)  
    pix.save(output_path)