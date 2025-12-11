import logging
import time
from pathlib import Path

from fastapi import FastAPI, HTTPException, Response
from prometheus_client import Counter, Histogram, CONTENT_TYPE_LATEST, generate_latest

app = FastAPI()

# Placeholder for future inference implementation
class ClusterInferenceService:
    def __init__(self, model_dir: Path):
        self.model_dir = model_dir
        # TODO: load model, scaler, etc. when implementation is added

    def infer(self, user_id: int):
        # TODO: implement inference logic using user_id
        raise NotImplementedError("Cluster inference is not implemented yet.")


BASE_DIR = Path(__file__).resolve().parent.parent
service = ClusterInferenceService(model_dir=BASE_DIR / "models")

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
def cluster_inference(user_id: int):
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
