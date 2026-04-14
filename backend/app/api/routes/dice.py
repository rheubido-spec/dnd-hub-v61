import random
from fastapi import APIRouter
from app.schemas.dice import DiceRollRequest, DiceRollResponse

router = APIRouter(prefix="/dice", tags=["dice"])


@router.post("/roll", response_model=DiceRollResponse)
def roll_dice(payload: DiceRollRequest):
    rolls = [random.randint(1, payload.sides) for _ in range(payload.count)]
    total = sum(rolls) + payload.modifier
    return DiceRollResponse(rolls=rolls, modifier=payload.modifier, total=total)
