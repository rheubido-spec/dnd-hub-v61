from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health():
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json()['status'] == 'ok'


def test_dice_roll():
    response = client.post('/api/v1/dice/roll', json={'count': 2, 'sides': 6, 'modifier': 1})
    assert response.status_code == 200
    payload = response.json()
    assert len(payload['rolls']) == 2
    assert payload['total'] >= 3


def test_reference_links():
    response = client.get('/api/v1/reference/links')
    assert response.status_code == 200
    payload = response.json()
    assert 'official' in payload
    assert 'open' in payload
