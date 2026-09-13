import sys
sys.path.append('.')
from app import app
from shared.sdk.database import get_db_session
from shared.sdk.models import Encounter

db = next(get_db_session())
enc = db.query(Encounter).filter(Encounter.patient_id == "5538ae7e-de3a-4651-b52d-c39d4068a14b").first()

if enc:
    print(f"Found encounter: {enc.id}")
    client = app.test_client()
    
    # We need to mock _get_current_user in the route? Or just disable the decorator?
    # Better yet, just call get_clinical_data function directly
    with app.app_context():
        # Using a dummy request context
        with app.test_request_context():
            from app import get_clinical_data
            # Mock _get_current_user to return a dummy user or just let it pass
            import app as app_module
            class DummyUser:
                sub = "dummy"
            app_module._get_current_user = lambda: DummyUser()
            
            res = get_clinical_data(str(enc.id))
            print(res.get_json())
else:
    print("No encounter found for this patient.")
