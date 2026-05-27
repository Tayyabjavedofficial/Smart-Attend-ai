"""End-to-end tests for /ai/face/*."""

from __future__ import annotations

import base64


def _b64(data: bytes) -> str:
    return base64.b64encode(data).decode()


def test_register_requires_service_key(client, sample_image_b64):
    r = client.post("/ai/face/register", json={"student_id": 1, "images": [sample_image_b64]})
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "AI_AUTH"


def test_register_and_verify_same_image_matches(client, auth_headers):
    img = _b64(b"this-is-pretend-face-bytes" * 64)
    r = client.post("/ai/face/register",
                    json={"student_id": 101, "images": [img]},
                    headers=auth_headers)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["student_id"] == 101
    assert body["samples_used"] == 1
    assert body["embedding_dim"] > 0
    assert body["profile_id"].startswith("fp_")

    # Same image again should match.
    r = client.post("/ai/face/verify",
                    json={"student_id": 101, "image": img},
                    headers=auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["verified"] is True
    assert body["status"] == "VERIFIED"
    assert body["confidence"] > 0.5
    assert body["embedding_distance"] == 0.0  # identical image -> identical embedding


def test_verify_different_image_fails(client, auth_headers):
    enroll = _b64(b"face-A-pretend-bytes" * 64)
    other = _b64(b"face-B-totally-different-bytes" * 64)
    client.post("/ai/face/register",
                json={"student_id": 202, "images": [enroll]},
                headers=auth_headers)
    r = client.post("/ai/face/verify",
                    json={"student_id": 202, "image": other},
                    headers=auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["verified"] is False
    assert body["status"] == "FAILED"


def test_verify_unknown_student_fails(client, auth_headers):
    img = _b64(b"any-bytes" * 64)
    r = client.post("/ai/face/verify",
                    json={"student_id": 9999, "image": img},
                    headers=auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["verified"] is False
    assert body["status"] == "FAILED"
    assert body["metadata"]["reason"] == "no_profile"


def test_register_rejects_when_no_face(client, auth_headers):
    # Tiny payload - stub backend treats it as 'no face detected'.
    tiny = _b64(b"x")
    r = client.post("/ai/face/register",
                    json={"student_id": 303, "images": [tiny]},
                    headers=auth_headers)
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "AI_002"


def test_status_and_delete_roundtrip(client, auth_headers):
    img = _b64(b"hello-face-bytes" * 64)
    client.post("/ai/face/register", json={"student_id": 404, "images": [img]}, headers=auth_headers)

    r = client.get("/ai/face/404", headers=auth_headers)
    assert r.json()["has_profile"] is True

    r = client.delete("/ai/face/404", headers=auth_headers)
    assert r.json()["deleted"] is True

    r = client.get("/ai/face/404", headers=auth_headers)
    assert r.json()["has_profile"] is False


def test_register_averages_multiple_samples(client, auth_headers):
    imgs = [_b64(f"sample-{i}".encode() * 64) for i in range(5)]
    r = client.post("/ai/face/register",
                    json={"student_id": 505, "images": imgs},
                    headers=auth_headers)
    assert r.status_code == 201
    assert r.json()["samples_used"] == 5
    assert r.json()["samples_rejected"] == 0
