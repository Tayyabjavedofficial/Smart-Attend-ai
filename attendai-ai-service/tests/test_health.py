def test_health_unauthenticated(client):
    """Health doesn't require the service key."""
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["face_backend"] == "stub"
    assert "embedding_dim" in body
    assert body["registered_profiles"] == 0
