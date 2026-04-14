import { FormEvent, useEffect, useState } from 'react'
import { apiFetch } from '../api/client'
import type { ForumThread } from '../types'

export function ForumPage() {
  const [items, setItems] = useState<ForumThread[]>([])
  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState('rules')
  const [body, setBody] = useState('')

  async function load() {
    const data = await apiFetch<ForumThread[]>('/forum/threads')
    setItems(data)
  }

  useEffect(() => { void load() }, [])

  async function create(e: FormEvent) {
    e.preventDefault()
    await apiFetch<ForumThread>('/forum/threads', {
      method: 'POST',
      body: JSON.stringify({ title, topic, body }),
    })
    setTitle('')
    setTopic('rules')
    setBody('')
    await load()
  }

  return (
    <section className="grid two-col">
      <article className="card stack">
        <h2>Start a help thread</h2>
        <form onSubmit={create} className="form-grid">
          <label>
            Thread title
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="How should I pace a dragon mystery?" />
            <span className="field-hint">Use a short, clear title other players and DMs can scan quickly.</span>
          </label>
          <label>
            Topic
            <select value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="rules">Rules</option>
              <option value="dm-help">DM Help</option>
              <option value="character-builds">Character Builds</option>
              <option value="campaign-design">Campaign Design</option>
            </select>
            <span className="field-hint">Categorize the thread so the right people can find it.</span>
          </label>
          <label>
            Post body
            <textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Ask your question, share details, and explain what kind of help you need." />
            <span className="field-hint">Include enough context for other users to give useful replies.</span>
          </label>
          <button type="submit">Post thread</button>
        </form>
      </article>
      <article className="card stack">
        <h2>Recent threads</h2>
        <div className="stack">
          {items.map((item) => (
            <div key={item.id} className="list-item">
              <strong>{item.title}</strong>
              <span>{item.topic}</span>
              <p>{item.body}</p>
              <small>{item.posts.length} replies</small>
            </div>
          ))}
          {!items.length && <p>No threads yet.</p>}
        </div>
      </article>
    </section>
  )
}