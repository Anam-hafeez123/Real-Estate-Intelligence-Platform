from sqlalchemy import Boolean, Column, DateTime, Numeric, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, BIGINT
from geoalchemy2 import Geometry

from .database import Base


class Plot(Base):
    __tablename__ = "plots"

    id = Column(BIGINT, primary_key=True, index=True)

    society = Column(String(150), nullable=False)
    phase = Column(String(100))
    block = Column(String(100))
    plot_number = Column(String(50), nullable=False)

    size_sqft = Column(Numeric(12, 2))
    width_ft = Column(Numeric(10, 2))
    length_ft = Column(Numeric(10, 2))

    facing = Column(String(50))
    is_corner = Column(Boolean, default=False)

    owner_name = Column(String(150))

    demand_price = Column(Numeric(15, 2))
    expected_deal_price = Column(Numeric(15, 2))

    location = Column(
        Geometry("POINT", srid=4326)
    )

    images = Column(ARRAY(Text))
    documents = Column(ARRAY(Text))

    created_at = Column(DateTime)
    updated_at = Column(DateTime)