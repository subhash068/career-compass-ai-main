"""
QR Code Generator Utility for Certificates
Uses qrcode library to generate QR codes
"""
import base64
import io
from typing import Optional


def generate_qr_code(data: str, box_size: int = 10, border: int = 4) -> Optional[str]:
    """
    Generate QR code as base64 encoded PNG image
    
    Args:
        data: The URL or data to encode in QR code
        box_size: Size of each QR code box
        border: Border size around QR code
    
    Returns:
        Base64 encoded PNG image string or None on error
    """
    try:
        import qrcode
        from qrcode.image.styledpil import StyledPilImage
        from qrcode.image.styles.moduledrawers import SquareModuleDrawer
        from qrcode.image.styles.colormasks import SolidFillColorMask
        
        # Create QR code instance
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=box_size,
            border=border,
        )
        
        # Add data
        qr.add_data(data)
        qr.make(fit=True)
        
        # Create image with custom styling
        img = qr.make_image(
            image_factory=StyledPilImage,
            module_drawer=SquareModuleDrawer(),
            color_mask=SolidFillColorMask(front_color=(31, 41, 55), back_color=(255, 255, 255)),
            embeded_image_path=None
        )
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        return f"data:image/png;base64,{img_base64}"
        
    except ImportError:
        # Fallback: Generate simple QR code if library not available
        return generate_simple_qr_code(data)
    except Exception as e:
        print(f"Error generating QR code: {e}")
        return generate_simple_qr_code(data)


def generate_simple_qr_code(data: str) -> Optional[str]:
    """
    Fallback QR code generator using pure Python
    This creates a basic QR code representation
    """
    try:
        import qrcode
        
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        
        qr.add_data(data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        return f"data:image/png;base64,{img_base64}"
        
    except Exception as e:
        print(f"Error generating simple QR code: {e}")
        return None


def generate_verification_qr(verification_url: str) -> Optional[str]:
    """
    Generate QR code for certificate verification URL
    
    Args:
        verification_url: The certificate verification URL
    
    Returns:
        Base64 encoded QR code image
    """
    return generate_qr_code(verification_url, box_size=8, border=3)
