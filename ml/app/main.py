import logging
import time
from pathlib import Path
import joblib
import numpy as np

from fastapi import FastAPI, HTTPException, Response
from pydantic import BaseModel
from prometheus_client import Counter, Histogram, CONTENT_TYPE_LATEST, generate_latest

from prepare_data import Prepare

app = FastAPI()


class InferenceRequest(BaseModel):
    user_id: str

class ClusterInferenceService:
    def __init__(self, model_path: Path, scaler_path: Path):
        self.model_path = model_path
        self.scaler_path = scaler_path

        # load model and scaler
        self.model = joblib.load(self.model_path)
        self.scaler = joblib.load(self.scaler_path)

    def infer(self, user_id: str):
        # prepare data
        prepare = Prepare(user_id)
        df_features = prepare.prepare_features()
        # scale data
        df_features_scaled = self.scaler.transform(df_features)
        # predict cluster using KMeans
        cluster = int(self.model.predict(df_features_scaled)[0])
        # calculate distance to assigned centroid
        centroid = self.model.cluster_centers_[cluster]
        distance = float(np.linalg.norm(df_features_scaled - centroid))
        return {"cluster": cluster, "distance": distance, "learner_type": self.translate(cluster)}
    
    def translate(self, cluster):
        cluster_interpretation = {
            0: {
                "learner_type": "Slow but Sure",
                "strength": [
                    "Mampu belajar dalam durasi panjang saat termotivasi",
                    "Hasil akademik cukup baik meskipun tidak rutin",
                    "Tahan terhadap beban belajar berat dalam satu waktu"
                ],
                "weakness": [
                    "Konsistensi belajar rendah",
                    "Cenderung belajar secara meledak-ledak (cramming)",
                    "Efisiensi waktu belajar kurang optimal"
                ],
                "tips": [
                    "Ubah pola belajar marathon menjadi sesi singkat namun rutin",
                    "Gunakan milestone kecil untuk menjaga momentum",
                    "Fokus pada keberlanjutan belajar, bukan ledakan produktivitas"
                ]
            },

            1: {
                "learner_type": "Performative Learner",
                "strength": [
                    "Konsistensi belajar sangat tinggi",
                    "Pemanfaatan waktu belajar paling efisien",
                    "Performa akademik stabil dan unggul"
                ],
                "weakness": [
                    "Durasi belajar sangat singkat",
                    "Potensi eksplorasi materi lanjutan belum maksimal"
                ],
                "tips": [
                    "Dorong eksplorasi materi lanjutan dan studi kasus kompleks",
                    "Tambahkan challenge berbasis problem nyata",
                    "Pertahankan presisi, tingkatkan kedalaman pemahaman"
                ]
            },

            2: {
                "learner_type": "Wandering Learner",
                "strength": [
                    "Masih menunjukkan usaha belajar secara berkala",
                    "Tidak sepenuhnya pasif dalam proses belajar"
                ],
                "weakness": [
                    "Performa akademik rendah",
                    "Konsistensi belajar lemah",
                    "Pemanfaatan waktu belajar tidak terarah"
                ],
                "tips": [
                    "Berikan struktur belajar yang jelas dan bertahap",
                    "Fokus pada penguatan konsep dasar",
                    "Gunakan feedback cepat untuk menghindari kehilangan arah belajar"
                ]
            }
        }
        return cluster_interpretation[cluster]



BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "kmeans_model_37_3n_2.pkl"
SCALER_PATH = BASE_DIR / "models" / "kmeans_scaler_1.pkl"

service = ClusterInferenceService(
    model_path=MODEL_PATH,
    scaler_path=SCALER_PATH,
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
def cluster_inference(request: InferenceRequest):
    """
    Predict cluster for a user using their user_id.
    Accepts user_id in the request body as JSON.
    """
    start_time = time.perf_counter()
    INFERENCE_REQUESTS.inc()
    try:
        result = service.infer(user_id=request.user_id)
        latency = time.perf_counter() - start_time
        INFERENCE_LATENCY.observe(latency)
        logger.info("cluster-inference success user_id=%s latency=%.4fs", request.user_id, latency)
        return {"user_id": request.user_id, "result": result}
    except NotImplementedError as exc:
        INFERENCE_ERRORS.inc()
        raise HTTPException(status_code=501, detail=str(exc))
    except Exception as exc:
        INFERENCE_ERRORS.inc()
        logger.exception("cluster-inference failed user_id=%s error=%s", request.user_id, exc)
        raise HTTPException(status_code=400, detail=str(exc))


@app.get("/metrics")
def metrics():
    """Expose Prometheus metrics."""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
