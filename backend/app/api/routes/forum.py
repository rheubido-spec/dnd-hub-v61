from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.models import ForumPost, ForumThread, User
from app.schemas.forum import ForumPostCreate, ForumPostRead, ForumThreadCreate, ForumThreadRead

router = APIRouter(prefix="/forum", tags=["forum"])


@router.get("/threads", response_model=list[ForumThreadRead])
def list_threads(db: Session = Depends(get_db)):
    return db.query(ForumThread).options(selectinload(ForumThread.posts)).order_by(ForumThread.created_at.desc()).all()


@router.post("/threads", response_model=ForumThreadRead, status_code=status.HTTP_201_CREATED)
def create_thread(payload: ForumThreadCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    thread = ForumThread(author_id=current_user.id, **payload.model_dump())
    db.add(thread)
    db.commit()
    db.refresh(thread)
    return thread


@router.post("/threads/{thread_id}/posts", response_model=ForumPostRead, status_code=status.HTTP_201_CREATED)
def reply_thread(thread_id: int, payload: ForumPostCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    thread = db.query(ForumThread).filter(ForumThread.id == thread_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    post = ForumPost(thread_id=thread_id, author_id=current_user.id, body=payload.body)
    db.add(post)
    db.commit()
    db.refresh(post)
    return post
