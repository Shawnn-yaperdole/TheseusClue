import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyProjects, createProject } from '../api/projects';

export default function EventPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');

  const fetchProjects = async () => {
    try {
      const res = await getMyProjects();
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await createProject({ title: newTitle });
      setNewTitle('');
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p>Loading projects...</p>;

  return (
    <div>
      <h1>My Events</h1>

      <form onSubmit={handleCreate}>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New event title"
        />
        <button type="submit">Create Project</button>
      </form>

      <ul>
        {projects.map((p) => (
          <li key={p._id}>
            <Link to={`/events/${p._id}`}>{p.title}</Link> — {p.status}
          </li>
        ))}
      </ul>
    </div>
  );
}