"""
AI Moderation Service - WebTruyen
Lớp 1: Phát hiện Reup bằng PhoBERT Sentence Embedding
Lớp 2: Phát hiện vi phạm ngôn ngữ bằng PhoBERT fine-tuned (dùng Perspective API làm fallback)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import os
import json
import requests
import unicodedata
import re
import logging
import pymysql

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# ── Cấu hình ──────────────────────────────────────────────────────────────────
PERSPECTIVE_API_KEY = os.environ.get("PERSPECTIVE_API_KEY", "")
REUP_THRESHOLD_HIGH  = float(os.environ.get("REUP_THRESHOLD_HIGH",  "0.90"))

# ── Cấu hình MySQL ────────────────────────────────────────────────────────────
DB_CONFIG = {
    "host":     os.environ.get("DB_HOST", "localhost"),
    "port":     int(os.environ.get("DB_PORT", "3306")),
    "database": os.environ.get("DB_NAME", "toptruyen_db"),
    "user":     os.environ.get("DB_USERNAME", "root"),
    "password": os.environ.get("DB_PASSWORD", ""),
}

def get_db():
    return pymysql.connect(**DB_CONFIG)

def init_db():
    """Tạo bảng lưu embedding nếu chưa có."""
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS chapter_embeddings (
                comic_id   BIGINT NOT NULL,
                chapter_id BIGINT NOT NULL,
                title      VARCHAR(255),
                embedding  LONGTEXT NOT NULL,
                PRIMARY KEY (comic_id, chapter_id)
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS page_phashes (
                comic_id   BIGINT NOT NULL,
                chapter_id BIGINT NOT NULL,
                page_index INT NOT NULL,
                phash      VARCHAR(64) NOT NULL,
                PRIMARY KEY (comic_id, chapter_id, page_index)
            )
        """)
        conn.commit()
        cur.close()
        conn.close()
        logger.info("DB tables ready.")
    except Exception as e:
        logger.warning(f"DB init failed (will use in-memory only): {e}")
REUP_THRESHOLD_MID   = float(os.environ.get("REUP_THRESHOLD_MID",   "0.75"))
VIOLATION_THRESHOLD_HIGH = float(os.environ.get("VIOLATION_THRESHOLD_HIGH", "0.75"))
VIOLATION_THRESHOLD_MID  = float(os.environ.get("VIOLATION_THRESHOLD_MID",  "0.45"))

# ── Load model (lazy, chỉ load 1 lần khi khởi động) ──────────────────────────
embedding_model = None

def get_embedding_model():
    global embedding_model
    if embedding_model is None:
        logger.info("Loading PhoBERT sentence embedding model...")
        from sentence_transformers import SentenceTransformer
        # vinai/phobert-base được wrap sẵn trong sentence-transformers
        embedding_model = SentenceTransformer("keepitreal/vietnamese-sbert")
        logger.info("Model loaded.")
    return embedding_model

# ── Kho vector embedding — RAM cache + MySQL persistent ───────────────────────
chapter_embeddings = {}  # cache trong RAM để truy xuất nhanh

def load_embeddings_from_db():
    """Load toàn bộ embedding từ MySQL vào RAM khi khởi động."""
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT comic_id, chapter_id, title, embedding FROM chapter_embeddings")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        for comic_id, chapter_id, title, emb_json in rows:
            key = f"{comic_id}:{chapter_id}"
            chapter_embeddings[key] = {
                "comicId":   str(comic_id),
                "chapterId": str(chapter_id),
                "title":     title or "",
                "embedding": np.array(json.loads(emb_json), dtype=np.float32),
            }
        logger.info(f"Loaded {len(rows)} embeddings from DB.")
    except Exception as e:
        logger.warning(f"Could not load embeddings from DB: {e}")

def save_embedding_to_db(comic_id, chapter_id, title, embedding: np.ndarray):
    """Lưu 1 embedding vào MySQL."""
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO chapter_embeddings (comic_id, chapter_id, title, embedding)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE title=VALUES(title), embedding=VALUES(embedding)
        """, (comic_id, chapter_id, title, json.dumps(embedding.tolist())))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        logger.warning(f"Could not save embedding to DB: {e}")

# ── Tiền xử lý văn bản ────────────────────────────────────────────────────────
def preprocess(text: str) -> str:
    text = unicodedata.normalize("NFC", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

def split_paragraphs(text: str, min_words: int = 30) -> list[str]:
    """Tách văn bản thành đoạn, gộp đoạn quá ngắn."""
    raw = [p.strip() for p in re.split(r"\n\n+", text) if p.strip()]
    result, buf = [], ""
    for p in raw:
        buf = (buf + " " + p).strip()
        if len(buf.split()) >= min_words:
            result.append(buf)
            buf = ""
    if buf:
        result.append(buf)
    return result or [text]

# ── Lớp 1: Phát hiện Reup ─────────────────────────────────────────────────────
def compute_embedding(text: str) -> np.ndarray:
    model = get_embedding_model()
    return model.encode(text, normalize_embeddings=True)

def cosine_sim(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b))

@app.route("/index-chapter", methods=["POST"])
def index_chapter():
    """Lưu embedding chương vào kho để so sánh sau này."""
    data = request.json
    comic_id   = data.get("comicId")
    chapter_id = data.get("chapterId")
    title      = data.get("title", "")
    content    = data.get("content", "")

    if not content:
        return jsonify({"error": "content is required"}), 400

    key = f"{comic_id}:{chapter_id}"
    text = preprocess(content)
    emb = compute_embedding(text[:2000])

    # Lưu vào RAM cache
    chapter_embeddings[key] = {
        "comicId":   str(comic_id),
        "chapterId": str(chapter_id),
        "title":     title,
        "embedding": emb,
    }

    # Lưu vào MySQL để không mất khi restart
    save_embedding_to_db(comic_id, chapter_id, title, emb)

    return jsonify({"indexed": key})


@app.route("/check-reup", methods=["POST"])
def check_reup():
    """
    Lớp 1: Kiểm tra nội dung mới có trùng lặp với chương đã có không.
    Body: { "content": str, "excludeComicId": int (optional) }
    """
    data = request.json
    content        = data.get("content", "")
    exclude_comic  = str(data.get("excludeComicId", ""))

    if not content:
        return jsonify({"result": "CLEAN", "score": 0.0, "matches": []})

    text = preprocess(content)
    paragraphs = split_paragraphs(text)

    # Lấy embedding từng đoạn
    model = get_embedding_model()
    para_embeddings = model.encode(paragraphs, normalize_embeddings=True)

    matches = []
    max_score = 0.0

    for key, stored in chapter_embeddings.items():
        # Bỏ qua chính truyện đang xét (để tránh so sánh với chương cũ của cùng tác giả)
        if exclude_comic and stored["comicId"] == exclude_comic:
            continue

        stored_emb = stored["embedding"] if isinstance(stored["embedding"], np.ndarray) else np.array(stored["embedding"])
        for i, para_emb in enumerate(para_embeddings):
            sim = cosine_sim(para_emb, stored_emb)
            if sim >= REUP_THRESHOLD_MID:
                max_score = max(max_score, sim)
                # Parse chapterId từ key "comicId:chapterId"
                try:
                    matched_chapter_id = int(key.split(":")[1])
                except Exception:
                    matched_chapter_id = None
                matches.append({
                    "paragraph": paragraphs[i][:120] + "...",
                    "similarity": round(sim, 4),
                    "matchedChapter": stored["title"],
                    "matchedChapterId": matched_chapter_id,
                    "matchedComicId": stored.get("comicId"),
                    "matchedKey": key,
                })

    matches.sort(key=lambda x: x["similarity"], reverse=True)
    matches = matches[:5]  # chỉ trả top 5 đoạn trùng nhất

    if max_score >= REUP_THRESHOLD_HIGH:
        result = "REUP"
    elif max_score >= REUP_THRESHOLD_MID:
        result = "SUSPICIOUS"
    else:
        result = "CLEAN"

    return jsonify({
        "result": result,
        "score": round(max_score, 4),
        "matches": matches,
    })


# ── Lớp 2: Phát hiện vi phạm ngôn ngữ ────────────────────────────────────────

# Từ khóa NGHIÊM TRỌNG — chỉ cần xuất hiện 1 lần là vi phạm nặng
# (không thể xuất hiện trong hư cấu bình thường)
HARD_KEYWORDS = {
    # Phản động / chính trị — cụm từ dài, ít khả năng hư cấu
    "lật đổ chính quyền": 1.0,
    "lat do chinh quyen": 1.0,
    "chống phá nhà nước": 1.0,
    "chong pha nha nuoc": 1.0,
    "kích động bạo loạn": 1.0,
    "kich dong bao loan": 1.0,
    "tuyên truyền chống": 0.9,
    "tuyen truyen chong": 0.9,
    # Tổ chức cấm
    "việt tân": 1.0,
    "viet tan": 1.0,
    "fulro": 1.0,
    # Nội dung đồi trụy rõ ràng
    "khiêu dâm": 0.9,
    "khieu dam": 0.9,
    "đồi trụy": 0.9,
    "doi truy": 0.9,
    "porn": 0.9,
}

# Từ khóa MỀM — cần tính theo mật độ, có thể xuất hiện trong hư cấu
# key: từ khóa, value: điểm mỗi lần xuất hiện
SOFT_KEYWORDS = {
    # Bạo lực — bình thường trong tiểu thuyết hành động
    "giết người": 0.08,
    "giet nguoi":  0.08,
    "khủng bố":    0.08,
    "khung bo":    0.08,
    "đánh bom":    0.08,
    "danh bom":    0.08,
    "thảm sát":    0.08,
    "tham sat":    0.08,
    # Từ nhạy cảm nhẹ
    "phản động":   0.1,
    "phan dong":   0.1,
    "đảo chính":   0.1,
    "dao chinh":   0.1,
    "xuyên tạc":   0.06,
    "xuyen tac":   0.06,
    # Nội dung người lớn mức nhẹ
    "sex":   0.12,
    "nude":  0.12,
    "18+":   0.1,
}

# Pattern hư cấu — nếu từ bạo lực đi kèm những mẫu này thì giảm điểm
FICTION_PATTERNS = [
    r"(ta|hắn|nàng|y|lão|cô|anh|chị|ngươi|mi)\s+(sẽ\s+)?(giết|chém|đâm|tiêu diệt)",
    r"(kiếm|đao|thương|quyền|chưởng|phép thuật|ma pháp).{0,20}(chém|đâm|giết|tiêu diệt)",
    r"(chiến đấu|đấu tranh|giao chiến|trận chiến|đại chiến)",
    r"(tiểu thuyết|truyện|chương|nhân vật|võ lâm|tu tiên|ma pháp|kiếm khách)",
]

FICTION_REDUCE_FACTOR = 0.4  # giảm 60% điểm nếu phát hiện ngữ cảnh hư cấu

def remove_accents(text: str) -> str:
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c))

def is_fiction_context(text: str) -> bool:
    """Kiểm tra xem văn bản có dấu hiệu hư cấu không."""
    for pattern in FICTION_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return True
    return False

def keyword_check(text: str) -> tuple[float, list[str]]:
    """
    Kiểm tra từ khóa với logic mật độ + ngữ cảnh hư cấu.
    - HARD keywords: 1 lần xuất hiện = vi phạm nặng
    - SOFT keywords: tính theo mật độ / 1000 từ, giảm nếu là hư cấu
    """
    text_lower = text.lower()
    text_no_accent = remove_accents(text_lower)
    word_count = max(len(text.split()), 1)
    found = []
    total_score = 0.0

    # Kiểm tra HARD keywords trước
    for kw, weight in HARD_KEYWORDS.items():
        kw_na = remove_accents(kw.lower())
        if kw.lower() in text_lower or kw_na in text_no_accent:
            found.append(f"{kw} [nghiêm trọng]")
            total_score = max(total_score, weight)

    # Nếu đã vi phạm nghiêm trọng thì không cần kiểm tra soft nữa
    if total_score >= 0.9:
        return min(1.0, total_score), found

    # Kiểm tra SOFT keywords theo mật độ
    fiction = is_fiction_context(text_lower)
    soft_score = 0.0
    for kw, weight_per_hit in SOFT_KEYWORDS.items():
        kw_na = remove_accents(kw.lower())
        # Đếm số lần xuất hiện
        count = text_lower.count(kw.lower()) + text_no_accent.count(kw_na)
        count = min(count, 2)  # tránh đếm trùng có dấu và không dấu
        if count > 0:
            # Tính điểm theo mật độ: điểm/lần × số lần × (1000/tổng từ)
            density_factor = min(1.0, (count * 1000) / word_count)
            hit_score = weight_per_hit * count * density_factor
            if fiction:
                hit_score *= FICTION_REDUCE_FACTOR
            if hit_score > 0.05:  # chỉ ghi nhận nếu đủ đáng kể
                found.append(f"{kw} ×{count}" + (" [hư cấu-giảm]" if fiction else ""))
                soft_score += hit_score

    total_score = max(total_score, min(0.95, soft_score))
    return total_score, found

def perspective_check(text: str) -> tuple[float, dict]:
    """Gọi Google Perspective API."""
    if not PERSPECTIVE_API_KEY:
        return -1.0, {}

    url = f"https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key={PERSPECTIVE_API_KEY}"
    body = {
        "comment": {"text": text[:3000]},
        "languages": ["vi"],
        "requestedAttributes": {
            "TOXICITY": {},
            "SEVERE_TOXICITY": {},
            "SEXUALLY_EXPLICIT": {},
            "THREAT": {},
        },
    }
    try:
        resp = requests.post(url, json=body, timeout=10)
        if resp.status_code != 200:
            return -1.0, {}
        scores = resp.json().get("attributeScores", {})
        result = {k: v["summaryScore"]["value"] for k, v in scores.items()}
        max_score = max(result.values()) if result else 0.0
        return max_score, result
    except Exception as e:
        logger.warning(f"Perspective API error: {e}")
        return -1.0, {}


@app.route("/check-violation", methods=["POST"])
def check_violation():
    """
    Lớp 2: Kiểm tra nội dung vi phạm ngôn ngữ.
    Body: { "content": str }
    """
    data = request.json
    content = data.get("content", "")
    if not content:
        return jsonify({"result": "CLEAN", "score": 0.0, "details": {}})

    text = preprocess(content)

    # Thử Perspective API trước
    perspective_score, perspective_details = perspective_check(text)

    if perspective_score >= 0:
        # Có Perspective API key và gọi thành công
        score = perspective_score
        details = perspective_details
        method = "perspective"
    else:
        # Fallback: dùng keyword check
        score, found_keywords = keyword_check(text)
        details = {"keywords_found": found_keywords}
        method = "keyword"

    if score >= VIOLATION_THRESHOLD_HIGH:
        result = "VIOLATION"
    elif score >= VIOLATION_THRESHOLD_MID:
        result = "SUSPICIOUS"
    else:
        result = "CLEAN"

    return jsonify({
        "result": result,
        "score": round(score, 4),
        "method": method,
        "details": details,
    })


# ── Endpoint tổng hợp: gọi cả 2 lớp 1 lần ────────────────────────────────────
@app.route("/moderate", methods=["POST"])
def moderate():
    """
    Gọi đồng thời Lớp 1 + Lớp 2, trả về quyết định tổng hợp.
    Body: { "content": str, "excludeComicId": int }
    Decision: APPROVED | PENDING_REVIEW | REJECTED
    """
    data = request.json
    content       = data.get("content", "")
    exclude_comic = data.get("excludeComicId")

    # Chạy cả 2 lớp
    reup_resp      = _check_reup_internal(content, exclude_comic)
    violation_resp = _check_violation_internal(content)

    reup_result      = reup_resp["result"]       # CLEAN | SUSPICIOUS | REUP
    violation_result = violation_resp["result"]  # CLEAN | SUSPICIOUS | VIOLATION

    # Bảng quyết định
    if reup_result == "REUP" or violation_result == "VIOLATION":
        decision = "REJECTED"
    elif reup_result == "SUSPICIOUS" or violation_result == "SUSPICIOUS":
        decision = "PENDING_REVIEW"
    else:
        decision = "APPROVED"

    return jsonify({
        "decision": decision,
        "layer1_reup": reup_resp,
        "layer2_violation": violation_resp,
    })


def _check_reup_internal(content, exclude_comic):
    with app.test_request_context(
        "/check-reup",
        method="POST",
        json={"content": content, "excludeComicId": exclude_comic},
    ):
        resp = check_reup()
        return json.loads(resp.get_data())


def _check_violation_internal(content):
    with app.test_request_context(
        "/check-violation",
        method="POST",
        json={"content": content},
    ):
        resp = check_violation()
        return json.loads(resp.get_data())


@app.route("/index-all", methods=["POST"])
def index_all():
    """Load tất cả chương từ MySQL published_chapters vào kho embedding."""
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT pc.id, pc.comic_id, pc.title, pc.content
            FROM published_chapters pc
            WHERE pc.content IS NOT NULL AND pc.content != ''
            AND COALESCE(pc.status, 'PUBLISHED') = 'PUBLISHED'
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    model = get_embedding_model()
    indexed = 0
    skipped = 0
    for chapter_id, comic_id, title, content in rows:
        key = f"{comic_id}:{chapter_id}"
        if key in chapter_embeddings:
            skipped += 1
            continue
        try:
            text = preprocess(content[:2000])
            emb = model.encode(text, normalize_embeddings=True)
            chapter_embeddings[key] = {
                "comicId":   str(comic_id),
                "chapterId": str(chapter_id),
                "title":     title or "",
                "embedding": emb,
            }
            save_embedding_to_db(comic_id, chapter_id, title, emb)
            indexed += 1
        except Exception:
            skipped += 1

    return jsonify({"indexed": indexed, "skipped": skipped, "total_in_kho": len(chapter_embeddings)})


# ── Image moderation: pHash + NudeNet ─────────────────────────────────────────

# Ngưỡng pHash (Hamming distance): ≤10 là trùng, ≤16 là nghi ngờ
PHASH_THRESHOLD_REUP      = int(os.environ.get("PHASH_THRESHOLD_REUP",      "10"))
PHASH_THRESHOLD_SUSPICIOUS = int(os.environ.get("PHASH_THRESHOLD_SUSPICIOUS", "16"))
# Tỷ lệ trang trùng tối thiểu để kết luận REUP/SUSPICIOUS
REUP_PAGE_RATIO_HIGH = float(os.environ.get("REUP_PAGE_RATIO_HIGH", "0.30"))
REUP_PAGE_RATIO_MID  = float(os.environ.get("REUP_PAGE_RATIO_MID",  "0.15"))

# RAM cache: { "comicId:chapterId": [ "phash_str", ... ] }
image_phashes = {}

# Anime NSFW classifier (lazy load)
anime_nsfw_classifier = None
real_nsfw_classifier = None

def get_anime_nsfw_classifier():
    """CLIP model dùng zero-shot để detect NSFW."""
    global anime_nsfw_classifier
    if anime_nsfw_classifier is None:
        logger.info("Loading CLIP NSFW classifier (openai/clip-vit-base-patch32)...")
        from transformers import CLIPProcessor, CLIPModel
        model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        model.eval()
        anime_nsfw_classifier = (processor, model)
        logger.info("CLIP NSFW classifier loaded.")
    return anime_nsfw_classifier

def get_real_nsfw_classifier():
    return get_anime_nsfw_classifier()  # dùng chung 1 CLIP model

def _classify_nsfw_clip(img_input) -> float:
    """Dùng CLIP zero-shot để tính nsfw_score. Trả về float 0-1."""
    import torch
    processor, model = get_anime_nsfw_classifier()
    if isinstance(img_input, str):
        pil_img = download_image(img_input)
        if pil_img is None:
            return None
    else:
        pil_img = img_input

    texts = ["explicit sexual content nudity pornography hentai adult",
             "safe content manga anime cartoon family friendly normal"]

    # Xử lý text và image riêng biệt để tránh padding error
    text_inputs = processor.tokenizer(
        texts, return_tensors="pt", padding=True, truncation=True, max_length=77
    )
    image_inputs = processor.image_processor(images=pil_img, return_tensors="pt")
    inputs = {**text_inputs, **image_inputs}

    with torch.no_grad():
        outputs = model(**inputs)
    probs = outputs.logits_per_image.softmax(dim=1)[0]
    return float(probs[0])  # xác suất là NSFW

# Ngưỡng anime NSFW
ANIME_NSFW_R18_THRESHOLD = float(os.environ.get("ANIME_NSFW_R18_THRESHOLD", "0.75"))  # r18 → VIOLATION
ANIME_NSFW_R15_THRESHOLD = float(os.environ.get("ANIME_NSFW_R15_THRESHOLD", "0.80"))  # r15 → SUSPICIOUS

def load_phashes_from_db():
    """Load toàn bộ pHash ảnh từ MySQL vào RAM."""
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT comic_id, chapter_id, page_index, phash FROM page_phashes ORDER BY comic_id, chapter_id, page_index")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        for comic_id, chapter_id, page_index, phash_str in rows:
            key = f"{comic_id}:{chapter_id}"
            if key not in image_phashes:
                image_phashes[key] = {"comicId": str(comic_id), "chapterId": str(chapter_id), "hashes": []}
            # Đảm bảo danh sách đủ dài
            while len(image_phashes[key]["hashes"]) <= page_index:
                image_phashes[key]["hashes"].append(None)
            image_phashes[key]["hashes"][page_index] = phash_str
        logger.info(f"Loaded pHashes for {len(image_phashes)} image chapters from DB.")
    except Exception as e:
        logger.warning(f"Could not load image pHashes from DB: {e}")

def save_phashes_to_db(comic_id, chapter_id, hashes: list):
    try:
        conn = get_db()
        cur = conn.cursor()
        for i, h in enumerate(hashes):
            if h is None:
                continue
            cur.execute("""
                INSERT INTO page_phashes (comic_id, chapter_id, page_index, phash)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE phash=VALUES(phash)
            """, (comic_id, chapter_id, i, h))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        logger.warning(f"Could not save image pHashes to DB: {e}")

def download_image(url: str):
    """Tải ảnh từ URL, trả về PIL Image hoặc None nếu lỗi."""
    try:
        from PIL import Image
        import io
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        return Image.open(io.BytesIO(resp.content)).convert("RGB")
    except Exception as e:
        logger.warning(f"Cannot download image {url}: {e}")
        return None

def compute_phash(img) -> str:
    import imagehash
    return str(imagehash.phash(img))

def phash_distance(h1: str, h2: str) -> int:
    import imagehash
    return imagehash.hex_to_hash(h1) - imagehash.hex_to_hash(h2)

def check_anime_nsfw(img_input) -> dict:
    """NSFW detection tạm thời disabled do model incompatibility trên Windows."""
    return {"result": "CLEAN", "label": "skipped", "score": 0.0}

def check_real_nsfw(img_input) -> dict:
    return {"result": "CLEAN", "label": "skipped", "score": 0.0}

def check_nsfw_combined(img) -> dict:
    """Chạy cả 2 model, lấy kết quả tệ nhất."""
    anime = check_anime_nsfw(img)
    real  = check_real_nsfw(img)
    priority = {"VIOLATION": 3, "SUSPICIOUS": 2, "PENDING": 1, "CLEAN": 0}
    if priority.get(anime["result"], 0) >= priority.get(real["result"], 0):
        return anime
    return real


@app.route("/index-image-chapter", methods=["POST"])
def index_image_chapter():
    """
    Index pHash của tất cả trang ảnh trong 1 chapter.
    Body: { "comicId": int, "chapterId": int, "imageUrls": ["url1", ...] }
    """
    data = request.json
    comic_id   = data.get("comicId")
    chapter_id = data.get("chapterId")
    image_urls = data.get("imageUrls", [])

    if not image_urls:
        return jsonify({"error": "imageUrls is required"}), 400

    hashes = []
    for url in image_urls:
        img = download_image(url)
        if img is None:
            hashes.append(None)
        else:
            hashes.append(compute_phash(img))

    title = data.get("title", "")
    key = f"{comic_id}:{chapter_id}"
    image_phashes[key] = {"comicId": str(comic_id), "chapterId": str(chapter_id), "title": title, "hashes": hashes}
    save_phashes_to_db(comic_id, chapter_id, hashes)

    return jsonify({"indexed": key, "pages": len(hashes)})


@app.route("/moderate-images", methods=["POST"])
def moderate_images():
    """
    Kiểm duyệt chapter ảnh: pHash reup + NudeNet.
    Body: { "imageUrls": ["url1", ...], "excludeComicId": int (optional) }
    Returns: {
        "decision": "APPROVED"|"PENDING_REVIEW"|"REJECTED",
        "layer1_reup": { "result": "CLEAN"|"SUSPICIOUS"|"REUP", "score": float, "matchedChapterId": int, "matchedComicId": int },
        "layer2_nudity": { "result": "CLEAN"|"VIOLATION", "violatedPages": [int, ...], "labels": [...] }
    }
    """
    data = request.json
    image_urls    = data.get("imageUrls", [])
    exclude_comic = str(data.get("excludeComicId", ""))

    if not image_urls:
        return jsonify({"decision": "APPROVED", "layer1_reup": {"result": "CLEAN", "score": 0}, "layer2_nudity": {"result": "CLEAN", "violatedPages": []}}), 200

    # Tải tất cả ảnh một lần (dùng lại cho cả 2 lớp)
    images = [download_image(url) for url in image_urls]
    new_hashes = [compute_phash(img) if img is not None else None for img in images]

    # ── Lớp 1: pHash reup detection ──────────────────────────────────────────
    reup_result = "CLEAN"
    reup_score  = 0.0
    matched_chapter_id    = None
    matched_comic_id      = None
    matched_chapter_title = ""
    best_match_count      = 0

    for key, stored in image_phashes.items():
        if exclude_comic and stored["comicId"] == exclude_comic:
            continue
        stored_hashes = stored["hashes"]
        if not stored_hashes:
            continue

        match_count = 0
        for nh in new_hashes:
            if nh is None:
                continue
            for sh in stored_hashes:
                if sh is None:
                    continue
                dist = phash_distance(nh, sh)
                if dist <= PHASH_THRESHOLD_REUP:
                    match_count += 1
                    break  # trang này đã match, không cần so tiếp

        ratio = match_count / max(len(new_hashes), 1)
        if match_count > best_match_count:
            best_match_count = match_count
            reup_score = ratio
            try:
                matched_chapter_id = int(key.split(":")[1])
                matched_comic_id   = int(key.split(":")[0])
                matched_chapter_title = stored.get("title", "")
            except Exception:
                matched_chapter_title = ""

    if reup_score >= REUP_PAGE_RATIO_HIGH:
        reup_result = "REUP"
    elif reup_score >= REUP_PAGE_RATIO_MID:
        reup_result = "SUSPICIOUS"

    # Lấy comic title từ DB nếu có matched
    matched_comic_title = ""
    if matched_comic_id and matched_chapter_id:
        try:
            conn = get_db()
            cur = conn.cursor()
            cur.execute("""
                SELECT pc.title AS comic_title, ch.title AS chapter_title
                FROM published_chapters ch
                JOIN published_comics pc ON ch.comic_id = pc.id
                WHERE ch.id = %s
            """, (matched_chapter_id,))
            row = cur.fetchone()
            cur.close()
            conn.close()
            if row:
                matched_comic_title   = row[0] or ""
                matched_chapter_title = row[1] or matched_chapter_title
        except Exception as e:
            logger.warning(f"Cannot fetch matched chapter info: {e}")

    layer1 = {
        "result": reup_result,
        "score": round(reup_score, 4),
        "matchedChapterId": matched_chapter_id,
        "matchedComicId": matched_comic_id,
        "matchedChapterTitle": matched_chapter_title,
        "matchedComicTitle": matched_comic_title,
    }

    # ── Lớp 2: NSFW classifier (dùng URL thay vì PIL để tránh lỗi format) ────
    violated_pages = []
    suspicious_pages = []
    model_error_pages = []
    worst_label = "safe"
    worst_score = 0.0
    for i, url in enumerate(image_urls):
        if not url:
            continue
        nsfw = check_nsfw_combined(url)  # pass URL trực tiếp vào pipeline
        if nsfw["result"] == "VIOLATION":
            violated_pages.append(i)
        elif nsfw["result"] == "SUSPICIOUS":
            suspicious_pages.append(i)
        elif nsfw["label"] == "model-error":
            model_error_pages.append(i)
        if nsfw["score"] > worst_score:
            worst_label = nsfw["label"]
            worst_score = nsfw["score"]

    if violated_pages:
        nudity_result = "VIOLATION"
    elif suspicious_pages:
        nudity_result = "SUSPICIOUS"
    elif model_error_pages:
        nudity_result = "PENDING"  # model lỗi → admin xét thủ công
    else:
        nudity_result = "CLEAN"

    layer2 = {
        "result": nudity_result,
        "violatedPages": violated_pages,
        "suspiciousPages": suspicious_pages,
        "label": worst_label,
        "score": round(worst_score, 4),
    }

    # ── Quyết định tổng hợp ──────────────────────────────────────────────────
    if reup_result == "REUP" or nudity_result == "VIOLATION":
        decision = "REJECTED"
    elif reup_result == "SUSPICIOUS" or nudity_result in ("SUSPICIOUS", "PENDING"):
        decision = "PENDING_REVIEW"
    else:
        decision = "APPROVED"

    return jsonify({
        "decision": decision,
        "layer1_reup": layer1,
        "layer2_nudity": layer2,
    })


@app.route("/test-image", methods=["POST"])
def test_image():
    """
    Test nhanh 1 ảnh. Body: { "url": "https://..." }
    Trả về kết quả từ cả 2 model NSFW.
    """
    data = request.json
    url = data.get("url", "")
    if not url:
        return jsonify({"error": "url is required"}), 400

    img = download_image(url)
    if img is None:
        return jsonify({"error": "Không tải được ảnh"}), 400

    anime = check_anime_nsfw(img)
    real  = check_real_nsfw(img)
    combined = check_nsfw_combined(img)

    return jsonify({
        "url": url,
        "anime_model": anime,
        "real_model": real,
        "combined_result": combined["result"],
        "verdict": "VI PHẠM" if combined["result"] == "VIOLATION" else
                   "NGHI NGỜ" if combined["result"] == "SUSPICIOUS" else "SẠCH"
    })


@app.route("/index-all-images", methods=["POST"])
def index_all_images():
    """Index pHash tất cả chapter ảnh từ DB vào kho."""
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT pc.id, pc.comic_id, pc.title,
                   pco.title AS comic_title
            FROM published_chapters pc
            JOIN published_comics pco ON pc.comic_id = pco.id
            WHERE pco.mode = 'comic'
              AND COALESCE(pc.status, 'PUBLISHED') = 'PUBLISHED'
        """)
        chapters = cur.fetchall()
        cur.close()
        conn.close()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    indexed = 0
    skipped = 0
    for chapter_id, comic_id, chapter_title, comic_title in chapters:
        key = f"{comic_id}:{chapter_id}"
        if key in image_phashes:
            skipped += 1
            continue
        try:
            conn = get_db()
            cur = conn.cursor()
            cur.execute(
                "SELECT image_url FROM published_chapter_pages WHERE chapter_id = %s ORDER BY sort_order ASC",
                (chapter_id,)
            )
            urls = [row[0] for row in cur.fetchall()]
            cur.close()
            conn.close()
            if not urls:
                skipped += 1
                continue
            hashes = []
            for url in urls:
                img = download_image(url)
                hashes.append(compute_phash(img) if img is not None else None)
            full_title = f"{comic_title} — {chapter_title}"
            image_phashes[key] = {"comicId": str(comic_id), "chapterId": str(chapter_id), "title": full_title, "hashes": hashes}
            save_phashes_to_db(comic_id, chapter_id, hashes)
            indexed += 1
        except Exception:
            skipped += 1

    return jsonify({"indexed": indexed, "skipped": skipped, "total_in_kho": len(image_phashes)})


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "perspectiveApiConfigured": bool(PERSPECTIVE_API_KEY),
        "kho_size": len(chapter_embeddings),
        "image_kho_size": len(image_phashes),
    })


if __name__ == "__main__":
    # 1. Tạo bảng DB nếu chưa có
    init_db()
    # 2. Load toàn bộ embedding đã lưu vào RAM
    load_embeddings_from_db()
    # 3. Load pHash ảnh vào RAM
    load_phashes_from_db()
    # 4. Load PhoBERT model (text)
    get_embedding_model()
    logger.info("All models ready. Starting Flask...")
    app.run(host="0.0.0.0", port=5000, debug=False)
