import logging
import time
from pathlib import Path
import joblib
import numpy as np

from fastapi import FastAPI, HTTPException, Response
from prometheus_client import Counter, Histogram, CONTENT_TYPE_LATEST, generate_latest

from prepare_data import Prepare

app = FastAPI()

class ClusterInferenceService:
    def __init__(self, model_path: Path, scaler_path: Path, centroids_path: Path):
        self.model_path = model_path
        self.scaler_path = scaler_path
        self.centroids_path = centroids_path

        # load model, scaler, centroids
        # self.model = joblib.load(self.model_path)
        self.scaler = joblib.load(self.scaler_path)
        self.centroids = np.load(self.centroids_path)

    def infer(self, user_id: str):
        # prepare data
        prepare = Prepare(user_id)
        df_features = prepare.prepare_features()
        # scale data
        df_features_scaled = self.scaler.transform(df_features)
        # assign to nearest centroid (Agglomerative lacks predict)
        distances = np.linalg.norm(self.centroids - df_features_scaled, axis=1)
        best_idx = int(np.argmin(distances))
        return {"cluster": best_idx, "distance": float(distances[best_idx])}


BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "agg_model_41_4n.pkl"
SCALER_PATH = BASE_DIR / "models" / "agg_scaler.pkl"
CENTROIDS_PATH = BASE_DIR / "models" / "agg_centroids.npy"
service = ClusterInferenceService(
    model_path=MODEL_PATH,
    scaler_path=SCALER_PATH,
    centroids_path=CENTROIDS_PATH,
)

# Prometheus metrics
INFERENCE_REQUESTS = Counter(
    "cluster_inference_requests_total",
    "Total number of cluster inference requests",
)
INFERENCE_ERRORS = Counter(
    "cluster_inference_errors_total",
    "Total number of failed cluster inference requests",
)
INFERENCE_LATENCY = Histogram(
    "cluster_inference_latency_seconds",
    "Cluster inference latency (seconds)",
    buckets=(0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10),
)

logger = logging.getLogger("uvicorn.error")


@app.get("/retrive-class")
def get_user_class():
    # Kept for backward compatibility with the existing stub.
    return {"class": 0}


@app.post("/cluster-inference")
def cluster_inference(user_id: str):
    """
    Predict cluster for a user using their user_id.
    Inference logic will be delegated to ClusterInferenceService (to be implemented).
    """
    start_time = time.perf_counter()
    INFERENCE_REQUESTS.inc()
    try:
        result = service.infer(user_id=user_id)
        latency = time.perf_counter() - start_time
        INFERENCE_LATENCY.observe(latency)
        logger.info("cluster-inference success user_id=%s latency=%.4fs", user_id, latency)
        return {"user_id": user_id, "result": result}
    except NotImplementedError as exc:
        INFERENCE_ERRORS.inc()
        raise HTTPException(status_code=501, detail=str(exc))
    except Exception as exc:
        INFERENCE_ERRORS.inc()
        logger.exception("cluster-inference failed user_id=%s error=%s", user_id, exc)
        raise HTTPException(status_code=400, detail=str(exc))


@app.get("/metrics")
def metrics():
    """Expose Prometheus metrics."""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
