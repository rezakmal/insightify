import hashlib
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd
from bson import ObjectId
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import BulkWriteError


load_dotenv()

# Paths
ROOT_DIR = Path(__file__).resolve().parent
DATA_DIR = ROOT_DIR / "dataset" / "raw"

# Mongo connection
MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB = os.getenv("MONGO_DB", "insightify")

if not MONGO_URI:
    raise ValueError("Missing MONGO_URI in environment variables")

client = MongoClient(MONGO_URI)
db = client[MONGO_DB]


def parse_dt(value: Any) -> Optional[datetime]:
    """Parse datetime strings from CSV into datetime objects."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    parsed = pd.to_datetime(str(value), errors="coerce")
    if pd.isna(parsed):
        return None
    return parsed.to_pydatetime()


def clean_int(value: Any) -> Optional[int]:
    """Normalize stringified numbers that include thousands separators."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    try:
        return int(str(value).replace(",", "").strip())
    except ValueError:
        return None


def make_object_id(seed: str) -> ObjectId:
    """Deterministic ObjectId from a seed string to keep relations stable."""
    digest = hashlib.md5(seed.encode("utf-8")).hexdigest()
    return ObjectId(digest[:24])


def load_csv(name: str, **kwargs) -> pd.DataFrame:
    path = DATA_DIR / name
    return pd.read_csv(path, thousands=",", **kwargs)


def build_activities(limit: int = 1000) -> List[Dict[str, Any]]:
    """
    Map developer_journey_trackings into Activity documents.

    - Use records with completed_at not null (clean data requirement).
    - Split each record into started and completed Activity entries.
    - Limit to `limit` base rows (will produce up to 2 * limit docs).
    """
    df = load_csv("developer_journey_trackings.csv")
    df = df.dropna(subset=["completed_at"]).head(limit)

    docs: List[Dict[str, Any]] = []

    for _, row in df.iterrows():
        user_seed = str(row.get("developer_id"))
        course_seed = str(row.get("journey_id"))
        module_seed = str(row.get("tutorial_id"))

        user_id = make_object_id(f"user-{user_seed}")
        course_id = make_object_id(f"course-{course_seed}")
        module_id = make_object_id(f"module-{module_seed}")

        started_at = parse_dt(row.get("first_opened_at") or row.get("last_viewed"))
        completed_at = parse_dt(row.get("completed_at"))

        if started_at:
            docs.append(
                {
                    "_id": make_object_id(f"activity-start-{row.get('id')}"),
                    "userId": user_id,
                    "courseId": course_id,
                    "moduleId": module_id,
                    "status": "started",
                    "timestamp": started_at,
                }
            )

        if completed_at:
            docs.append(
                {
                    "_id": make_object_id(f"activity-complete-{row.get('id')}"),
                    "userId": user_id,
                    "courseId": course_id,
                    "moduleId": module_id,
                    "status": "completed",
                    "timestamp": completed_at,
                }
            )

    return docs


def build_quizzes(limit: int = 1000) -> List[Dict[str, Any]]:
    """
    Map exam_registrations into Quiz documents.

    Only keep rows with both created_at and deadline_at to derive durations.
    """
    df = load_csv("exam_registrations.csv")
    df = df.dropna(subset=["created_at", "deadline_at", "exam_module_id"]).head(limit)

    docs: List[Dict[str, Any]] = []

    for _, row in df.iterrows():
        module_seed = str(clean_int(row.get("exam_module_id")))
        module_id = make_object_id(f"module-{module_seed}")

        created_at = parse_dt(row.get("created_at"))
        deadline_at = parse_dt(row.get("deadline_at"))

        duration_seconds = 1800  # sensible default
        if created_at and deadline_at:
            diff = (deadline_at - created_at).total_seconds()
            if diff > 0:
                duration_seconds = max(600, int(diff))

        tutorial_label = clean_int(row.get("tutorial_id")) or "tutorial"

        docs.append(
            {
                "_id": make_object_id(f"quiz-{row.get('id')}"),
                "moduleId": module_id,
                "maximumDuration": duration_seconds,
                "questions": [
                    {
                        "question": f"Auto-generated question for tutorial {tutorial_label}",
                        "options": [
                            "Placeholder option A",
                            "Placeholder option B",
                            "Placeholder option C",
                            "Placeholder option D",
                        ],
                        "answer": 0,
                    }
                ],
            }
        )

    return docs


def build_quiz_results(limit: int = 1000) -> List[Dict[str, Any]]:
    """
    Map exam_results into QuizResult documents, joining exam_registrations
    to pull module and user linkage.
    """
    reg_df = load_csv("exam_registrations.csv")
    reg_df["reg_id"] = reg_df["id"].apply(clean_int)
    reg_df["module_seed"] = reg_df["exam_module_id"].apply(clean_int)
    reg_df["user_seed"] = reg_df["examinees_id"].apply(clean_int)
    reg_df = reg_df.set_index("reg_id")

    results_df = load_csv("exam_results.csv")
    results_df = results_df.dropna(subset=["exam_registration_id", "score"]).head(limit)

    docs: List[Dict[str, Any]] = []

    for _, row in results_df.iterrows():
        reg_id = clean_int(row.get("exam_registration_id"))
        reg = reg_df.loc[reg_id] if reg_id in reg_df.index else None

        quiz_id = make_object_id(f"quiz-{reg_id}") if reg_id is not None else make_object_id(
            f"quiz-missing-{row.get('id')}"
        )
        module_seed = str(reg["module_seed"]) if reg is not None else f"reg-{reg_id}"
        user_seed = str(reg["user_seed"]) if reg is not None else f"user-{reg_id}"

        module_id = make_object_id(f"module-{module_seed}")
        user_id = make_object_id(f"user-{user_seed}")

        score = row.get("score")
        total_questions = row.get("total_questions") or 0
        passed = bool(int(row.get("is_passed"))) if not pd.isna(row.get("is_passed")) else False

        created_at = parse_dt(row.get("created_at"))
        look_report_at = parse_dt(row.get("look_report_at"))
        duration_seconds = 900
        if created_at and look_report_at:
            diff = (look_report_at - created_at).total_seconds()
            if diff > 0:
                duration_seconds = max(60, int(diff))

        docs.append(
            {
                "_id": make_object_id(f"quiz-result-{row.get('id')}"),
                "quizId": quiz_id,
                "userId": user_id,
                "moduleId": module_id,
                "score": float(score) if not pd.isna(score) else 0,
                "totalQuestions": int(total_questions) if not pd.isna(total_questions) else 0,
                "passed": passed,
                "duration": duration_seconds,
                "timestamp": created_at or datetime.utcnow(),
            }
        )

    return docs


def insert_documents(collection_name: str, docs: List[Dict[str, Any]]) -> None:
    if not docs:
        print(f"[skip] No documents to insert into {collection_name}")
        return
    try:
        result = db[collection_name].insert_many(docs, ordered=False)
        print(f"[ok] Inserted {len(result.inserted_ids)} documents into {collection_name}")
    except BulkWriteError as bwe:
        write_errors = bwe.details.get("writeErrors", [])
        dup_errors = [err for err in write_errors if err.get("code") == 11000]
        non_dup_errors = [err for err in write_errors if err.get("code") != 11000]
        inserted = bwe.details.get("nInserted", 0)

        if non_dup_errors:
            print(f"[error] Inserted {inserted} docs into {collection_name} before failure")
            raise

        skipped = len(dup_errors)
        print(f"[ok-partial] Inserted {inserted} docs into {collection_name}, skipped {skipped} duplicates")


def main() -> None:
    activities = build_activities(limit=1000)
    quizzes = build_quizzes(limit=1000)
    quiz_results = build_quiz_results(limit=1000)

    insert_documents("activities", activities)
    insert_documents("quizzes", quizzes)
    insert_documents("quizresults", quiz_results)


if __name__ == "__main__":
    main()

