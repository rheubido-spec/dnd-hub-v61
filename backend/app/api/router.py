from fastapi import APIRouter
from app.api.routes import admin, auth, campaigns, characters, dice, forum, maps, parties, reference, tracker

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(characters.router)
api_router.include_router(campaigns.router)
api_router.include_router(parties.router)
api_router.include_router(dice.router)
api_router.include_router(forum.router)
api_router.include_router(reference.router)
api_router.include_router(admin.router)
api_router.include_router(maps.router)
api_router.include_router(tracker.router)
