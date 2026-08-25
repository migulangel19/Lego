import os
import csv
import shutil
import datetime
import re
import urllib.request
import io
import json
from PIL import Image
from typing import Literal, Optional
from fastapi import FastAPI, HTTPException, status, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, field_validator

CSV_FILE = "legos.csv"
BACKUP_DIR = "backups"
DATE_REGEX = re.compile(r"^\d{4}-\d{2}-\d{2}$")

app = FastAPI(title="Lego Tracker API", version="1.0.0")

# --- Pydantic Validation Models ---
class LegoSet(BaseModel):
    id: str = Field(..., min_length=1, description="Lego Set ID (e.g. 75337)")
    name: str = Field(..., min_length=1, description="Name of the set")
    theme: str = Field(..., min_length=1, description="Primary theme (e.g. Star Wars)")
    subcategory: str = Field(default="", description="Subtheme/Collection")
    purchase_date: Optional[str] = Field(default="", description="Purchase date (YYYY-MM-DD or empty)")
    release_date: str = Field(..., description="Release date (YYYY-MM-DD)")
    retirement_date: str = Field(..., description="Retirement date ('Active' or YYYY-MM-DD)")
    official_url: str = Field(default="", description="Official product URL")
    retail_price: float = Field(default=0.0, ge=0.0, description="MSRP/Retail price in EUR")
    purchase_price: float = Field(default=0.0, ge=0.0, description="Actual price paid in EUR")
    market_price: float = Field(default=0.0, ge=0.0, description="Current market value in EUR")
    extra_costs: float = Field(default=0.0, ge=0.0, description="Shipping/taxes in EUR")
    purchase_store: str = Field(default="", description="Store where purchased")
    purchase_location: str = Field(default="", description="Location or Online")
    condition: Literal[
        'sealed', 'complete_mib', 'complete_loose', 'no_manual',
        'no_box_no_manual', 'no_minifigs', 'incomplete_with_minifigs', 'incomplete_no_minifigs'
    ] = Field(..., description="Condition state of the Lego set")
    goal: Literal['collection', 'investment', 'legacy'] = Field(..., description="Investment vs collection vs legacy goal")
    notes: str = Field(default="", description="Personal notes/comments")
    image_url: str = Field(default="", description="Image URL of the Lego set")

    @field_validator("purchase_date")
    @classmethod
    def validate_purchase_date(cls, v: Optional[str]) -> str:
        if not v or v.strip() == "":
            return ""
        if not DATE_REGEX.match(v.strip()):
            raise ValueError("purchase_date must be in YYYY-MM-DD format")
        return v.strip()

    @field_validator("release_date")
    @classmethod
    def validate_release_date(cls, v: str) -> str:
        if not DATE_REGEX.match(v.strip()):
            raise ValueError("release_date must be in YYYY-MM-DD format")
        return v.strip()

    @field_validator("retirement_date")
    @classmethod
    def validate_retirement_date(cls, v: str) -> str:
        val = v.strip()
        if val == "Active":
            return val
        if not DATE_REGEX.match(val):
            raise ValueError("retirement_date must be 'Active' or in YYYY-MM-DD format")
        return val


# --- CSV Backup & Operation Utilities ---
def create_backup():
    if not os.path.exists(CSV_FILE):
        return
    
    try:
        # Create backups folder if it doesn't exist
        if not os.path.exists(BACKUP_DIR):
            os.makedirs(BACKUP_DIR)
            
        # Create standard file backup
        shutil.copy2(CSV_FILE, f"{CSV_FILE}.bak")
        
        # Create timestamped file backup
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = os.path.join(BACKUP_DIR, f"legos_{timestamp}.csv.bak")
        shutil.copy2(CSV_FILE, backup_file)
        
        # Keep only the last 20 backups
        backups = sorted(
            [os.path.join(BACKUP_DIR, f) for f in os.listdir(BACKUP_DIR) if f.endswith(".csv.bak")],
            key=os.path.getmtime
        )
        while len(backups) > 20:
            os.remove(backups.pop(0))
    except Exception as e:
        print(f"Error creating backups: {e}")


def read_csv() -> list[dict]:
    if not os.path.exists(CSV_FILE):
        # Create empty CSV with headers if it doesn't exist
        headers = [
            "id", "name", "theme", "subcategory", "purchase_date", "release_date",
            "retirement_date", "official_url", "retail_price", "purchase_price",
            "market_price", "extra_costs", "purchase_store", "purchase_location",
            "condition", "goal", "notes", "image_url"
        ]
        with open(CSV_FILE, mode="w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
        return []
    
    records = []
    with open(CSV_FILE, mode="r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                retail_price = float(row.get("retail_price") or 0.0)
            except ValueError:
                retail_price = 0.0
                
            try:
                purchase_price = float(row.get("purchase_price") or 0.0)
            except ValueError:
                purchase_price = 0.0
                
            try:
                market_price = float(row.get("market_price") or 0.0)
            except ValueError:
                market_price = 0.0
                
            try:
                extra_costs = float(row.get("extra_costs") or 0.0)
            except ValueError:
                extra_costs = 0.0

            records.append({
                "id": row.get("id", "").strip(),
                "name": row.get("name", "").strip(),
                "theme": row.get("theme", "").strip(),
                "subcategory": row.get("subcategory", "").strip(),
                "purchase_date": row.get("purchase_date", "").strip(),
                "release_date": row.get("release_date", "").strip(),
                "retirement_date": row.get("retirement_date", "").strip(),
                "official_url": row.get("official_url", "").strip(),
                "retail_price": retail_price,
                "purchase_price": purchase_price,
                "market_price": market_price,
                "extra_costs": extra_costs,
                "purchase_store": row.get("purchase_store", "").strip(),
                "purchase_location": row.get("purchase_location", "").strip(),
                "condition": row.get("condition", "").strip(),
                "goal": row.get("goal", "").strip(),
                "notes": row.get("notes", "").strip(),
                "image_url": row.get("image_url", "").strip(),
            })
    return records


def write_csv(records: list[dict]):
    create_backup()
    headers = [
        "id", "name", "theme", "subcategory", "purchase_date", "release_date",
        "retirement_date", "official_url", "retail_price", "purchase_price",
        "market_price", "extra_costs", "purchase_store", "purchase_location",
        "condition", "goal", "notes", "image_url"
    ]
    with open(CSV_FILE, mode="w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        for rec in records:
            writer.writerow({
                "id": rec["id"],
                "name": rec["name"],
                "theme": rec["theme"],
                "subcategory": rec.get("subcategory") or "",
                "purchase_date": rec.get("purchase_date") or "",
                "release_date": rec.get("release_date") or "",
                "retirement_date": rec.get("retirement_date") or "",
                "official_url": rec.get("official_url") or "",
                "retail_price": rec.get("retail_price", 0.0),
                "purchase_price": rec.get("purchase_price", 0.0),
                "market_price": rec.get("market_price", 0.0),
                "extra_costs": rec.get("extra_costs", 0.0),
                "purchase_store": rec.get("purchase_store") or "",
                "purchase_location": rec.get("purchase_location") or "",
                "condition": rec["condition"],
                "goal": rec["goal"],
                "notes": rec.get("notes") or "",
                "image_url": rec.get("image_url") or ""
            })


# --- On Startup Backup Hook ---
@app.on_event("startup")
def startup_event():
    print("Initializing Lego Tracker API...")
    create_backup()


def process_and_save_image(lego_id: str, image_url: str) -> str:
    """
    Downloads the image, removes the white background to make it transparent,
    and saves it locally as public/images/{lego_id}.png.
    """
    url = image_url.strip()
    
    # If the URL is already a local path, don't download it again
    if url.startswith("images/") or url.startswith("/images/"):
        return url
        
    if not url:
        # Fallback to Brickset image URL format
        url = f"https://images.brickset.com/sets/images/{lego_id}-1.jpg"
        
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            img_data = response.read()
            
        img = Image.open(io.BytesIO(img_data)).convert("RGBA")
        datas = img.getdata()
        newData = []
        for item in datas:
            # If the pixel is close to white (R > 245, G > 245, B > 245), make it transparent
            if item[0] > 245 and item[1] > 245 and item[2] > 245:
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item)
        img.putdata(newData)
        
        os.makedirs("public/images", exist_ok=True)
        dest_path = f"public/images/{lego_id}.png"
        img.save(dest_path, "PNG")
        print(f"Processed image for set {lego_id} and saved to {dest_path}")
        return f"images/{lego_id}.png"
    except Exception as e:
        print(f"Error processing image from {url}: {e}")
        return image_url


# --- Minifigures Cache & Fetching Functions ---
MINIFIGS_CACHE = "minifigs_cache.json"


def get_rebrickable_key() -> str:
    """
    Retrieves the Rebrickable API key from environment variables or a local file.
    """
    # 1. Try environment variable
    key = os.environ.get("REBRICKABLE_API_KEY", "").strip()
    if key:
        return key
    # 2. Try local file
    if os.path.exists("rebrickable_key.txt"):
        try:
            with open("rebrickable_key.txt", "r", encoding="utf-8") as f:
                return f.read().strip()
        except Exception:
            pass
    return ""


def process_minifig_image(code: str, source_url: str) -> str:
    """
    Downloads a minifigure image, removes its white background to make it transparent,
    and saves it locally as public/images/minifigs/{code}.png.
    Returns the local relative URL or falls back to the original source_url on failure.
    """
    if not source_url:
        return ""
        
    dest_path = f"public/images/minifigs/{code}.png"
    local_url = f"images/minifigs/{code}.png"
    
    # If it already exists, no need to process again
    if os.path.exists(dest_path):
        return local_url
        
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        req = urllib.request.Request(source_url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as response:
            img_data = response.read()
            
        img = Image.open(io.BytesIO(img_data)).convert("RGBA")
        datas = img.getdata()
        newData = []
        for item in datas:
            # If the pixel is close to white (R > 240, G > 240, B > 240), make it transparent
            if item[0] > 240 and item[1] > 240 and item[2] > 240:
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item)
        img.putdata(newData)
        
        os.makedirs("public/images/minifigs", exist_ok=True)
        img.save(dest_path, "PNG")
        print(f"Processed minifig image for {code} and saved to {dest_path}")
        return local_url
    except Exception as e:
        print(f"Error processing minifig image from {source_url}: {e}")
        return source_url


def fetch_from_rebrickable(set_id: str, api_key: str) -> list:
    """
    Queries Rebrickable API for set minifigures and downloads/processes their images.
    """
    url = f"https://rebrickable.com/api/v3/lego/sets/{set_id}-1/minifigs/"
    headers = {
        'Authorization': f'key {api_key}',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=10) as response:
        data = json.loads(response.read().decode('utf-8'))
        
    minifigs = []
    results = data.get("results", [])
    for item in results:
        code = item.get("set_num")
        name = item.get("set_name")
        qty = item.get("quantity", 1)
        img_url = item.get("set_img_url", "")
        
        if code and name:
            local_img = process_minifig_image(code, img_url)
            minifigs.append({
                "code": code,
                "name": name,
                "quantity": qty,
                "image_url": local_img
            })
    return minifigs


def fetch_from_brickset(set_id: str) -> list:
    """
    Scrapes Brickset minifigures list as a fallback and processes images.
    """
    url = f"https://brickset.com/minifigs/in-{set_id}-1"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=10) as response:
        html = response.read().decode('utf-8')
        
    articles = html.split("<article class='set'>")
    minifigs = []
    for art in articles[1:]:
        qty_match = re.search(r"<div class='qty'>(\d+)x</div>", art)
        qty = int(qty_match.group(1)) if qty_match else 1
        
        title_match = re.search(r'title=["\']([^"\']+)["\']', art)
        name = ""
        code = ""
        if title_match:
            title_text = title_match.group(1)
            if ":" in title_text:
                parts = title_text.split(":", 1)
                code = parts[0].strip()
                name = parts[1].strip()
            else:
                name = title_text.strip()
                
        if not code or not name:
            h1_match = re.search(r"<h1><a href='/minifigs/([^/]+)/[^>]*>([^<]+)</a></h1>", art)
            if h1_match:
                code = h1_match.group(1)
                name = h1_match.group(2)
                
        if not code:
            code_match = re.search(r"href=['\"]/minifigs/([^/'\"]+)['\"]", art)
            if code_match:
                code = code_match.group(1)
                
        if code and name:
            # Predict BrickLink image URL
            img_url = f"https://img.bricklink.com/ItemImage/MN/0/{code}.png"
            local_img = process_minifig_image(code, img_url)
            minifigs.append({
                "code": code,
                "name": name,
                "quantity": qty,
                "image_url": local_img
            })
    return minifigs


def fetch_minifigures_hybrid(set_id: str) -> list:
    """
    Hybrid system to retrieve minifigures: Brickset scraper first (gives swXXXX/pocXXXX IDs), then Rebrickable API fallback.
    """
    try:
        print(f"Attempting Brickset scraping for set {set_id}...")
        res = fetch_from_brickset(set_id)
        if res:
            return res
    except Exception as e:
        print(f"Brickset scraping failed for set {set_id}: {e}. Falling back to Rebrickable...")
        
    api_key = get_rebrickable_key()
    if api_key:
        try:
            print(f"Attempting Rebrickable API for set {set_id}...")
            return fetch_from_rebrickable(set_id, api_key)
        except Exception as e:
            print(f"Rebrickable API failed for set {set_id}: {e}")
            
    return []


def load_minifigs_cache() -> dict:
    if os.path.exists(MINIFIGS_CACHE):
        try:
            with open(MINIFIGS_CACHE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading minifigs cache: {e}")
    return {}


def save_minifigs_cache(cache: dict):
    try:
        with open(MINIFIGS_CACHE, "w", encoding="utf-8") as f:
            json.dump(cache, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving minifigs cache: {e}")


def is_minifig_id(code: str) -> bool:
    val = code.strip().lower()
    return bool(re.match(r"^[a-zA-Z]+[-_]?\d+[a-zA-Z]*$", val))


def lookup_minifig_on_brickset(minifig_id: str) -> dict:
    url = f"https://brickset.com/minifigs/{minifig_id}"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    req = urllib.request.Request(url, headers=headers)
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            html = response.read().decode('utf-8')
    except Exception as e:
        print(f"Error fetching minifig from Brickset {minifig_id}: {e}")
        return {}
        
    dt_dd_pairs = re.findall(r"<dt>(.*?)</dt>\s*<dd>(.*?)</dd>", html, re.DOTALL)
    metadata = {}
    for dt, dd in dt_dd_pairs:
        dt_clean = dt.strip()
        dd_clean = re.sub(r"<[^>]+>", "", dd).strip()
        metadata[dt_clean] = dd_clean
        
    if not metadata:
        return {}
        
    result = {"id": minifig_id}
    result["name"] = metadata.get("Name", f"Minifig {minifig_id}")
    result["theme"] = metadata.get("Category", "Star Wars")
    result["subcategory"] = "Loose Minifigure"
    
    # Year/Dates
    release_date = ""
    year = metadata.get("Year released", "")
    if year:
        release_date = f"{year}-01-01"
    else:
        release_date = datetime.date.today().strftime("%Y-%m-%d")
        
    result["release_date"] = release_date
    result["retirement_date"] = "Active"
    
    # Prices
    result["retail_price"] = 0.0
    result["purchase_price"] = 0.0
    
    # Market Price
    market_price = 0.0
    current_val_raw = metadata.get("Current value", "")
    if current_val_raw:
        used_match = re.search(r"Used:\s*~?[\u00a3\u20ac\$]?\s*([\d\.]+)", current_val_raw)
        if used_match:
            try:
                market_price = float(used_match.group(1))
            except ValueError:
                pass
        else:
            new_match = re.search(r"New:\s*~?[\u00a3\u20ac\$]?\s*([\d\.]+)", current_val_raw)
            if new_match:
                try:
                    market_price = float(new_match.group(1))
                except ValueError:
                    pass
    result["market_price"] = market_price
    
    result["official_url"] = f"https://www.brickeconomy.com/minifig/{minifig_id}"
    result["image_url"] = f"https://img.bricklink.com/ItemImage/MN/0/{minifig_id}.png"
    
    return result


def parse_brickset_date(date_str: str) -> str:
    parts = date_str.strip().split()
    if len(parts) == 3:
        day = parts[0].zfill(2)
        month_abbrs = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        try:
            month_idx = month_abbrs.index(parts[1][:3].capitalize()) + 1
            month = str(month_idx).zfill(2)
        except ValueError:
            month = "01"
        year_str = parts[2]
        if len(year_str) == 2:
            year = "20" + year_str
        else:
            year = year_str
        return f"{year}-{month}-{day}"
    return ""


def lookup_set_on_brickset(set_id: str) -> dict:
    url = f"https://brickset.com/sets/{set_id}-1"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    req = urllib.request.Request(url, headers=headers)
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            html = response.read().decode('utf-8')
    except Exception as e:
        print(f"Error fetching from Brickset for set {set_id}: {e}")
        return {}
        
    dt_dd_pairs = re.findall(r"<dt>(.*?)</dt>\s*<dd>(.*?)</dd>", html, re.DOTALL)
    metadata = {}
    for dt, dd in dt_dd_pairs:
        dt_clean = dt.strip()
        dd_clean = re.sub(r"<[^>]+>", "", dd).strip()
        metadata[dt_clean] = dd_clean
        
    if not metadata:
        return {}
        
    result = {"id": set_id}
    result["name"] = metadata.get("Name", f"Set {set_id}")
    result["theme"] = metadata.get("Theme", "Star Wars")
    result["subcategory"] = metadata.get("Subtheme", "")
    
    # Year/Dates
    release_date = ""
    retirement_date = "Active"
    
    launch_exit = metadata.get("Launch/exit", "")
    if launch_exit:
        dates = launch_exit.split(" - ")
        if len(dates) >= 1:
            release_date = parse_brickset_date(dates[0])
        if len(dates) >= 2:
            ret_date = parse_brickset_date(dates[1])
            if ret_date:
                try:
                    exit_dt = datetime.datetime.strptime(ret_date, "%Y-%m-%d").date()
                    if exit_dt <= datetime.date.today():
                        retirement_date = ret_date
                except Exception:
                    pass
    
    if not release_date:
        year = metadata.get("Year released", "")
        if year:
            release_date = f"{year}-01-01"
        else:
            release_date = datetime.date.today().strftime("%Y-%m-%d")
            
    result["release_date"] = release_date
    result["retirement_date"] = retirement_date
    
    # Prices
    retail_price = 0.0
    rrp_raw = metadata.get("RRP", "")
    if rrp_raw:
        euro_match = re.search(r"([\d\.]+)\s*€|€\s*([\d\.]+)", rrp_raw)
        if euro_match:
            val = euro_match.group(1) or euro_match.group(2)
            try:
                retail_price = float(val)
            except ValueError:
                pass
                
    result["retail_price"] = retail_price
    result["purchase_price"] = 0.0
    
    # Market Price
    market_price = retail_price
    current_val_raw = metadata.get("Current value", "")
    if current_val_raw:
        new_match = re.search(r"New:\s*~?[\u00a3\u20ac\$]?\s*([\d\.]+)", current_val_raw)
        if new_match:
            try:
                market_price = float(new_match.group(1))
            except ValueError:
                pass
    result["market_price"] = market_price
    
    result["official_url"] = f"https://www.lego.com/es-es/product/{metadata.get('Name', '').lower().replace(' ', '-')}-{set_id}"
    
    img_match = re.search(r'<div id="setimage">.*?<img src=["\']([^"\']+)["\']', html, re.DOTALL)
    if img_match:
        result["image_url"] = img_match.group(1)
    else:
        result["image_url"] = f"https://images.brickset.com/sets/images/{set_id}-1.jpg"
        
    return result


def lookup_set_on_rebrickable(set_id: str, api_key: str) -> dict:
    url = f"https://rebrickable.com/api/v3/lego/sets/{set_id}-1/"
    headers = {
        'Authorization': f'key {api_key}',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching from Rebrickable for set {set_id}: {e}")
        return {}
        
    result = {
        "id": set_id,
        "name": data.get("name", ""),
        "theme": "Star Wars",
        "subcategory": "",
        "release_date": f"{data.get('year', datetime.date.today().year)}-01-01",
        "retirement_date": "Active",
        "retail_price": 0.0,
        "purchase_price": 0.0,
        "market_price": 0.0,
        "image_url": data.get("set_img_url", ""),
        "official_url": f"https://www.lego.com/es-es/search?q={set_id}"
    }
    
    theme_id = data.get("theme_id")
    if theme_id:
        theme_url = f"https://rebrickable.com/api/v3/lego/themes/{theme_id}/"
        theme_req = urllib.request.Request(theme_url, headers=headers)
        try:
            with urllib.request.urlopen(theme_req, timeout=5) as theme_resp:
                theme_data = json.loads(theme_resp.read().decode('utf-8'))
                result["theme"] = theme_data.get("name", "Star Wars")
        except Exception:
            pass
            
    return result


def warmup_minifigs(set_id: str):
    try:
        cache = load_minifigs_cache()
        if set_id not in cache:
            minifigs = fetch_minifigures_hybrid(set_id)
            cache[set_id] = minifigs
            save_minifigs_cache(cache)
    except Exception as e:
        print(f"Error warming up minifigures cache for set {set_id}: {e}")


# --- API Routes ---
@app.get("/api/legos", response_model=list[LegoSet])
def get_legos():
    return read_csv()


@app.get("/api/sets/lookup/{set_id}")
def lookup_set(set_id: str):
    set_id_clean = set_id.strip()
    if is_minifig_id(set_id_clean):
        print(f"\n[INFO] --- Iniciando búsqueda de la minifigura {set_id_clean} ---")
        res = lookup_minifig_on_brickset(set_id_clean)
        if res:
            print(f"[INFO] Minifigura {set_id_clean} encontrada en Brickset con éxito: '{res.get('name')}'")
            return res
        raise HTTPException(status_code=404, detail=f"Minifigure {set_id_clean} not found in Lego databases.")
        
    print(f"\n[INFO] --- Iniciando búsqueda del set {set_id_clean} ---")
    print(f"[INFO] Buscando en Brickset...")
    res = lookup_set_on_brickset(set_id_clean)
    if res:
        print(f"[INFO] Set {set_id_clean} encontrado en Brickset con éxito: '{res.get('name')}'")
        return res
        
    print(f"[INFO] No encontrado en Brickset. Buscando en Rebrickable...")
    api_key = get_rebrickable_key()
    if api_key:
        res = lookup_set_on_rebrickable(set_id_clean, api_key)
        if res:
            print(f"[INFO] Set {set_id_clean} encontrado en Rebrickable con éxito: '{res.get('name')}'")
            return res
            
    print(f"[WARNING] Set {set_id_clean} no se ha encontrado en ninguna base de datos.")
    raise HTTPException(status_code=404, detail=f"Set {set_id_clean} not found in Lego databases.")


@app.post("/api/legos", response_model=LegoSet, status_code=status.HTTP_201_CREATED)
def create_lego(lego: LegoSet, background_tasks: BackgroundTasks):
    records = read_csv()
    # Check if ID already exists
    if any(rec["id"] == lego.id for rec in records):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Lego set with ID '{lego.id}' already exists."
        )
    
    # Auto-populate official_url if empty
    if not lego.official_url.strip():
        lego.official_url = f"https://www.lego.com/es-es/search?q={lego.id}"
        
    # Process image background to make transparent
    lego.image_url = process_and_save_image(lego.id, lego.image_url)
    
    new_record = lego.dict()
    records.append(new_record)
    write_csv(records)
    
    # Warm up minifigures in background
    is_loose = lego.subcategory == "Loose Minifigure" or lego.id.startswith("sw") or lego.id.startswith("fig")
    if not is_loose:
        background_tasks.add_task(warmup_minifigs, lego.id)
        
    return new_record


@app.put("/api/legos/{lego_id}", response_model=LegoSet)
def update_lego(lego_id: str, updated_lego: LegoSet):
    records = read_csv()
    target_idx = -1
    for idx, rec in enumerate(records):
        if rec["id"] == lego_id:
            target_idx = idx
            break
            
    if target_idx == -1:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lego set with ID '{lego_id}' not found."
        )
    
    # Check if ID changed and conflicts with another set
    if lego_id != updated_lego.id:
        if any(rec["id"] == updated_lego.id for i, rec in enumerate(records) if i != target_idx):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot change ID to '{updated_lego.id}' because it already exists."
            )
            
    # Auto-populate official_url if empty
    if not updated_lego.official_url.strip():
        updated_lego.official_url = f"https://www.lego.com/es-es/search?q={updated_lego.id}"
            
    # Process image background to make transparent
    updated_lego.image_url = process_and_save_image(updated_lego.id, updated_lego.image_url)
            
    updated_dict = updated_lego.dict()
    records[target_idx] = updated_dict
    write_csv(records)
    return updated_dict


@app.delete("/api/legos/{lego_id}")
def delete_lego(lego_id: str):
    records = read_csv()
    target_idx = -1
    for idx, rec in enumerate(records):
        if rec["id"] == lego_id:
            target_idx = idx
            break
            
    if target_idx == -1:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lego set with ID '{lego_id}' not found."
        )
    
    deleted_rec = records.pop(target_idx)
    write_csv(records)
    return {"status": "success", "message": f"Deleted Lego set {lego_id}", "deleted": deleted_rec}


@app.get("/api/minifigs")
def get_minifigures():
    sets = read_csv()
    cache = load_minifigs_cache()
    
    cache_updated = False
    for s in sets:
        set_id = s["id"]
        # If it is a loose minifigure, do not fetch set details from API/scraper
        is_loose = s.get("subcategory") == "Loose Minifigure" or set_id.startswith("sw") or set_id.startswith("fig")
        if is_loose:
            continue
            
        if set_id not in cache:
            minifigs = fetch_minifigures_hybrid(set_id)
            cache[set_id] = minifigs
            cache_updated = True
    if cache_updated:
        save_minifigs_cache(cache)
        
    # Consolidate and aggregate minifigures across all owned sets and loose figures
    # Mapping to unify identical minifigures with different database codes
    MINIFIG_MAPPING = {
        "fig-002330": "sw0001c",  # Battle Droid (One Bent Arm, One Straight Arm)
    }

    aggregated = {}
    for s in sets:
        set_id = s["id"]
        theme = s["theme"]
        is_loose = s.get("subcategory") == "Loose Minifigure" or set_id.startswith("sw") or set_id.startswith("fig")
        
        if is_loose:
            code = set_id
            # Extract base code if there is a suffix (e.g., sw0001c-2 -> sw0001c)
            base_match = re.match(r"^([a-zA-Z]+[-_]?\d+[a-zA-Z]*)(?:[-_]\d+)?$", set_id)
            if base_match:
                code = base_match.group(1)
                
            # Apply mapping to unify identical figures
            code = MINIFIG_MAPPING.get(code, code)
                
            name = s["name"]
            # Clean up "(Minifig)" suffix if present
            if name.endswith(" (Minifig)"):
                name = name[:-10].strip()
            qty = 1
            img_url = s.get("image_url") or f"images/minifigs/{code}.png"
            
            if code not in aggregated:
                aggregated[code] = {
                    "code": code,
                    "name": name,
                    "quantity": 0,
                    "image_url": img_url,
                    "theme": theme,
                    "sets": []
                }
                
            aggregated[code]["quantity"] += qty
            
            # Consolidate loose entries in the origins list
            loose_entry = next((item for item in aggregated[code]["sets"] if item["id"] == "Loose"), None)
            if loose_entry:
                loose_entry["qty_in_set"] += 1
                loose_entry["total_qty_figs"] += 1
            else:
                aggregated[code]["sets"].append({
                    "id": "Loose",
                    "name": "Minifigura suelta",
                    "qty_in_set": 1,
                    "qty_owned": 1,
                    "total_qty_figs": 1
                })
            continue
        
        set_minifigs = cache.get(set_id, [])
        for fig in set_minifigs:
            code = fig["code"]
            # Apply mapping to unify identical figures
            code = MINIFIG_MAPPING.get(code, code)
            
            name = fig["name"]
            qty_in_set = fig["quantity"]
            qty_owned = s.get("quantity", 1)  # how many of this set the user owns
            total_qty = qty_in_set * qty_owned
            
            # Use local transparent image if it exists; otherwise fall back to cached URL
            local_path = f"public/images/minifigs/{code}.png"
            if os.path.exists(local_path):
                img_url = f"images/minifigs/{code}.png"
            else:
                img_url = fig.get("image_url") or f"images/minifigs/{code}.png"
            
            if code not in aggregated:
                aggregated[code] = {
                    "code": code,
                    "name": name,
                    "quantity": 0,
                    "image_url": img_url,
                    "theme": theme,
                    "sets": []
                }
                
            aggregated[code]["quantity"] += total_qty
            
            # Check if this set is already listed in the parent sets of this minifigure
            set_entry = next((item for item in aggregated[code]["sets"] if item["id"] == set_id), None)
            if set_entry:
                set_entry["qty_owned"] += 1
                set_entry["total_qty_figs"] += qty_in_set
            else:
                aggregated[code]["sets"].append({
                    "id": set_id,
                    "name": s["name"],
                    "qty_in_set": qty_in_set,
                    "qty_owned": 1,
                    "total_qty_figs": qty_in_set
                })
                
    result_list = list(aggregated.values())
    result_list.sort(key=lambda x: (-x["quantity"], x["name"]))
    return result_list



MINIFIGS_SET_CACHE = "set_minifigs_cache.json"

def load_set_minifigs_cache() -> dict:
    if os.path.exists(MINIFIGS_SET_CACHE):
        try:
            with open(MINIFIGS_SET_CACHE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def save_set_minifigs_cache(cache: dict):
    try:
        with open(MINIFIGS_SET_CACHE, "w", encoding="utf-8") as f:
            json.dump(cache, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving set minifigs cache: {e}")

@app.get("/api/sets/{set_id}/minifigs")
def get_set_minifigs(set_id: str):
    """Fetch the minifigures included in a set from Rebrickable (with cache)."""
    cache = load_set_minifigs_cache()
    if set_id in cache:
        return cache[set_id]

    api_key = get_rebrickable_key()
    if not api_key:
        raise HTTPException(status_code=400, detail="Se requiere clave de API de Rebrickable.")

    url = f"https://rebrickable.com/api/v3/lego/sets/{set_id}-1/minifigs/?page_size=100"
    headers = {
        "Authorization": f"key {api_key}",
        "User-Agent": "Mozilla/5.0"
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.loads(r.read().decode())
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error Rebrickable: {e}")

    results = []
    for item in data.get("results", []):
        results.append({
            "fig_num": item.get("set_num", ""),
            "name": item.get("set_name", item.get("fig_name", "?")),
            "quantity": item.get("quantity", 1),
            "img_url": item.get("set_img_url", ""),
        })

    cache[set_id] = results
    save_set_minifigs_cache(cache)
    return results

@app.post("/api/minifigs/refresh")
def refresh_minifigures():
    # Clear cache file
    if os.path.exists(MINIFIGS_CACHE):
        try:
            os.remove(MINIFIGS_CACHE)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to clear cache: {e}")
            
    # Delete downloaded minifig images
    minifigs_img_dir = "public/images/minifigs"
    if os.path.exists(minifigs_img_dir):
        try:
            shutil.rmtree(minifigs_img_dir)
        except Exception as e:
            print(f"Failed to clear minifig images directory: {e}")
            
    os.makedirs(minifigs_img_dir, exist_ok=True)
            
    # Re-trigger aggregation which will rebuild the cache
    return get_minifigures()


# --- Missing Pieces Domain ---
MISSING_PIECES_CSV = "missing_pieces.csv"
PARTS_CACHE = "parts_cache.json"

class MissingPiece(BaseModel):
    set_id: str = Field(..., min_length=1, description="Lego Set ID or 'Loose'")
    part_num: str = Field(..., min_length=1, description="Part number")
    name: str = Field(..., min_length=1, description="Part name")
    color_id: int = Field(..., ge=0, description="Rebrickable color ID")
    color_name: str = Field(..., min_length=1, description="Color name")
    quantity: int = Field(..., gt=0, description="Quantity missing")
    status: Literal['needed', 'ordered', 'received'] = Field(default='needed', description="Status of the missing piece")
    image_url: str = Field(default="", description="Image URL of the part")

def read_missing_pieces() -> list[dict]:
    if not os.path.exists(MISSING_PIECES_CSV):
        headers = ["set_id", "part_num", "name", "color_id", "color_name", "quantity", "status", "image_url"]
        with open(MISSING_PIECES_CSV, mode="w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
        return []
    
    records = []
    with open(MISSING_PIECES_CSV, mode="r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                color_id = int(row.get("color_id") or 0)
            except ValueError:
                color_id = 0
                
            try:
                quantity = int(row.get("quantity") or 1)
            except ValueError:
                quantity = 1
                
            records.append({
                "set_id": row.get("set_id", ""),
                "part_num": row.get("part_num", ""),
                "name": row.get("name", ""),
                "color_id": color_id,
                "color_name": row.get("color_name", ""),
                "quantity": quantity,
                "status": row.get("status", "needed"),
                "image_url": row.get("image_url", "")
            })
    return records

def write_missing_pieces(records: list[dict]):
    headers = ["set_id", "part_num", "name", "color_id", "color_name", "quantity", "status", "image_url"]
    
    # Create a backup before writing
    if os.path.exists(MISSING_PIECES_CSV):
        os.makedirs(BACKUP_DIR, exist_ok=True)
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        shutil.copy(MISSING_PIECES_CSV, os.path.join(BACKUP_DIR, f"missing_pieces_{timestamp}.csv.bak"))
        
        # Clean up old backups (keep last 5)
        backups = sorted([f for f in os.listdir(BACKUP_DIR) if f.startswith("missing_pieces_") and f.endswith(".bak")])
        while len(backups) > 5:
            try:
                os.remove(os.path.join(BACKUP_DIR, backups.pop(0)))
            except Exception as e:
                print(f"Failed to remove old backup: {e}")
                
    with open(MISSING_PIECES_CSV, mode="w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        for rec in records:
            writer.writerow(rec)

def load_parts_cache() -> dict:
    if os.path.exists(PARTS_CACHE):
        try:
            with open(PARTS_CACHE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading parts cache: {e}")
    return {}

def save_parts_cache(cache: dict):
    try:
        with open(PARTS_CACHE, "w", encoding="utf-8") as f:
            json.dump(cache, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving parts cache: {e}")

def fetch_parts_from_rebrickable(set_id: str, api_key: str) -> list:
    # Rebrickable set numbers require "-1" suffix
    url = f"https://rebrickable.com/api/v3/lego/sets/{set_id}-1/parts/?page_size=1000"
    headers = {
        'Authorization': f'key {api_key}',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=15) as response:
        data = json.loads(response.read().decode('utf-8'))
        
    parts = []
    results = data.get("results", [])
    for item in results:
        part = item.get("part", {})
        color = item.get("color", {})
        
        parts.append({
            "part_num": part.get("part_num", ""),
            "name": part.get("name", ""),
            "color_id": color.get("id", 0),
            "color_name": color.get("name", ""),
            "quantity": item.get("quantity", 1),
            "image_url": part.get("part_img_url") or ""
        })
    return parts

# --- Missing Pieces API Routes ---
@app.get("/api/legos/{set_id}/parts")
def get_set_parts(set_id: str):
    api_key = get_rebrickable_key()
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Se requiere una clave de API de Rebrickable para cargar el inventario oficial de piezas."
        )
        
    cache = load_parts_cache()
    if set_id in cache:
        return cache[set_id]
        
    try:
        parts = fetch_parts_from_rebrickable(set_id, api_key)
        cache[set_id] = parts
        save_parts_cache(cache)
        return parts
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error al conectar con la API de Rebrickable: {e}"
        )

@app.get("/api/missing-pieces")
def get_missing_pieces(set_id: Optional[str] = None):
    records = read_missing_pieces()
    if set_id:
        return [rec for rec in records if rec["set_id"] == set_id]
    return records

@app.post("/api/missing-pieces", status_code=status.HTTP_201_CREATED)
def add_missing_piece(piece: MissingPiece):
    records = read_missing_pieces()
    
    # Check if this exact piece (set_id + part_num + color_id) already exists
    for rec in records:
        if (rec["set_id"] == piece.set_id and 
            rec["part_num"] == piece.part_num and 
            rec["color_id"] == piece.color_id):
            # Sum quantity and update status
            rec["quantity"] += piece.quantity
            rec["status"] = piece.status
            write_missing_pieces(records)
            return rec
            
    new_rec = piece.dict()
    records.append(new_rec)
    write_missing_pieces(records)
    return new_rec

@app.put("/api/missing-pieces/{set_id}/{part_num}/{color_id}")
def update_missing_piece(set_id: str, part_num: str, color_id: int, updated: MissingPiece):
    records = read_missing_pieces()
    target_idx = -1
    for idx, rec in enumerate(records):
        if (rec["set_id"] == set_id and 
            rec["part_num"] == part_num and 
            rec["color_id"] == color_id):
            target_idx = idx
            break
            
    if target_idx == -1:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pieza faltante no encontrada."
        )
        
    updated_dict = updated.dict()
    records[target_idx] = updated_dict
    write_missing_pieces(records)
    return updated_dict

@app.delete("/api/missing-pieces/{set_id}/{part_num}/{color_id}")
def delete_missing_piece(set_id: str, part_num: str, color_id: int):
    records = read_missing_pieces()
    target_idx = -1
    for idx, rec in enumerate(records):
        if (rec["set_id"] == set_id and 
            rec["part_num"] == part_num and 
            rec["color_id"] == color_id):
            target_idx = idx
            break
            
    if target_idx == -1:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pieza faltante no encontrada."
        )
        
    deleted = records.pop(target_idx)
    write_missing_pieces(records)
    return {"status": "success", "message": "Pieza faltante eliminada", "deleted": deleted}


# --- Static Files / Frontend Hosting ---
# Mount static files folder
os.makedirs("public", exist_ok=True)
app.mount("/", StaticFiles(directory="public", html=True), name="static")
