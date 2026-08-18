from datetime import date, datetime
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Session

from .database import Base, engine, get_db


# ============================================================
# DATABASE MODELS
# ============================================================


class CustomerLead(Base):
    __tablename__ = "customer_leads"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=True)
    email = Column(String(150), nullable=True)

    budget = Column(Numeric(15, 2), nullable=True)

    interested_society = Column(String(150), nullable=True)

    interested_plot_id = Column(
        Integer,
        ForeignKey("plots.id"),
        nullable=True
    )

    status = Column(
        String(50),
        default="New"
    )

    follow_up_date = Column(
        Date,
        nullable=True
    )

    notes = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )


class PropertyDocument(Base):
    __tablename__ = "property_documents"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    plot_id = Column(
        Integer,
        ForeignKey("plots.id"),
        nullable=False
    )

    title = Column(
        String(200),
        nullable=False
    )

    document_type = Column(
        String(100),
        default="Other"
    )

    filename = Column(
        String(255),
        nullable=False
    )

    stored_filename = Column(
        String(255),
        nullable=False
    )

    file_path = Column(
        Text,
        nullable=False
    )

    mime_type = Column(
        String(150),
        nullable=True
    )

    uploaded_at = Column(
        DateTime,
        default=datetime.utcnow
    )


# ============================================================
# CREATE NEW TABLES
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/business",
    tags=["Business Modules"]
)


# ============================================================
# SCHEMAS
# ============================================================


# ------------------------------------------------------------
# CONSTRUCTION COST
# ------------------------------------------------------------

class ConstructionRequest(BaseModel):
    plot_size_sqft: float = Field(
        gt=0
    )

    covered_area_sqft: float = Field(
        gt=0
    )

    land_cost: float = Field(
        default=0,
        ge=0
    )

    construction_quality: str = "Standard"

    construction_rate_per_sqft: float | None = Field(
        default=None,
        ge=0
    )

    contingency_percentage: float = Field(
        default=10,
        ge=0,
        le=50
    )


class ConstructionResponse(BaseModel):
    plot_size_sqft: float

    covered_area_sqft: float

    construction_quality: str

    construction_rate_per_sqft: float

    construction_cost: float

    land_cost: float

    contingency_cost: float

    total_project_cost: float

    cost_per_plot_sqft: float


# ------------------------------------------------------------
# CRM - CREATE
# ------------------------------------------------------------

class LeadCreate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=150
    )

    phone: str | None = None

    email: str | None = None

    budget: float | None = Field(
        default=None,
        ge=0
    )

    interested_society: str | None = None

    interested_plot_id: int | None = Field(
        default=None,
        gt=0
    )

    status: str = "New"

    follow_up_date: str | None = None

    notes: str | None = None


# ------------------------------------------------------------
# CRM - UPDATE
# ------------------------------------------------------------

class LeadUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=150
    )

    phone: str | None = None

    email: str | None = None

    budget: float | None = Field(
        default=None,
        ge=0
    )

    interested_society: str | None = None

    interested_plot_id: int | None = Field(
        default=None,
        gt=0
    )

    status: str | None = None

    follow_up_date: str | None = None

    notes: str | None = None


# ------------------------------------------------------------
# CRM - RESPONSE
#
# FIX:
# follow_up_date is a SQLAlchemy Date column.
# Therefore Pydantic should expect a Python date,
# not a string.
# ------------------------------------------------------------

class LeadResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int

    name: str

    phone: str | None = None

    email: str | None = None

    budget: float | None = None

    interested_society: str | None = None

    interested_plot_id: int | None = None

    status: str

    follow_up_date: date | None = None

    notes: str | None = None

    created_at: datetime | None = None

    updated_at: datetime | None = None


# ------------------------------------------------------------
# DOCUMENT RESPONSE
# ------------------------------------------------------------

class DocumentResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int

    plot_id: int

    title: str

    document_type: str

    filename: str

    mime_type: str | None = None

    uploaded_at: datetime | None = None


# ============================================================
# CONSTRUCTION COST CALCULATOR
# ============================================================


CONSTRUCTION_RATES = {
    "Economy": 3500,
    "Standard": 4500,
    "Premium": 6000,
    "Luxury": 8000,
}


@router.post(
    "/construction/calculate",
    response_model=ConstructionResponse
)
def calculate_construction_cost(
    request: ConstructionRequest
):

    quality = request.construction_quality.strip()

    if not quality:
        quality = "Standard"

    if request.construction_rate_per_sqft is not None:

        rate = float(
            request.construction_rate_per_sqft
        )

    else:

        rate = float(
            CONSTRUCTION_RATES.get(
                quality,
                CONSTRUCTION_RATES["Standard"]
            )
        )

    construction_cost = (
        request.covered_area_sqft
        * rate
    )

    contingency_cost = (
        construction_cost
        * request.contingency_percentage
        / 100
    )

    total_project_cost = (
        request.land_cost
        + construction_cost
        + contingency_cost
    )

    cost_per_plot_sqft = (
        total_project_cost
        / request.plot_size_sqft
    )

    return ConstructionResponse(
        plot_size_sqft=request.plot_size_sqft,

        covered_area_sqft=request.covered_area_sqft,

        construction_quality=quality,

        construction_rate_per_sqft=round(
            rate,
            2
        ),

        construction_cost=round(
            construction_cost,
            2
        ),

        land_cost=round(
            request.land_cost,
            2
        ),

        contingency_cost=round(
            contingency_cost,
            2
        ),

        total_project_cost=round(
            total_project_cost,
            2
        ),

        cost_per_plot_sqft=round(
            cost_per_plot_sqft,
            2
        )
    )


# ============================================================
# HELPER - GET PLOT
# ============================================================


def get_plot_or_404(
    plot_id: int,
    db: Session
):

    from .models import Plot

    plot = (
        db.query(Plot)
        .filter(
            Plot.id == plot_id
        )
        .first()
    )

    if not plot:

        raise HTTPException(
            status_code=404,
            detail="Property not found"
        )

    return plot


# ============================================================
# HELPER - PARSE DATE
# ============================================================


def parse_follow_up_date(
    value: str | None
):

    if value is None:
        return None

    try:

        return datetime.strptime(
            value,
            "%Y-%m-%d"
        ).date()

    except ValueError:

        raise HTTPException(
            status_code=400,
            detail=(
                "follow_up_date must use "
                "YYYY-MM-DD"
            )
        )


# ============================================================
# CRM - CREATE LEAD
# ============================================================


@router.post(
    "/crm/leads",
    response_model=LeadResponse,
    status_code=201
)
def create_lead(
    lead_data: LeadCreate,
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # Validate interested plot
    # --------------------------------------------------------

    if lead_data.interested_plot_id is not None:

        get_plot_or_404(
            lead_data.interested_plot_id,
            db
        )

    # --------------------------------------------------------
    # Parse follow-up date
    # --------------------------------------------------------

    follow_up_date = parse_follow_up_date(
        lead_data.follow_up_date
    )

    # --------------------------------------------------------
    # Create lead
    # --------------------------------------------------------

    lead = CustomerLead(
        name=lead_data.name.strip(),

        phone=lead_data.phone,

        email=lead_data.email,

        budget=lead_data.budget,

        interested_society=lead_data.interested_society,

        interested_plot_id=lead_data.interested_plot_id,

        status=lead_data.status,

        follow_up_date=follow_up_date,

        notes=lead_data.notes
    )

    db.add(lead)

    db.commit()

    db.refresh(lead)

    return lead


# ============================================================
# CRM - GET LEADS
# ============================================================


@router.get(
    "/crm/leads",
    response_model=list[LeadResponse]
)
def get_leads(
    db: Session = Depends(get_db)
):

    leads = (
        db.query(CustomerLead)
        .order_by(
            CustomerLead.created_at.desc()
        )
        .all()
    )

    return leads


# ============================================================
# CRM - GET SINGLE LEAD
# ============================================================


@router.get(
    "/crm/leads/{lead_id}",
    response_model=LeadResponse
)
def get_lead(
    lead_id: int,
    db: Session = Depends(get_db)
):

    lead = (
        db.query(CustomerLead)
        .filter(
            CustomerLead.id == lead_id
        )
        .first()
    )

    if not lead:

        raise HTTPException(
            status_code=404,
            detail="Lead not found"
        )

    return lead


# ============================================================
# CRM - UPDATE LEAD
# ============================================================


@router.put(
    "/crm/leads/{lead_id}",
    response_model=LeadResponse
)
def update_lead(
    lead_id: int,
    lead_data: LeadUpdate,
    db: Session = Depends(get_db)
):

    lead = (
        db.query(CustomerLead)
        .filter(
            CustomerLead.id == lead_id
        )
        .first()
    )

    if not lead:

        raise HTTPException(
            status_code=404,
            detail="Lead not found"
        )

    data = lead_data.model_dump(
        exclude_unset=True
    )

    # --------------------------------------------------------
    # Handle plot separately
    # --------------------------------------------------------

    if "interested_plot_id" in data:

        plot_id = data["interested_plot_id"]

        if plot_id is not None:

            get_plot_or_404(
                plot_id,
                db
            )

    # --------------------------------------------------------
    # Handle follow-up date
    # --------------------------------------------------------

    if "follow_up_date" in data:

        follow_up_date = data.pop(
            "follow_up_date"
        )

        if follow_up_date is None:

            # Allow clearing the date
            lead.follow_up_date = None

        else:

            lead.follow_up_date = (
                parse_follow_up_date(
                    follow_up_date
                )
            )

    # --------------------------------------------------------
    # Update remaining fields
    # --------------------------------------------------------

    for field, value in data.items():

        if field == "name" and value is not None:

            value = value.strip()

        setattr(
            lead,
            field,
            value
        )

    db.commit()

    db.refresh(lead)

    return lead


# ============================================================
# CRM - DELETE LEAD
# ============================================================


@router.delete(
    "/crm/leads/{lead_id}"
)
def delete_lead(
    lead_id: int,
    db: Session = Depends(get_db)
):

    lead = (
        db.query(CustomerLead)
        .filter(
            CustomerLead.id == lead_id
        )
        .first()
    )

    if not lead:

        raise HTTPException(
            status_code=404,
            detail="Lead not found"
        )

    db.delete(lead)

    db.commit()

    return {
        "message": "Lead deleted successfully"
    }


# ============================================================
# DOCUMENT MANAGEMENT
# ============================================================


ALLOWED_DOCUMENT_TYPES = {
    ".pdf",
    ".doc",
    ".docx",
    ".jpg",
    ".jpeg",
    ".png"
}


DOCUMENT_FOLDER = (
    Path(__file__).resolve().parent.parent
    / "uploads"
    / "documents"
)


DOCUMENT_FOLDER.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# UPLOAD DOCUMENT
# ============================================================


@router.post(
    "/plots/{plot_id}/documents",
    response_model=DocumentResponse,
    status_code=201
)
async def upload_document(
    plot_id: int,

    title: str = Form(...),

    document_type: str = Form(
        "Other"
    ),

    file: UploadFile = File(...),

    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # Validate property
    # --------------------------------------------------------

    get_plot_or_404(
        plot_id,
        db
    )

    # --------------------------------------------------------
    # Validate title
    # --------------------------------------------------------

    title = title.strip()

    if not title:

        raise HTTPException(
            status_code=400,
            detail="Document title is required"
        )

    # --------------------------------------------------------
    # Original filename
    # --------------------------------------------------------

    original_name = (
        file.filename
        or "document"
    )

    # --------------------------------------------------------
    # File extension
    # --------------------------------------------------------

    extension = (
        Path(original_name)
        .suffix
        .lower()
    )

    if extension not in ALLOWED_DOCUMENT_TYPES:

        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported document type. "
                "Allowed: PDF, DOC, DOCX, JPG, JPEG, PNG."
            )
        )

    # --------------------------------------------------------
    # Generate safe unique filename
    # --------------------------------------------------------

    unique_name = (
        f"{uuid4().hex}{extension}"
    )

    file_path = (
        DOCUMENT_FOLDER
        / unique_name
    )

    try:

        content = await file.read()

        file_path.write_bytes(
            content
        )

        document = PropertyDocument(
            plot_id=plot_id,

            title=title,

            document_type=document_type,

            filename=original_name,

            stored_filename=unique_name,

            file_path=str(file_path),

            mime_type=file.content_type
        )

        db.add(document)

        db.commit()

        db.refresh(document)

        return document

    except Exception:

        db.rollback()

        if file_path.exists():

            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail="Failed to upload document"
        )

    finally:

        await file.close()


# ============================================================
# GET PROPERTY DOCUMENTS
# ============================================================


@router.get(
    "/plots/{plot_id}/documents",
    response_model=list[DocumentResponse]
)
def get_property_documents(
    plot_id: int,
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # Make sure property exists
    # --------------------------------------------------------

    get_plot_or_404(
        plot_id,
        db
    )

    documents = (
        db.query(PropertyDocument)
        .filter(
            PropertyDocument.plot_id == plot_id
        )
        .order_by(
            PropertyDocument.uploaded_at.desc()
        )
        .all()
    )

    return documents


# ============================================================
# DOWNLOAD DOCUMENT
# ============================================================


@router.get(
    "/documents/{document_id}/download"
)
def download_document(
    document_id: int,
    db: Session = Depends(get_db)
):

    document = (
        db.query(PropertyDocument)
        .filter(
            PropertyDocument.id == document_id
        )
        .first()
    )

    if not document:

        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    file_path = Path(
        document.file_path
    )

    if not file_path.exists():

        raise HTTPException(
            status_code=404,
            detail="Document file is missing"
        )

    return FileResponse(
        path=file_path,

        filename=document.filename,

        media_type=(
            document.mime_type
            or "application/octet-stream"
        )
    )


# ============================================================
# DELETE DOCUMENT
# ============================================================


@router.delete(
    "/documents/{document_id}"
)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db)
):

    document = (
        db.query(PropertyDocument)
        .filter(
            PropertyDocument.id == document_id
        )
        .first()
    )

    if not document:

        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    file_path = Path(
        document.file_path
    )

    try:

        if file_path.exists():

            file_path.unlink()

        db.delete(document)

        db.commit()

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to delete document"
        )

    return {
        "message": "Document deleted successfully"
    }


# ============================================================
# BUSINESS MODULE SUMMARY
# ============================================================


@router.get(
    "/summary"
)
def business_modules_summary(
    db: Session = Depends(get_db)
):

    return {

        "construction_cost_calculator": True,

        "crm": {
            "enabled": True,

            "total_leads": (
                db.query(
                    CustomerLead
                ).count()
            )
        },

        "document_management": {

            "enabled": True,

            "total_documents": (
                db.query(
                    PropertyDocument
                ).count()
            )
        }
    }