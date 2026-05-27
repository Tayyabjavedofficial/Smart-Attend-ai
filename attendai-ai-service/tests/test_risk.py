"""Risk endpoint tests. Numbers must match com.attendai.attendance.verification.RiskScorer."""


def test_low_risk_when_everything_clean(client, auth_headers):
    r = client.post("/ai/proxy/risk-score", json={
        "wrong_code_attempts": 0, "device_trusted": True,
        "device_used_by_multiple_accounts": False, "face_failed": False,
        "face_confidence": 0.95, "late_by_seconds": 0, "duplicate_attempt": False,
        "missed_random_challenges": 0, "suspicious_ip_pattern": False,
    }, headers=auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["score"] == 0
    assert body["level"] == "LOW"
    assert body["factors"] == []


def test_face_failure_alone_is_medium(client, auth_headers):
    r = client.post("/ai/proxy/risk-score", json={
        "wrong_code_attempts": 0, "device_trusted": True,
        "device_used_by_multiple_accounts": False, "face_failed": True,
        "face_confidence": 0.0, "late_by_seconds": 0, "duplicate_attempt": False,
        "missed_random_challenges": 0, "suspicious_ip_pattern": False,
    }, headers=auth_headers)
    body = r.json()
    assert body["score"] == 40
    assert body["level"] == "MEDIUM"
    assert "face_failed" in body["factors"]


def test_multi_account_plus_untrusted_is_medium(client, auth_headers):
    r = client.post("/ai/proxy/risk-score", json={
        "wrong_code_attempts": 0, "device_trusted": False,
        "device_used_by_multiple_accounts": True, "face_failed": False,
        "face_confidence": 0.9, "late_by_seconds": 0, "duplicate_attempt": False,
        "missed_random_challenges": 0, "suspicious_ip_pattern": False,
    }, headers=auth_headers)
    body = r.json()
    assert body["score"] == 50  # 20 + 30
    assert body["level"] == "MEDIUM"


def test_pile_on_critical(client, auth_headers):
    r = client.post("/ai/proxy/risk-score", json={
        "wrong_code_attempts": 3, "device_trusted": False,
        "device_used_by_multiple_accounts": True, "face_failed": True,
        "face_confidence": 0.0, "late_by_seconds": 30, "duplicate_attempt": False,
        "missed_random_challenges": 2, "suspicious_ip_pattern": True,
    }, headers=auth_headers)
    body = r.json()
    # 30 + 20 + 30 + 40 + 50 + 10 + 20 = 200, capped at 100.
    assert body["score"] == 100
    assert body["level"] == "CRITICAL"


def test_low_face_confidence_adds_proportional_penalty(client, auth_headers):
    r = client.post("/ai/proxy/risk-score", json={
        "wrong_code_attempts": 0, "device_trusted": True,
        "device_used_by_multiple_accounts": False, "face_failed": False,
        "face_confidence": 0.50,  # 25 points below threshold of 0.75
        "late_by_seconds": 0, "duplicate_attempt": False,
        "missed_random_challenges": 0, "suspicious_ip_pattern": False,
    }, headers=auth_headers)
    body = r.json()
    assert 20 <= body["score"] <= 25
    assert body["level"] == "LOW"


def test_risk_requires_service_key(client):
    r = client.post("/ai/proxy/risk-score", json={
        "wrong_code_attempts": 0, "device_trusted": True,
        "device_used_by_multiple_accounts": False, "face_failed": False,
        "face_confidence": 0.95, "late_by_seconds": 0, "duplicate_attempt": False,
        "missed_random_challenges": 0, "suspicious_ip_pattern": False,
    })
    assert r.status_code == 401
