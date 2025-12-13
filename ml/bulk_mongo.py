import zipfile
import tempfile
import pandas as pd
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, BulkWriteError
from dateutil.parser import parse
from pathlib import Path
import math
import sys
import os

# ================= CONFIG =================
ZIP_PATH = "dataset/test.zip"          # zip containing CSVs
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "insightify"
BATCH_SIZE = 1000
DROP_COLLECTIONS = True       # set True if you want clean overwrite
# =========================================


def infer_value(v):
    if pd.isna(v):
        return None

    if isinstance(v, str):
        s = v.strip().lower()
        if s in ("true", "false"):
            return s == "true"
        if s in ("null", "none", ""):
            return None

        # try int
        try:
            i = int(v)
            return i
        except:
            pass

        # try float
        try:
            f = float(v)
            if math.isfinite(f):
                return f
        except:
            pass

        # try date
        try:
            return parse(v)
        except:
            pass

    return v


def convert_df(df):
    return [
        {col: infer_value(row[col]) for col in df.columns}
        for _, row in df.iterrows()
    ]


def main():
    # Resolve ZIP path relative to script location
    script_dir = Path(__file__).parent
    zip_path = script_dir / ZIP_PATH
    zip_path = zip_path.resolve()
    
    print(f"Script directory: {script_dir}")
    print(f"Looking for ZIP file at: {zip_path}")
    
    # Check if ZIP file exists
    if not zip_path.exists():
        print(f"ERROR: ZIP file not found at {zip_path}")
        print(f"Current working directory: {os.getcwd()}")
        sys.exit(1)
    
    print(f"Found ZIP file: {zip_path}")
    
    # Test MongoDB connection
    try:
        print(f"Connecting to MongoDB at {MONGO_URI}...")
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        # Test connection
        client.admin.command('ping')
        print("✓ MongoDB connection successful")
    except ConnectionFailure as e:
        print(f"ERROR: Failed to connect to MongoDB: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: Unexpected error connecting to MongoDB: {e}")
        sys.exit(1)
    
    db = client[DB_NAME]
    print(f"Using database: {DB_NAME}")

    try:
        with tempfile.TemporaryDirectory() as tmp:
            print(f"Extracting ZIP to temporary directory...")
            try:
                with zipfile.ZipFile(zip_path) as z:
                    z.extractall(tmp)
                    print(f"✓ ZIP extracted successfully")
            except zipfile.BadZipFile as e:
                print(f"ERROR: Invalid ZIP file: {e}")
                sys.exit(1)
            except Exception as e:
                print(f"ERROR: Failed to extract ZIP file: {e}")
                sys.exit(1)

            # Find CSV files recursively (handles subdirectories like 'test/')
            csv_files = list(Path(tmp).rglob("*.csv"))
            if not csv_files:
                print(f"WARNING: No CSV files found in ZIP archive")
                print(f"Files in ZIP: {list(Path(tmp).iterdir())}")
                sys.exit(1)
            
            print(f"Found {len(csv_files)} CSV file(s)")

            for csv_file in csv_files:
                # Extract collection name from db.collection.csv format
                # e.g., "insightify.activities.csv" -> "activities"
                stem = csv_file.stem  # "insightify.activities"
                parts = stem.split('.')
                if len(parts) >= 2:
                    # Take everything after the first part (db name)
                    collection_name = '.'.join(parts[1:])
                else:
                    # Fallback: use the whole stem if no dots found
                    collection_name = stem
                
                print(f"\nImporting: {collection_name} (from {csv_file.name})")

                try:
                    df = pd.read_csv(csv_file)
                    print(f"  → Read {len(df)} rows from CSV")
                except Exception as e:
                    print(f"  ERROR: Failed to read CSV file {csv_file}: {e}")
                    continue

                try:
                    docs = convert_df(df)
                    print(f"  → Converted {len(docs)} documents")
                except Exception as e:
                    print(f"  ERROR: Failed to convert DataFrame: {e}")
                    continue

                col = db[collection_name]

                if DROP_COLLECTIONS:
                    print(f"  → Dropping existing collection...")
                    col.drop()

                try:
                    inserted_count = 0
                    for i in range(0, len(docs), BATCH_SIZE):
                        batch = docs[i:i+BATCH_SIZE]
                        result = col.insert_many(batch)
                        inserted_count += len(result.inserted_ids)
                        print(f"  → Inserted batch {i//BATCH_SIZE + 1} ({len(batch)} documents)")

                    print(f"  ✓ Successfully inserted {inserted_count} documents into '{collection_name}'")
                except BulkWriteError as e:
                    print(f"  ERROR: Bulk write error: {e.details}")
                    continue
                except Exception as e:
                    print(f"  ERROR: Failed to insert documents: {e}")
                    continue

        print("\n✓ Done.")
    except Exception as e:
        print(f"\nERROR: Unexpected error in main execution: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        client.close()


if __name__ == "__main__":
    main()
