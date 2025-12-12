import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv
import os
from bson import ObjectId
# load from parent directory
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB = os.getenv("MONGO_DB", "insightify")
client = MongoClient(MONGO_URI)
db = client[MONGO_DB]



class FetchData:
    def __init__(self, user_id):
        self.user_id = user_id
        # ensure user_id is ObjectId
        self.user_id = ObjectId(self.user_id)
    def fetch_activity(self) -> pd.DataFrame:
        """Raw activity rows for the user (all fields)."""
        activity = list(db.activities.find({"userId": self.user_id}))
        return pd.DataFrame(activity)

    def fetch_activity_minimal(self) -> pd.DataFrame:
        """Activity rows with only fields needed for timelines."""
        activity = list(
            db.activities.find(
                {"userId": self.user_id},
                {"userId": 1, "moduleId": 1, "status": 1, "timestamp": 1},
            )
        )
        return pd.DataFrame(activity)

    def fetch_quiz_results(self) -> pd.DataFrame:
        quiz_result = list(db.quizresults.find({"userId": self.user_id}))
        return pd.DataFrame(quiz_result)

    def fetch_quizzes(self, quiz_ids) -> pd.DataFrame:
        if not quiz_ids:
            return pd.DataFrame()
        quiz = list(db.quizzes.find({"_id": {"$in": quiz_ids}}))
        return pd.DataFrame(quiz)

class Prepare:
    def __init__(self, user_id):
        self.fetch = FetchData(user_id)
        # Keep the features list aligned with the clustering notebook
        self.features_final = [
            "avg_study_duration",
            "avg_time_utilization",
            "average_score",
            "consistency_ratio",
            "pass_rate",
        ]

    @staticmethod
    def _safe_to_datetime(series: pd.Series) -> pd.Series:
        """Convert a Series to datetime, coercing errors to NaT."""
        return pd.to_datetime(series, errors="coerce")

    @staticmethod
    def _nan_to_zero(value: float) -> float:
        """Replace NaN with 0.0 to keep feature defaults consistent."""
        return 0.0 if pd.isna(value) else float(value)

    def prepare_activity_by_module(self) -> pd.DataFrame:
        """
        Reduce activities to one row per module with started/completed timestamps.
        started_at: earliest 'started' timestamp
        completed_at: earliest 'completed' timestamp
        """
        df_act = self.fetch.fetch_activity_minimal()
        if df_act.empty:
            return df_act

        df_act["ts"] = self._safe_to_datetime(df_act["timestamp"])
        pivoted = (
            df_act.pivot_table(
                index=["moduleId"],
                columns="status",
                values="ts",
                aggfunc="min",
            )
            .reset_index()
            .rename(columns={"started": "started_at", "completed": "completed_at"})
        )
        # ensure only completed column is not null
        pivoted = pivoted[pivoted["completed_at"].notna()]

        return pivoted

    def prepare_quiz(self) -> pd.DataFrame:
        """
        Merge quiz results with quiz metadata and activity timelines.
        Returns one row per quiz result with started_at/completed_at.
        """
        quiz_results = self.fetch.fetch_quiz_results()
        if quiz_results.empty:
            return pd.DataFrame()

        # quiz_ids = quiz_results["quizId"].dropna().tolist()
        # quiz_ids = [
        #     oid if isinstance(oid, ObjectId) else ObjectId(str(oid)) for oid in quiz_ids
        # ]

        # quiz_df = self.fetch.fetch_quizzes(quiz_ids)

        if "moduleId" not in quiz_results.columns:
            return quiz_results

        quiz_results = quiz_results.copy()
        quiz_results["moduleId_str"] = quiz_results["moduleId"].astype(str)

        module_ids = quiz_results["moduleId"].dropna().tolist()
        module_ids = [
            oid if isinstance(oid, ObjectId) else ObjectId(str(oid)) for oid in module_ids
        ]

        quiz_df = list(db.quizzes.find({"moduleId": {"$in": module_ids}}))
        quiz_df = pd.DataFrame(quiz_df)     


        if not quiz_df.empty:
            quiz_df = quiz_df.copy()
            quiz_df["moduleId_str"] = quiz_df["moduleId"].astype(str)
            quiz_df = quiz_df.rename(columns={"_id": "quizId"})

        merged = quiz_results.merge(quiz_df, on="moduleId_str", how="left")
        
        

        # Compute exam time utilization percentage (duration vs allowed time)
        if "duration" in merged.columns and "maximumDuration" in merged.columns:
            max_dur = merged["maximumDuration"].replace({0: pd.NA})
            merged["time_utilization_pct"] = (merged["duration"] / max_dur) * 100
            merged["time_utilization_pct"] = merged["time_utilization_pct"].clip(
                lower=0
            )

        # DEBUG
        print("merged columns:", merged.columns.tolist())
        print("merged head:", merged.head(1).to_dict(orient="records"))

        return merged

    @staticmethod
    def _compute_consistency_ratio(df_act: pd.DataFrame) -> float:
        """Ratio of most-common active day to total active days."""
        if df_act.empty:
            return 0.0
        df = df_act.copy()
        df["ts"] = Prepare._safe_to_datetime(df["timestamp"])
        counts = df["ts"].dt.day_name().value_counts()
        total = counts.sum()
        return float(counts.max() / total) if total else 0.0

    @staticmethod
    def _compute_avg_study_duration(activity_by_module: pd.DataFrame) -> float:
        """Average minutes spent per module (completed ones only)."""
        if activity_by_module.empty:
            return 0.0
        df = activity_by_module.dropna(subset=["started_at", "completed_at"]).copy()
        if df.empty:
            return 0.0
        df["duration_seconds"] = (
            Prepare._safe_to_datetime(df["completed_at"])
            - Prepare._safe_to_datetime(df["started_at"])
        ).dt.total_seconds()
        df = df[df["duration_seconds"] > 0]
        if df.empty:
            return 0.0
        return float(df["duration_seconds"].mean() / 60)  # minutes

    def prepare_features(self) -> pd.DataFrame:
        """
        Aggregate user-level features aligned with features_final in the notebook.
        Returns a single-row DataFrame with the expected columns.
        """
        activity_min = self.fetch.fetch_activity_minimal()
        activity_by_module = self.prepare_activity_by_module()
        quiz_df = self.prepare_quiz()

        avg_study_duration = self._compute_avg_study_duration(activity_by_module)
        avg_time_utilization = self._nan_to_zero(
            quiz_df["time_utilization_pct"].dropna().mean()
            if not quiz_df.empty and "time_utilization_pct" in quiz_df.columns
            else 0.0
        )
        average_score = self._nan_to_zero(
            quiz_df["score"].dropna().mean()
            if not quiz_df.empty and "score" in quiz_df.columns
            else 0.0
        )
        pass_rate = self._nan_to_zero(
            quiz_df["passed"].dropna().mean()
            if not quiz_df.empty and "passed" in quiz_df.columns
            else 0.0
        )
        consistency_ratio = self._compute_consistency_ratio(activity_min)

        data = {
            "avg_study_duration": avg_study_duration,
            "avg_time_utilization": avg_time_utilization,
            "average_score": average_score,
            "consistency_ratio": consistency_ratio,
            "pass_rate": pass_rate,
        }

        # Ensure order/availability of expected columns
        df_features = pd.DataFrame([data])
        for col in self.features_final:
            if col not in df_features.columns:
                df_features[col] = 0.0
        return df_features[self.features_final]



if __name__ == "__main__":
    # target Feature
    features_final = [
        'avg_study_duration',   # Produktivitas
        'avg_time_utilization',        # Ketelitian/Penggunaan Waktu (0-100)
        'average_score', # Kejagoan
        'consistency_ratio',           # Disiplin
        # 'avg_time_left_minutes',       # Kecepatan (Makin tinggi = makin cepat)
        # 'revisit_rate'            # Pengulangan
        'pass_rate'
    ]
    prepare = Prepare(user_id="6549a1f0509b9b21caffdb37")
    df_features = prepare.prepare_features()
    # check if features final is in df_features
    dfs_col = df_features.columns
    for col in features_final:
        if col not in dfs_col:
            print(f"Column {col} not found in df_features")
            break
    else:
        print(f"All columns found in df_features")
    # print(df_features)