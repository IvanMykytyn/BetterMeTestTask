# BetterMeTestTask

## Project Launch

1. Build the frontend and start the containers:
docker-compose build frontend
docker-compose up

2. Open new terminal window and run database migrations and load tax rates and superuser data:
docker exec -it betterme_backend python manage.py migrate
docker exec -it betterme_backend bash -c "python manage.py loaddata counter/fixtures/*.json"

3. Check running containers:
docker ps

4. Build the frontend for production:
docker exec -it betterme_frontend pnpm build

## Usage

1. Open the frontend in your browser:
http://localhost:5173

2. To access Django Admin and change tax rates or delete records from the OrderTaxRecord table, open in your browser:
http://localhost:8000/admin/

3. To delete all records from the OrderTaxRecord table (more than 10k records) at once, run the command:
docker exec -it betterme_backend python manage.py delete_orders

---

The **BetterMeTestTask** project is a web service for automated calculation of sales tax in the state of New York based on the buyer’s coordinates. It uses geospatial data of counties and cities, allowing accurate determination of the tax jurisdiction and application of the corresponding tax rates. The system supports both bulk processing of CSV transaction files and manual input, ensuring calculation accuracy and transparency for accounting and auditing. 

The project was developed by the **ColDev** team under the web direction for the All-Ukrainian hackathon **INT20H – 2026**.  

You can access the project here: [BetterMeTestTask](https://bettermetesttask-3.onrender.com)

---

## Scenario Overview

**Instant Wellness Kits** is a successful service for urgent delivery of compact wellness kits. The main unique advantage of the business is the ultra-fast delivery of products to the buyer using drones. Delivery is completed within 20–30 minutes across the state of New York.

The mobile application works as follows:

1. The user selects the product and places an order.
2. GPS obtains the delivery coordinates.
3. The drone delivers the package.

**Problem:** The user sales tax was not accounted for at checkout.  
**Impact:** A large number (11k+) of already paid orders by customers were missing tax calculations.

---

## Business Problem Details

According to New York state law, **sales tax** is paid by the buyer when purchasing certain categories of goods and services, and the seller is obligated to calculate, collect, and remit this tax to the government.

In the U.S., there is no single user tax rate; each state sets its own rate at multiple levels:

- **State sales tax** – applied at the state level.
- **Local sales tax** – applied at the county/city level.

In New York, an additional tax applies to certain cities and counties, which must be paid to the **Metropolitan Commuter Transportation District (MCTD)**.

The team collected information from official government sources, specifically the **New York State Department of Taxation and Finance**, to determine the applicable tax rates for the state, counties, specific cities, and the MCTD.  

Official document reference: [Sales Tax Publication 718c](https://www.tax.ny.gov/pdf/publications/sales/pub718c.pdf)  

This document provides combined state and local tax rates along with reporting codes used in sales tax filings.  

The problem is particularly critical for **high transaction volumes**, as even minor errors in rates can result in significant financial losses.  

**Solution:** Automated calculation based on precise tax jurisdiction determination reduces human error and minimizes the risk of systemic mistakes.

---

## Technical Solutions and Project Conditions

The system must accept:

- Latitude
- Longitude
- Purchase amount (subtotal)

Based on this data, the system must:

- Determine the tax jurisdiction
- Calculate the tax rate
- Compute the tax amount

**Solution Logic:**

1. Determine tax jurisdiction using geospatial data (state, county, city).
2. Calculate the tax rate for each jurisdiction.

Geospatial data in **shapefile format** was obtained from official U.S. government sources, specifically agencies providing territorial boundaries (TIGER/Line).

### Additional Considerations:

- If a city cannot be determined for an order, the coordinates lie outside defined city boundaries. In such cases, base rates apply: **New York state tax + relevant county tax**, special city surcharges are not applied.
- **Why shapefiles:**  
  - Official source: boundaries of counties and municipalities in formalized format.  
  - Geometric precision: polygons allow accurate coordinate assignment.  
  - Spatial operations: point-in-polygon checks ensure correct jurisdiction.  
  - Polygon boundaries account for discrepancies with ZIP codes or administrative expectations.

### Assumptions:

- All coordinates belong to **New York state**; other states are outside the current project scope.
- Tax rates as of **March 1, 2025**, are assumed constant during the test period (CSV transactions dated 04.11.2025 – 22.02.2026). In practice, effective dates and historical rates should be supported.

---

## CSV Processing Flow

1. User (admin/operator) uploads a CSV file via the web interface.
2. Preliminary validation checks:
   - File can be read via `pandas.read_csv`.
   - Required columns: `timestamp`, `latitude`, `longitude`, `subtotal`.
   - No empty values in critical columns.
   - Timestamp format conforms to ISO 8601.
   - Numeric columns contain only numbers.
3. If validation fails, a list of errors is returned; otherwise, processing continues.
4. CSV data is read into a DataFrame, timestamps are converted to `datetime`.
5. Tax rates for state, counties, cities, and special districts are loaded into dictionaries to optimize performance for **10,000+ records**.
6. **Jurisdiction determination:** For each row:
   - Create `Point(lon, lat)`.
   - Use `STRtree` to find candidate polygons for counties and cities. To determine which polygon contains a given point, a spatial index (STRtree) is used instead of checking all polygons. This significantly speeds up processing, reducing the search complexity from O(n) to approximately O(log n).
   - Point-in-polygon check assigns each transaction its jurisdiction.
7. `create_order_object` generates an `OrderTaxRecord` instance with the appropriate rates (`state_rate`, `county_rate`, `city_rate`, `special_rates`).
8. Calculation of `composite_tax_rate`, `tax_amount`, and `total_amount` is performed directly in model methods.
9. All objects are collected and inserted via `bulk_create()` for efficiency.

**Summary Flow:**  
`Upload → Validation → Parsing → Geo-determination → Object creation → bulk_create → View`

---

## Manual Input Flow

1. User enters `timestamp`, `latitude`, `longitude`, `subtotal` via a form.
2. Timestamp is converted to `datetime`.
3. Tax rates for state, county, city, and special districts are loaded.
4. Jurisdiction is determined using the same `find_county` and `find_city` functions.
5. An `OrderTaxRecord` object is created and saved to the database.

**Summary Flow:**  
`Form → Conversion → Geo-determination → Object creation → save() → Display`

---

## Viewing Processed Results

- All records are stored in the `OrderTaxRecord` table.
- Opening the view page queries the database and returns the queryset.
- Data is displayed in a table for review and audit purposes.

**Summary:**  
`Queryset → Table list → Details → Audit`

---

## Architectural Advantages

1. Single `create_order_object` function for both CSV and manual input, avoiding logic duplication, ensuring consistent calculation, and simplifying maintenance and scaling.
2. Tax and total calculations performed in model methods, ensuring accuracy regardless of input method.
3. Composite tax rate stored with precision up to **5 decimal places** (e.g., 0.08725), critical for accounting and tax reporting, avoiding rounding errors in large-scale calculations.

---

## Geolocation Test Results

During testing, we processed 11,222 records containing coordinates and subtotals. Our goal was to determine the corresponding state, county, and city for each record using the shapefiles for New York State counties and cities.

**The results showed that:**

- The **county could not be determined** for **136 records** (~1.21%).

- The **city could not be determined** for **1822** records.

The unmatched cases are primarily due to:

1. Boundary issues: Some coordinates fall exactly on the edge of polygons, and depending on the method used (contains vs intersects), they may not be counted as inside the polygon.

2. Coordinate precision: Minor deviations in the provided coordinates can prevent exact polygon matching.

3. Data limitations: The shapefiles only cover New York State, so any point outside the state would naturally remain unmatched.

Overall, the vast majority of records were successfully mapped, and the small percentage of unmatched points is expected in geospatial processing.

---